// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "./interfaces/IPrimitiveHouse.sol";
import "./libraries/TransferHelper.sol";

import "./base/Multicall.sol";
import "./base/CashManager.sol";
import "./base/SelfPermit.sol";
import "./base/PositionWrapper.sol";
import "./base/SwapManager.sol";

import "hardhat/console.sol";

/// @title Primitive House
/// @author Primitive
/// @dev Interacts with Primitive Engine contracts
contract PrimitiveHouse is
    IPrimitiveHouse,
    Multicall,
    CashManager,
    SelfPermit,
    PositionWrapper,
    SwapManager
{
    using TransferHelper for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;

    /// EFFECT FUNCTIONS ///

    /// @param _factory The address of a PrimitiveFactory
    /// @param _WETH10 The address of WETH10
    constructor(
        address _factory,
        address _WETH10,
        string memory _URI
    ) HouseBase(_factory, _WETH10) PositionWrapper(_URI) {}

    /// @inheritdoc IPrimitiveHouse
    function create(
        address engine,
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity,
        bool shouldTokenizeLiquidity
    ) external override lock returns (
        bytes32 poolId,
        uint256 delRisky,
        uint256 delStable
    ) {
        if (engine == address(0)) revert EngineNotDeployedError();

        if (delLiquidity == 0) revert ZeroLiquidityError();

        CallbackData memory callbackData = CallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable
        });

        console.log("calling create");
        (poolId, delRisky, delStable) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            delta,
            delLiquidity,
            abi.encode(callbackData)
        );

        console.log("calling allocate");

        // Mints {delLiquidity - MIN_LIQUIDITY} of liquidity tokens
        uint256 MIN_LIQUIDITY = IPrimitiveEngineView(engine).MIN_LIQUIDITY();
        _allocate(msg.sender, poolId, delLiquidity - MIN_LIQUIDITY, shouldTokenizeLiquidity);

        emit Create(msg.sender, engine, poolId, strike, sigma, maturity);
    }

    /// @inheritdoc IPrimitiveHouse
    function allocate(
        address engine,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin,
        bool shouldTokenizeLiquidity
    ) external override lock returns (
        uint256 delRisky,
        uint256 delStable
    ) {
        if (delLiquidity == 0) revert ZeroLiquidityError();

        (delRisky, delStable) = IPrimitiveEngineActions(engine).allocate(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            abi.encode(
                CallbackData({
                    payer: msg.sender,
                    risky: risky,
                    stable: stable
                })
            )
        );

        if (fromMargin) margins[engine].withdraw(delRisky, delStable);

        // Mints {delLiquidity} of liquidity tokens
        _allocate(msg.sender, poolId, delLiquidity, shouldTokenizeLiquidity);

        emit Allocate(msg.sender, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function remove(
        address engine,
        address risky,
        address stable,
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

        emit Remove(msg.sender, engine, poolId, risky, stable, delRisky, delStable);
    }

    // ===== Callback Implementations =====

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

    // TODO: Delete this callback when the interface will be updated
    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
    }
}
