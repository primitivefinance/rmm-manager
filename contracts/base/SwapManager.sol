// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/v2-core/contracts/libraries/ReplicationMath.sol";

import "../interfaces/ISwapManager.sol";
import "../interfaces/IERC20.sol";
import "./MarginManager.sol";
import "./HouseBase.sol";

import "hardhat/console.sol";

/// @title   SwapManager
/// @author  Primitive
/// @dev     Manages the swaps
abstract contract SwapManager is ISwapManager, HouseBase, MarginManager {
    using TransferHelper for IERC20;
    using Margin for Margin.Data;

    /// @notice Reverts the tx above the deadline
    modifier checkDeadline(uint256 deadline) {
        if (_blockTimestamp() > deadline) revert DeadlineReachedError();
        _;
    }

    struct SwapExactOutParams {
        address recipient;
        address risky;
        address stable;
        bytes32 poolId;
        bool riskyForStable;
        uint256 deltaOut;
        uint256 deltaInMax;
        bool fromMargin;
        bool toMargin;
        uint256 deadline;
    }

    error DeltaInMaxError();
    error ExactDeltaOutError();

    function swapExactOut(
        SwapExactOutParams memory params
    ) external lock checkDeadline(params.deadline) returns (
        uint256 deltaIn
    ) {
        CallbackData memory callbackData = CallbackData({
            payer: msg.sender,
            risky: params.risky,
            stable: params.stable
        });

        address engine = EngineAddress.computeAddress(factory, params.risky, params.stable);

        {
            int128 invariantX64 = IPrimitiveEngineView(engine).invariantOf(params.poolId);

            (
                uint128 strike,
                uint64 sigma,
                uint32 maturity,
                uint32 lastTimestamp
            ) = IPrimitiveEngineView(engine).calibrations(params.poolId);

            (
                uint128 reserveRisky,
                uint128 reserveStable,
                uint128 liquidity,
                , , ,
            ) = IPrimitiveEngineView(engine).reserves(params.poolId);

            uint32 tau = maturity - lastTimestamp;

            if (params.riskyForStable) {
                console.log("riskyForStable: true");
                uint256 res1 = (uint256(reserveStable - params.deltaOut) * 10**18) / liquidity;
                uint256 res0 = ReplicationMath.getRiskyGivenStable(
                    invariantX64,
                    IPrimitiveEngineView(engine).scaleFactorRisky(),
                    IPrimitiveEngineView(engine).scaleFactorStable(),
                    res1,
                    strike,
                    sigma,
                    tau
                );

                deltaIn = (res0 * liquidity) / 10**18 - uint256(reserveRisky);
                deltaIn += deltaIn * (10000 - 9985) / 10000;

                // 11074336834952110300
                // 11058508521773508900
            } else {
                console.log("riskyForStable: false");
                uint256 res0 = (uint256(reserveRisky - params.deltaOut) * 10**18) / liquidity;
                uint256 res1 = ReplicationMath.getStableGivenRisky(
                    invariantX64,
                    IPrimitiveEngineView(engine).scaleFactorRisky(),
                    IPrimitiveEngineView(engine).scaleFactorStable(),
                    res0,
                    strike,
                    sigma,
                    tau
                );

                deltaIn = (res1 * liquidity) / 10**18 - uint256(reserveStable);
                deltaIn += deltaIn * (10000 - 9985) / 10000;
            }
        }

        console.log("deltaIn:", deltaIn);
        if (deltaIn > params.deltaInMax) revert DeltaInMaxError();

        console.log("calling swap");

        uint256 deltaOut = IPrimitiveEngineActions(engine).swap(
            params.toMargin ? address(this) : params.recipient,
            params.poolId,
            params.riskyForStable,
            deltaIn,
            params.fromMargin,
            params.toMargin,
            abi.encode(callbackData)
        );

        {
            console.log("Delta out expected", params.deltaOut);
            console.log("Delta out actual", deltaOut);
        }

        if (deltaOut != params.deltaOut) revert ExactDeltaOutError();

        if (params.fromMargin) {
            margins[msg.sender][engine].withdraw(
                params.riskyForStable ? deltaIn : 0,
                params.riskyForStable ? 0 : deltaIn
            );
        }

        if (params.toMargin) {
            margins[params.recipient][engine].deposit(
                params.riskyForStable ? deltaOut : 0,
                params.riskyForStable ? 0 : deltaOut
            );
        }

        // TODO: Emit event
    }

    /// @inheritdoc ISwapManager
    function swap(
        SwapParameters memory params
    ) external override lock checkDeadline(params.deadline) returns (
        uint256 deltaOut
    ) {
        CallbackData memory callbackData = CallbackData({
            payer: msg.sender,
            risky: params.risky,
            stable: params.stable
        });

        address engine = EngineAddress.computeAddress(factory, params.risky, params.stable);

        deltaOut = IPrimitiveEngineActions(engine).swap(
            params.toMargin ? address(this) : params.recipient,
            params.poolId,
            params.riskyForStable,
            params.deltaIn,
            params.fromMargin,
            params.toMargin,
            abi.encode(callbackData)
        );

        // Reverts if the delta out is lower than the minimum
        if (params.deltaOutMin > deltaOut) revert DeltaOutMinError(params.deltaOutMin, deltaOut);

        if (params.fromMargin) {
            margins[msg.sender][engine].withdraw(
                params.riskyForStable ? params.deltaIn : 0,
                params.riskyForStable ? 0 : params.deltaIn
            );
        }

        if (params.toMargin) {
            margins[params.recipient][engine].deposit(
                params.riskyForStable ? deltaOut : 0,
                params.riskyForStable ? 0 : deltaOut
            );
        }

        emit Swap(
            msg.sender,
            params.recipient,
            engine,
            params.poolId,
            params.riskyForStable,
            params.deltaIn,
            deltaOut,
            params.fromMargin,
            params.toMargin
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
}
