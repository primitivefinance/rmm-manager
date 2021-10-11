// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   SwapManager
/// @author  Primitive
/// @dev     Manages the swaps

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/v2-core/contracts/libraries/ReplicationMath.sol";

import "../interfaces/ISwapManager.sol";
import "../interfaces/external/IERC20.sol";
import "./MarginManager.sol";
import "./HouseBase.sol";

import "hardhat/console.sol";

abstract contract SwapManager is ISwapManager, HouseBase, MarginManager {
    using TransferHelper for IERC20;
    using Margin for Margin.Data;

    /// @notice Reverts the tx above the deadline
    modifier checkDeadline(uint256 deadline) {
        if (_blockTimestamp() > deadline) revert DeadlineReachedError();
        _;
    }

    error DeltaInMaxError();
    error DeltaOutMinError();

    struct SwapExactInParams {
        address recipient;
        address risky;
        address stable;
        bytes32 poolId;
        bool riskyForStable;
        uint256 deltaIn;
        uint256 deltaOutMin;
        bool fromMargin;
        bool toMargin;
        uint256 deadline;
    }

    function swapExactIn(SwapExactInParams memory params) external {
        address engine = EngineAddress.computeAddress(factory, params.risky, params.stable);

        uint256 deltaOut = params.riskyForStable
            ? getStableOutGivenRiskyIn(engine, params.poolId, params.deltaIn)
            : getRiskyOutGivenStableIn(engine, params.poolId, params.deltaIn);

        if (deltaOut < params.deltaOutMin) revert DeltaOutMinError();

        _swap(
            SwapParams({
                recipient: params.recipient,
                risky: params.risky,
                stable: params.stable,
                poolId: params.poolId,
                riskyForStable: params.riskyForStable,
                deltaIn: params.deltaIn,
                deltaOut: deltaOut,
                fromMargin: params.fromMargin,
                toMargin: params.toMargin,
                deadline: params.deadline
            })
        );
    }

    struct SwapExactOutParams {
        address recipient;
        address risky;
        address stable;
        bytes32 poolId;
        bool riskyForStable;
        uint256 deltaInMax;
        uint256 deltaOut;
        bool fromMargin;
        bool toMargin;
        uint256 deadline;
    }

    function swapExactOut(SwapExactOutParams memory params) external {
        address engine = EngineAddress.computeAddress(factory, params.risky, params.stable);

        uint256 deltaIn = params.riskyForStable
            ? getRiskyOutGivenStableIn(engine, params.poolId, params.deltaOut)
            : getStableInGivenRiskyOut(engine, params.poolId, params.deltaOut);

        if (deltaIn > params.deltaInMax) revert DeltaInMaxError();

        _swap(
            SwapParams({
                recipient: params.recipient,
                risky: params.risky,
                stable: params.stable,
                poolId: params.poolId,
                riskyForStable: params.riskyForStable,
                deltaIn: deltaIn,
                deltaOut: params.deltaOut,
                fromMargin: params.fromMargin,
                toMargin: params.toMargin,
                deadline: params.deadline
            })
        );
    }

    /// @inheritdoc IPrimitiveSwapCallback
    function swapCallback(
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

    /// @return blockTimestamp casted as a uint32
    function _blockTimestamp() internal view virtual returns (uint32 blockTimestamp) {
        blockTimestamp = uint32(block.timestamp);
    }

    struct SwapParams {
        address recipient;
        address risky;
        address stable;
        bytes32 poolId;
        bool riskyForStable;
        uint256 deltaIn;
        uint256 deltaOut;
        bool fromMargin;
        bool toMargin;
        uint256 deadline;
    }

    function _swap(SwapParams memory params) private checkDeadline(params.deadline) {
        CallbackData memory callbackData = CallbackData({
            payer: msg.sender,
            risky: params.risky,
            stable: params.stable
        });

        address engine = EngineAddress.computeAddress(factory, params.risky, params.stable);

        IPrimitiveEngineActions(engine).swap(
            params.toMargin ? address(this) : params.recipient,
            params.poolId,
            params.riskyForStable,
            params.deltaIn,
            params.deltaOut,
            params.fromMargin,
            params.toMargin,
            abi.encode(callbackData)
        );

        if (params.fromMargin) {
            margins[msg.sender][engine].withdraw(
                params.riskyForStable ? params.deltaIn : 0,
                params.riskyForStable ? 0 : params.deltaIn
            );
        }

        if (params.toMargin) {
            margins[params.recipient][engine].deposit(
                params.riskyForStable ? params.deltaOut : 0,
                params.riskyForStable ? 0 : params.deltaOut
            );
        }

        emit Swap(
            msg.sender,
            params.recipient,
            engine,
            params.poolId,
            params.riskyForStable,
            params.deltaIn,
            params.deltaOut,
            params.fromMargin,
            params.toMargin
        );
    }

    function getStableOutGivenRiskyIn(
        address engine,
        bytes32 poolId,
        uint256 deltaIn
    ) private view returns (uint256) {
        IPrimitiveEngineView lens = IPrimitiveEngineView(engine);
        uint256 amountInWithFee = (deltaIn * lens.GAMMA()) / 1e4;
        (uint128 reserveRisky, uint128 reserveStable, uint128 liquidity, , , , ) = lens.reserves(poolId);
        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, ) = lens.calibrations(poolId);
        int128 invariant = lens.invariantOf(poolId);

        uint256 nextRisky = ((uint256(reserveRisky) + amountInWithFee) * lens.PRECISION()) / liquidity;
        uint256 nextStable = ReplicationMath.getStableGivenRisky(
            invariant,
            lens.scaleFactorRisky(),
            lens.scaleFactorStable(),
            nextRisky,
            strike,
            sigma,
            maturity - lastTimestamp
        );

        uint256 deltaOut = uint256(reserveStable) - (nextStable * liquidity) / lens.PRECISION();
        return deltaOut;
    }

    function getRiskyOutGivenStableIn(
        address engine,
        bytes32 poolId,
        uint256 deltaIn
    ) private view returns (uint256) {
        IPrimitiveEngineView lens = IPrimitiveEngineView(engine);
        uint256 amountInWithFee = (deltaIn * lens.GAMMA()) / 1e4;
        (uint128 reserveRisky, uint128 reserveStable, uint128 liquidity, , , , ) = lens.reserves(poolId);
        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, ) = lens.calibrations(poolId);
        int128 invariant = lens.invariantOf(poolId);

        uint256 nextStable = ((uint256(reserveStable) + amountInWithFee) * lens.PRECISION()) / liquidity;
        uint256 nextRisky = ReplicationMath.getRiskyGivenStable(
            invariant,
            lens.scaleFactorRisky(),
            lens.scaleFactorStable(),
            nextStable,
            strike,
            sigma,
            maturity - lastTimestamp
        );

        uint256 deltaOut = uint256(reserveRisky) - (nextRisky * liquidity) / lens.PRECISION();
        return deltaOut;
    }

    function getStableInGivenRiskyOut(
        address engine,
        bytes32 poolId,
        uint256 deltaOut
    ) public view returns (uint256) {
        IPrimitiveEngineView lens = IPrimitiveEngineView(engine);
        (uint128 reserveRisky, uint128 reserveStable, uint128 liquidity, , , , ) = lens.reserves(poolId);
        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, ) = lens.calibrations(poolId);
        int128 invariant = lens.invariantOf(poolId);

        uint256 nextRisky = ((uint256(reserveRisky) - deltaOut) * lens.PRECISION()) / liquidity;
        uint256 nextStable = ReplicationMath.getStableGivenRisky(
            invariant,
            lens.scaleFactorRisky(),
            lens.scaleFactorStable(),
            nextRisky,
            strike,
            sigma,
            maturity - lastTimestamp
        );

        uint256 deltaIn = (nextStable * liquidity) / lens.PRECISION() - uint256(reserveStable);
        uint256 deltaInWithFee = (deltaIn * 1e4) / lens.GAMMA() + 1;
        return deltaInWithFee;
    }

    function getRiskyInGivenStableOut(
        address engine,
        bytes32 poolId,
        uint256 deltaOut
    ) public view returns (uint256) {
        IPrimitiveEngineView lens = IPrimitiveEngineView(engine);
        (uint128 reserveRisky, uint128 reserveStable, uint128 liquidity, , , , ) = lens.reserves(poolId);
        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, ) = lens.calibrations(poolId);
        int128 invariant = lens.invariantOf(poolId);

        uint256 nextStable = ((uint256(reserveStable) - deltaOut) * lens.PRECISION()) / liquidity;
        uint256 nextRisky = ReplicationMath.getRiskyGivenStable(
            invariant,
            lens.scaleFactorRisky(),
            lens.scaleFactorStable(),
            nextStable,
            strike,
            sigma,
            maturity - lastTimestamp
        );

        uint256 deltaIn = (nextRisky * liquidity) / lens.PRECISION() - uint256(reserveRisky);
        uint256 deltaInWithFee = (deltaIn * 1e4) / lens.GAMMA() + 1;
        return deltaInWithFee;
    }
}
