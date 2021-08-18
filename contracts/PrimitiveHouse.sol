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

import "./base/Multicall.sol";

contract PrimitiveHouse is IPrimitiveHouse, IPrimitiveHouseEvents, ERC721, Multicall {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using PositionHouse for PositionHouse.Data;
    // using PositionHouse for mapping(uint256 => PositionHouse.Data);

    /// ERRORS ///

    error NoCurrentPosition(
        address account,
        address engine,
        bytes32 poolId
    );


    /// STORAGE PROPERTIES ///

    // Keeps track of the last tokenId (0 doesn't exist)
    uint256 public lastTokenId = 1;

    /// @inheritdoc IPrimitiveHouse
    IPrimitiveFactory public override factory;

    /// @inheritdoc IPrimitiveHouse
    mapping(address => mapping(address => Margin.Data)) public override margins;

    // TODO: Delete this line
    // mapping(address => mapping(bytes32 => PositionHouse.Data)) public positions;

    /// @notice Keeps track of the NFT position of each user for each engine
    ///         and each poolId. Only 1 token can be owned per poolId and
    ///         0 means that the user does not have a position yet.
    ///         user => engine => poolId => tokenId
    mapping(address => mapping(address => mapping(bytes32 => uint256))) public positionOf;

    mapping(uint256 => PositionHouse.Data) public positions;

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

        // Safely mints a new position, no need to check if the
        // user already has one because it's not possible!
        uint256 tokenId = mint(msg.sender);
        positions[tokenId].allocate(delLiquidity - 1000);

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
        // TODO: Revert if delRisky || delStable == 0?
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
        if (delRisky == 0 || delStable == 0) {
            // TODO: Revert the call or not?
        }

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
        // TODO: Revert if delLiquidity == 0?

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

        // Creates a position if the user doesn't have one
        uint256 tokenId = positionOf[owner][engine][poolId];

        if (tokenId == 0) {
            // Mints a new position
            tokenId = mint(owner);
        }

        positions[tokenId].allocate(delLiquidity);

        IPrimitiveEngineActions(engine).supply(poolId, delLiquidity);

        positions[tokenId].supply(delLiquidity);

        emit AllocatedAndSupply(owner, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    function remove(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) public virtual override lock {
        // TODO: Revert if delLiquidity == 0?

        address engine = factory.getEngine(risky, stable);

        // Checks if the user has a current position
        uint256 tokenId = positionOf[msg.sender][engine][poolId];

        if (tokenId == 0) {
            revert NoCurrentPosition(msg.sender, engine, poolId);
        }

        IPrimitiveEngineActions(engine).claim(poolId, delLiquidity);

        positions[tokenId].claim(delLiquidity);

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

        positions[tokenId].remove(delLiquidity);

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
        // TODO: Revert if delLiquidity == 0?

        address engine = factory.getEngine(risky, stable);

        // Fetches the position
        uint256 tokenId = positionOf[owner][engine][poolId];

        // Creates a position if the user doesn't have one
        if (tokenId == 0) {
            // Mints a new position
            tokenId = mint(owner);
        }

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

        positions[tokenId].borrow(delLiquidity);

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

        uint256 tokenId = positionOf[owner][engine][poolId];

        // Checks if the user has a current position
        if (tokenId == 0) {
            revert NoCurrentPosition(owner, engine, poolId);
        }

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

        positions[tokenId].repay(delLiquidity);

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

    function mint(address owner) private returns (uint256) {
        _mint(owner, lastTokenId);
        lastTokenId += 1;
        return lastTokenId - 1;
    }
}
