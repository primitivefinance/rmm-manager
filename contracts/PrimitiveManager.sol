// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefi/rmm-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "./interfaces/IPrimitiveManager.sol";
import "./base/Multicall.sol";
import "./base/CashManager.sol";
import "./base/SelfPermit.sol";
import "./base/PositionManager.sol";
import "./base/SwapManager.sol";
import "./libraries/TransferHelper.sol";

/// @title   PrimitiveManager contract
/// @author  Primitive
/// @notice  Interacts with Primitive Engine contracts
contract PrimitiveManager is IPrimitiveManager, Multicall, CashManager, SelfPermit, PositionManager, SwapManager {
    using TransferHelper for IERC20;
    using Margin for Margin.Data;

    /// EFFECT FUNCTIONS ///

    /// @param factory_           Address of a PrimitiveFactory
    /// @param WETH9_             Address of WETH9
    /// @param positionRenderer_  Address of PositionRenderer
    constructor(
        address factory_,
        address WETH9_,
        address positionRenderer_
    ) ManagerBase(factory_, WETH9_, positionRenderer_) {}

    /// @inheritdoc IPrimitiveManager
    function create(
        address risky,
        address stable,
        uint128 strike,
        uint32 sigma,
        uint32 maturity,
        uint32 gamma,
        uint256 riskyPerLp,
        uint256 delLiquidity
    )
        external
        payable
        override
        lock
        returns (
            bytes32 poolId,
            uint256 delRisky,
            uint256 delStable
        )
    {
        address engine = EngineAddress.computeAddress(factory, risky, stable);
        if (EngineAddress.isContract(engine) == false) revert EngineAddress.EngineNotDeployedError();

        if (delLiquidity == 0) revert ZeroLiquidityError();

        CallbackData memory callbackData = CallbackData({risky: risky, stable: stable, payer: msg.sender});

        (poolId, delRisky, delStable) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            gamma,
            riskyPerLp,
            delLiquidity,
            abi.encode(callbackData)
        );

        // Mints {delLiquidity - MIN_LIQUIDITY} of liquidity tokens
        uint256 MIN_LIQUIDITY = IPrimitiveEngineView(engine).MIN_LIQUIDITY();
        _allocate(msg.sender, engine, poolId, delLiquidity - MIN_LIQUIDITY);

        emit Create(msg.sender, engine, poolId, strike, sigma, maturity, gamma);
    }

    address private _engine;

    /// @inheritdoc IPrimitiveManager
    function allocate(
        bytes32 poolId,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin,
        uint256 minLiquidityOut
    ) external payable override lock returns (uint256 delLiquidity) {
        _engine = EngineAddress.computeAddress(factory, risky, stable);
        if (EngineAddress.isContract(_engine) == false) revert EngineAddress.EngineNotDeployedError();

        if (delRisky == 0 && delStable == 0) revert ZeroLiquidityError();

        (delLiquidity) = IPrimitiveEngineActions(_engine).allocate(
            poolId,
            address(this),
            delRisky,
            delStable,
            fromMargin,
            abi.encode(CallbackData({risky: risky, stable: stable, payer: msg.sender}))
        );

        if (delLiquidity < minLiquidityOut) revert MinLiquidityOutError();

        if (fromMargin) margins[msg.sender][_engine].withdraw(delRisky, delStable);

        // Mints {delLiquidity} of liquidity tokens
        _allocate(msg.sender, _engine, poolId, delLiquidity);

        emit Allocate(msg.sender, _engine, poolId, delLiquidity, delRisky, delStable, fromMargin);

        _engine = address(0);
    }

    /// @inheritdoc IPrimitiveManager
    function remove(
        address engine,
        bytes32 poolId,
        uint256 delLiquidity,
        uint256 minRiskyOut,
        uint256 minStableOut
    ) external override lock returns (uint256 delRisky, uint256 delStable) {
        if (delLiquidity == 0) revert ZeroLiquidityError();

        (delRisky, delStable) = IPrimitiveEngineActions(engine).remove(poolId, delLiquidity);
        if (delRisky < minRiskyOut || delStable < minStableOut) revert MinRemoveOutError();

        _remove(msg.sender, poolId, delLiquidity);

        Margin.Data storage mar = margins[msg.sender][engine];
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

        if (delRisky > 0) pay(decoded.risky, decoded.payer, msg.sender, delRisky);
        if (delStable > 0) pay(decoded.stable, decoded.payer, msg.sender, delStable);
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

        if (delRisky > 0) pay(decoded.risky, decoded.payer, msg.sender, delRisky);
        if (delStable > 0) pay(decoded.stable, decoded.payer, msg.sender, delStable);
    }
}
