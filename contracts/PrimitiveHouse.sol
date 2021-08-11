// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   Primitive House
/// @author  Primitive
/// @dev     Interacts with Primitive Engine contracts

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/v2-core/contracts/libraries/Margin.sol";
import "@primitivefinance/v2-core/contracts/libraries/Position.sol";

import "./interfaces/IPrimitiveHouse.sol";
import "./interfaces/IPrimitiveHouseEvents.sol";

contract PrimitiveHouse is IPrimitiveHouse, IPrimitiveHouseEvents {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using Position for mapping(bytes32 => Position.Data);
    using Position for Position.Data;

    /// STORAGE PROPERTIES ///

    IPrimitiveFactory public override factory;

    // engine => user => Margin.Data
    mapping(address => mapping(address => Margin.Data)) public margins;

    // engine => posId => Position.Data
    mapping(address => mapping(bytes32 => Position.Data)) public positions;

    uint256 private reentrant;

    /// MODIFIERS ///

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    /// EFFECT FUNCTIONS ///

    constructor(address _factory) {
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

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

        (bytes32 poolId, uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            delta,
            delLiquidity,
            empty
        );

        positions[engine][Position.getPositionId(msg.sender, poolId)].allocate(delLiquidity - 1000);

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

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

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

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).allocate(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            empty
        );

        if (fromMargin) margins[engine].withdraw(delRisky, delStable);

        Position.Data storage pos = positions[engine].fetch(owner, poolId);
        pos.allocate(delLiquidity);

        IPrimitiveEngineActions(engine).supply(poolId, delLiquidity);

        positions[engine].supply(poolId, delLiquidity);

        emit AllocatedAndSupply(owner, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    function remove(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) public override virtual lock {
        address engine = factory.getEngine(risky, stable);

        IPrimitiveEngineActions(engine).claim(poolId, delLiquidity);

        positions[engine].claim(poolId, delLiquidity);

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).remove(
            poolId,
            delLiquidity
        );

        Margin.Data storage mar = margins[engine][msg.sender];
        mar.deposit(delRisky, delStable);

        positions[engine].remove(poolId, delLiquidity);

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

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

        uint256 premium = IPrimitiveEngineActions(engine).borrow(poolId, delLiquidity, fromMargin, empty);

        require(maxPremium >= premium, "Premium too high");

        positions[engine].borrow(poolId, delLiquidity);

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

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

        (uint256 delRisky, uint256 delStable, uint256 premium) = IPrimitiveEngineActions(engine).repay(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            empty
        );

        if (fromMargin) margins[engine].withdraw(0, delStable);

        // TODO: Update position
        Position.Data storage pos = positions[engine].fetch(owner, poolId);
        pos.repay(delLiquidity);

        // TODO: Update position
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

        callbackData = CallbackData({engine: engine, payer: msg.sender, risky: risky, stable: stable, fromMargin: false});

        uint256 deltaOut = IPrimitiveEngineActions(engine).swap(
            poolId,
            riskyForStable,
            deltaIn,
            fromMargin,
            abi.encode(callbackData)
        );

        require(deltaOut >= deltaOutMin, "Delta out too low");

        emit Swapped(msg.sender, engine, poolId, riskyForStable, deltaIn, deltaOut, fromMargin);
    }

    // ===== Callback Implementations =====

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        require(callbackData.engine == msg.sender, "Not engine");
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
        require(callbackData.engine == msg.sender, "Not engine");
        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        require(callbackData.engine == msg.sender, "Not engine");
        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function borrowCallback(
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        require(callbackData.engine == msg.sender, "Not engine");
        uint256 riskyNeeded = delLiquidity - delRisky;

        if (callbackData.fromMargin) {
            margins[callbackData.payer].withdraw(riskyNeeded, 0);
        } else {
            IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, riskyNeeded);
        }

        IERC20(callbackData.stable).safeTransfer(callbackData.payer, delStable);
    }

    function repayCallback(uint256 delStable, bytes calldata data) external override {
        require(callbackData.engine == msg.sender, "Not engine");
        IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function swapCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        require(callbackData.engine == msg.sender, "Not engine");
        if (delRisky > 0) IERC20(callbackData.risky).safeTransferFrom(callbackData.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransferFrom(callbackData.payer, msg.sender, delStable);
    }

    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        require(callbackData.engine == msg.sender, "Not engine");
        if (delRisky > 0) IERC20(callbackData.risky).safeTransfer(callbackData.payer, delRisky);
        if (delStable > 0) IERC20(callbackData.stable).safeTransfer(callbackData.payer, delStable);
    }
}
