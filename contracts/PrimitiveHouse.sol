// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "./interfaces/IPrimitiveHouse.sol";
import "./base/Multicall.sol";
import "./base/CashManager.sol";
import "./base/SelfPermit.sol";
import "./base/PositionManager.sol";
import "./base/SwapManager.sol";
import "./libraries/TransferHelper.sol";

/// @title   Primitive House
/// @author  Primitive
/// @dev     Interacts with Primitive Engine contracts
contract PrimitiveHouse is
    IPrimitiveHouse,
    Multicall,
    CashManager,
    SelfPermit,
    PositionManager,
    SwapManager
{
    using TransferHelper for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;

    /// EFFECT FUNCTIONS ///

    /// @param factory_  Address of a PrimitiveFactory
    /// @param WETH10_   Address of WETH10
    constructor(
        address factory_,
        address WETH10_,
        string memory URI_
    ) HouseBase(factory_, WETH10_) PositionManager(URI_) {}

    /// @inheritdoc IPrimitiveHouse
    function create(
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 riskyPerLp,
        uint256 delLiquidity
    ) external override lock returns (
        bytes32 poolId,
        uint256 delRisky,
        uint256 delStable
    ) {
        address engine = EngineAddress.computeAddress(factory, risky, stable);

        if (engine == address(0)) revert EngineNotDeployedError();

        if (delLiquidity == 0) revert ZeroLiquidityError();

        CallbackData memory callbackData = CallbackData({
            risky: risky,
            stable: stable,
            payer: msg.sender
        });

        (poolId, delRisky, delStable) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            riskyPerLp,
            delLiquidity,
            abi.encode(callbackData)
        );

        // Mints {delLiquidity - MIN_LIQUIDITY} of liquidity tokens
        uint256 MIN_LIQUIDITY = IPrimitiveEngineView(engine).MIN_LIQUIDITY();
        _allocate(msg.sender, poolId, delLiquidity - MIN_LIQUIDITY);

        emit Create(msg.sender, engine, poolId, strike, sigma, maturity);
    }

    /// @inheritdoc IPrimitiveHouse
    function allocate(
        bytes32 poolId,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    ) external override lock returns (uint256 delLiquidity) {
        address engine = EngineAddress.computeAddress(factory, risky, stable);

        if (delRisky == 0 && delStable == 0) revert ZeroLiquidityError();

        (delLiquidity) = IPrimitiveEngineActions(engine).allocate(
            poolId,
            address(this),
            delRisky,
            delStable,
            fromMargin,
            abi.encode(
                CallbackData({
                    risky: risky,
                    stable: stable,
                    payer: msg.sender
                })
            )
        );

        if (fromMargin) margins[engine].withdraw(delRisky, delStable);

        // Mints {delLiquidity} of liquidity tokens
        _allocate(msg.sender, poolId, delLiquidity);

        emit Allocate(msg.sender, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function remove(
        address engine,
        bytes32 poolId,
        uint256 delLiquidity
    ) external override lock returns (
        uint256 delRisky,
        uint256 delStable
    ) {
        if (delLiquidity == 0) revert ZeroLiquidityError();

        (delRisky, delStable) = IPrimitiveEngineActions(engine).remove(poolId, delLiquidity);
        _remove(msg.sender, poolId, delLiquidity);

        Margin.Data storage mar = margins[engine][msg.sender];
        mar.deposit(delRisky, delStable);

        emit Remove(msg.sender, engine, poolId, delLiquidity, delRisky, delStable);
    }

    /// CALLBACK IMPLEMENTATIONS ///

    /// @inheritdoc IPrimitiveCreateCallback
    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        CallbackData memory decoded = abi.decode(data, (CallbackData));

        address engine = EngineAddress.computeAddress(factory, decoded.risky, decoded.stable);
        if (msg.sender != engine) revert NotEngineError();

        if (delRisky > 0) TransferHelper.safeTransferFrom(decoded.risky, decoded.payer, msg.sender, delRisky);
        if (delStable > 0) TransferHelper.safeTransferFrom(decoded.stable, decoded.payer, msg.sender, delStable);
    }

    /// @inheritdoc IPrimitiveLiquidityCallback
    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        CallbackData memory decoded = abi.decode(data, (CallbackData));

        address engine = EngineAddress.computeAddress(factory, decoded.risky, decoded.stable);
        if (msg.sender != engine) revert NotEngineError();

        if (delRisky > 0) TransferHelper.safeTransferFrom(decoded.risky, decoded.payer, msg.sender, delRisky);
        if (delStable > 0) TransferHelper.safeTransferFrom(decoded.stable, decoded.payer, msg.sender, delStable);
    }
}
