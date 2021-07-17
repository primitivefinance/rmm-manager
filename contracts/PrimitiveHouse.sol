// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

/// @title   Primitive House
/// @author  Primitive
/// @dev     Interacts with Primitive Engine contracts

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Margin.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Position.sol";

import "./interfaces/IPrimitiveHouse.sol";
import "./interfaces/IPrimitiveHouseView.sol";
import "./interfaces/IPrimitiveHouseEvents.sol";

import "./interfaces/ITestERC20.sol";

contract PrimitiveHouse is IPrimitiveHouse, IPrimitiveHouseView, IPrimitiveHouseEvents {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using Position for mapping(bytes32 => Position.Data);
    using Position for Position.Data;

    /// STORAGE PROPERTIES ///

    IUniswapV3Factory public uniFactory;
    IUniswapV3Pool public uniPool;

    uint256 private reentrant;

    // engine => user => Margin.Data
    mapping(address => mapping(address => Margin.Data)) private _margins;

    // engine => posId => Position.Data
    mapping(address => mapping(bytes32 => Position.Data)) private _positions;

    /// MODIFIERS ///

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    /// EFFECT FUNCTIONS ///

    /// @inheritdoc IPrimitiveHouse
    function create(
        address engine,
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice
    ) public virtual override lock {
        // FIXME: Find a better way to perform these calls
        address risky = IPrimitiveEngineView(engine).risky();
        address stable = IPrimitiveEngineView(engine).stable();

        // FIXME: Which initial liquidity should we provide?
        (
            bytes32 poolId,
            uint256 delRisky,
            uint256 delStable
        ) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            time,
            riskyPrice,
            1e18,
            abi.encode(CreateCallbackData({
                payer: msg.sender,
                risky: risky,
                stable: stable
            }))
        );

        _positions[engine][Position.getPositionId(msg.sender, poolId)].allocate(
            1e18 - 1000
        );

        emit Created(msg.sender, engine, poolId, strike, sigma, time, riskyPrice, delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function deposit(
        address owner,
        address engine,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        // FIXME: Find a better way to perform these calls
        address risky = IPrimitiveEngineView(engine).risky();
        address stable = IPrimitiveEngineView(engine).stable();

        IPrimitiveEngineActions(engine).deposit(
            address(this),
            delRisky,
            delStable,
            abi.encode(DepositCallbackData({
                payer: msg.sender,
                risky: risky,
                stable: stable
            }))
        );

        Margin.Data storage mar = _margins[engine][owner];
        mar.deposit(delRisky, delStable);

        emit Deposited(owner, engine, delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function withdraw(
        address engine,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        IPrimitiveEngineActions(engine).withdraw(delRisky, delStable);

        _margins[engine].withdraw(delRisky, delStable);

        // FIXME: Find a better way to perform these calls
        address risky = IPrimitiveEngineView(engine).risky();
        address stable = IPrimitiveEngineView(engine).stable();

        if (delRisky > 0) IERC20(risky).safeTransfer(msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransfer(msg.sender, delStable);

        emit Withdrawn(msg.sender, engine, delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function allocate(
        address owner,
        address engine,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        // FIXME: Find a better way to perform these calls
        address risky = IPrimitiveEngineView(engine).risky();
        address stable = IPrimitiveEngineView(engine).stable();

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).allocate(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            abi.encode(AllocateCallbackData({
                payer: msg.sender,
                risky: risky,
                stable: stable
            }))
        );

        if (fromMargin) _margins[engine].withdraw(delRisky, delStable);

        Position.Data storage pos = _positions[engine].fetch(owner, poolId);
        pos.allocate(delLiquidity);

        IPrimitiveEngineActions(engine).lend(poolId, delLiquidity);

        _positions[engine].lend(poolId, delLiquidity);

        emit AllocatedAndLent(
            owner, engine, poolId, delLiquidity, delRisky, delStable, fromMargin
        );
    }

    /// @inheritdoc IPrimitiveHouse
    function borrow(
        address owner,
        address engine,
        bytes32 poolId,
        uint256 delLiquidity,
        uint256 maxPremium
    ) public virtual override lock {
        // FIXME: Find a better way to perform these calls
        address risky = IPrimitiveEngineView(engine).risky();
        address stable = IPrimitiveEngineView(engine).stable();

        (uint256 premium) = IPrimitiveEngineActions(engine).borrow(
            poolId,
            delLiquidity,
            maxPremium,
            abi.encode(BorrowCallbackData({
                payer: msg.sender,
                risky: risky,
                stable: stable
            }))
        );

        // TODO: Update position
        _positions[engine].borrow(poolId, delLiquidity);

        emit Borrowed(owner, engine, poolId, delLiquidity, maxPremium, premium);
    }

    /// @inheritdoc IPrimitiveHouse
    function repay(
        address owner,
        address engine,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        // FIXME: Find a better way to perform this call
        address stable = IPrimitiveEngineView(engine).stable();

        (uint256 delRisky, uint256 delStable, uint256 premium) = IPrimitiveEngineActions(engine).repay(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            abi.encode(RepayFromExternalCallbackData({
                payer: msg.sender,
                stable: stable
            }))
        );

        if (fromMargin) _margins[engine].withdraw(0, delStable);

        // TODO: Update position
        Position.Data storage pos = _positions[engine].fetch(owner, poolId);
        pos.repay(delLiquidity);

        // TODO: Update position
        Margin.Data storage mar = _margins[engine][owner];
        mar.deposit(premium, 0);

        emit Repaid(owner, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function swap(
        address engine,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) public virtual override lock {
        // FIXME: Find a better way to perform these calls
        address risky = IPrimitiveEngineView(engine).risky();
        address stable = IPrimitiveEngineView(engine).stable();

        uint256 deltaOut = IPrimitiveEngineActions(engine).swap(
            poolId,
            riskyForStable,
            deltaIn,
            deltaOutMin,
            fromMargin,
            abi.encode(SwapCallbackData({
                payer: msg.sender,
                risky: risky,
                stable: stable
            }))
        );

        emit Swapped(msg.sender, engine, poolId, riskyForStable, deltaIn, deltaOut, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function swapXForY(address engine, bytes32 poolId, uint256 deltaOut) public virtual override lock {
        IPrimitiveEngineActions(engine).swap(poolId, true, deltaOut, type(uint256).max, true, new bytes(0));
    }

    /// @inheritdoc IPrimitiveHouse
    function swapYForX(address engine, bytes32 poolId, uint256 deltaOut) public virtual override lock {
        IPrimitiveEngineActions(engine).swap(poolId, false, deltaOut, type(uint256).max, true, new bytes(0));
    }

    // ===== Callback Implementations =====
    struct CreateCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        CreateCallbackData memory decoded = abi.decode(data, (CreateCallbackData));
        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
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
        DepositCallbackData memory decoded = abi.decode(data, (DepositCallbackData));
        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct AllocateCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        AllocateCallbackData memory decoded = abi.decode(data, (AllocateCallbackData));
        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct BorrowCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function borrowCallback(
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        BorrowCallbackData memory decoded = abi.decode(data, (BorrowCallbackData));
        uint256 riskyNeeded = delLiquidity - delRisky;
        IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, riskyNeeded);
        IERC20(decoded.stable).safeTransfer(decoded.payer, delStable);
    }

    struct RepayFromExternalCallbackData {
        address payer;
        address stable;
    }

    function repayFromExternalCallback(uint256 delStable, bytes calldata data) external override {
        RepayFromExternalCallbackData memory decoded = abi.decode(data, (RepayFromExternalCallbackData));
        IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct SwapCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function swapCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        SwapCallbackData memory decoded = abi.decode(data, (SwapCallbackData));
        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct RemoveCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        RemoveCallbackData memory decoded = abi.decode(data, (RemoveCallbackData));
        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    /// VIEW FUNCTIONS ///

    function marginOf(address owner, address engine) external view returns (Margin.Data memory) {
        return _margins[engine][owner];
    }

    function positionOf(address owner, address engine, bytes32 poolId) external view returns (Position.Data memory) {
        bytes32 posId = Position.getPositionId(owner, poolId);
        return _positions[engine][posId];
    }
}
