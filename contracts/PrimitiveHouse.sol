// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   Primitive House
/// @author  Primitive
/// @dev     Interacts with Primitive Engine contracts

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/v2-core/contracts/libraries/Margin.sol";

import "./interfaces/IPrimitiveHouse.sol";
import "./interfaces/IPrimitiveHouseEvents.sol";

import "./libraries/PositionHouse.sol";

contract PrimitiveHouse is IPrimitiveHouse, IPrimitiveHouseEvents, ERC721 {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using PositionHouse for PositionHouse.Data;
    using PositionHouse for mapping(bytes32 => PositionHouse.Data);

    /// STORAGE PROPERTIES ///

    /// @inheritdoc IPrimitiveHouse
    IPrimitiveFactory public override factory;

    /// @inheritdoc IPrimitiveHouse
    mapping(address => mapping(address => Margin.Data)) public override margins;

    // engine => posId => PositionHouse.Data
    mapping(address => mapping(bytes32 => PositionHouse.Data)) public positions;

    uint256 private reentrant;

    /// MODIFIERS ///

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    /// EFFECT FUNCTIONS ///

    constructor(address _factory) ERC721("Primitive V2 Positions", "PRIM-V2-POS") {
        factory = IPrimitiveFactory(_factory);
    }

    struct CallbackData {
        address engine;
        address payer;
        address risky;
        address stable;
        bool fromMargin;
    }

    CallbackData private callbackData;
    bytes private empty;

    /// @inheritdoc IPrimitiveHouse
    function create(
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        (bytes32 poolId, uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            delta,
            delLiquidity,
            empty
        );

        positions[engine].fetch(msg.sender, poolId).allocate(delLiquidity - 1000);

        emit Created(msg.sender, engine, poolId, strike, sigma, maturity);
    }

    /// @inheritdoc IPrimitiveHouse
    function deposit(
        address owner,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        IPrimitiveEngineActions(engine).deposit(address(this), delRisky, delStable, empty);

        Margin.Data storage mar = margins[engine][owner];
        mar.deposit(delRisky, delStable);

        emit Deposited(owner, engine, delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function withdraw(
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        // Reverts the call early if margins are insufficient
        margins[engine].withdraw(delRisky, delStable);

        IPrimitiveEngineActions(engine).withdraw(msg.sender, delRisky, delStable);

        if (delRisky > 0) IERC20(risky).safeTransfer(msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransfer(msg.sender, delStable);

        emit Withdrawn(msg.sender, engine, delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function allocate(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).allocate(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            empty
        );

        if (fromMargin) margins[engine].withdraw(delRisky, delStable);

        PositionHouse.Data storage pos = positions[engine].fetch(msg.sender, poolId);
        pos.allocate(delLiquidity);

        IPrimitiveEngineActions(engine).supply(poolId, delLiquidity);

        pos.supply(delLiquidity);

        emit AllocatedAndSupply(owner, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    function remove(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        IPrimitiveEngineActions(engine).claim(poolId, delLiquidity);

        positions[engine].fetch(msg.sender, poolId).claim(delLiquidity);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).remove(poolId, delLiquidity);

        Margin.Data storage mar = margins[engine][msg.sender];
        mar.deposit(delRisky, delStable);

        positions[engine].fetch(msg.sender, poolId).remove(delLiquidity);

        // TODO: Emit the Removed event
    }

    /// @inheritdoc IPrimitiveHouse
    function borrow(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin,
        uint256 maxPremium
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        (uint256 premium, , ) = IPrimitiveEngineActions(engine).borrow(poolId, delLiquidity, fromMargin, empty);

        // Reverts if the premium is higher than the maximum premium
        if (premium > maxPremium) revert MaxPremiumError(maxPremium, premium);

        positions[engine].fetch(msg.sender, poolId).borrow(delLiquidity);

        emit Borrowed(owner, engine, poolId, delLiquidity, maxPremium, premium);
    }

    /// @inheritdoc IPrimitiveHouse
    function repay(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        (uint256 delRisky, uint256 delStable, uint256 premium) = IPrimitiveEngineActions(engine).repay(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            empty
        );

        if (fromMargin) margins[engine].withdraw(0, delStable);

        PositionHouse.Data storage pos = positions[engine].fetch(owner, poolId);
        pos.repay(delLiquidity);

        Margin.Data storage mar = margins[engine][owner];
        mar.deposit(premium, 0);

        emit Repaid(owner, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function swap(
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) public virtual override lock {
        address engine = factory.getEngine(risky, stable);

        callbackData = CallbackData({
            engine: engine,
            payer: msg.sender,
            risky: risky,
            stable: stable,
            fromMargin: false
        });

        uint256 deltaOut = IPrimitiveEngineActions(engine).swap(
            poolId,
            riskyForStable,
            deltaIn,
            fromMargin,
            abi.encode(callbackData)
        );

        // Reverts if the delta out is lower than the minimum
        if (deltaOutMin > deltaOut) revert DeltaOutMinError(deltaOutMin, deltaOut);

        emit Swapped(msg.sender, engine, poolId, riskyForStable, deltaIn, deltaOut, fromMargin);
    }

    // ===== Callback Implementations =====

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);

        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    struct DepositCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function depositCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);
        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);
        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function borrowCallback(
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);
        uint256 riskyNeeded = delLiquidity - delRisky;

        if (callbackData.fromMargin) {
            margins[callbackData.payer].withdraw(riskyNeeded, 0);
        } else {
            IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, riskyNeeded);
        }

        IERC20(callbackData.stable).safeTransfer(callbackData.payer, delStable);
    }

    function repayCallback(uint256 delStable, bytes calldata data) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);
        IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function swapCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);
        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        if (callbackData.engine != msg.sender) revert NotEngineError(callbackData.engine, msg.sender);
        if (delRisky > 0) IERC20(callbackData.risky).safeTransfer(callbackData.payer, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransfer(callbackData.payer, delStable);
    }
}
