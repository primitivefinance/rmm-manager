// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "../interfaces/ISwapManager.sol";

import "../interfaces/IERC20.sol";

import "./MarginManager.sol";
import "./HouseBase.sol";

import "hardhat/console.sol";

/// @title SwapManager
/// @author Primitive
/// @dev Manages the swaps
abstract contract SwapManager is ISwapManager, HouseBase, MarginManager {
    using TransferHelper for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;

    modifier checkDeadline(uint256 deadline) {
        if (_blockTimestamp() > deadline) revert DeadlineReachedError();
        _;
    }

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

        deltaOut = IPrimitiveEngineActions(params.engine).swap(
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
            margins[params.engine].withdraw(
                params.riskyForStable ? params.deltaIn : 0,
                params.riskyForStable ? 0 : params.deltaIn
            );
        }

        if (params.toMargin) {
            margins[msg.sender][params.engine].deposit(
                params.riskyForStable ? params.deltaIn : 0,
                params.riskyForStable ? 0 : params.deltaIn
            );
        } else {
            TransferHelper.safeTransfer(
                params.riskyForStable ? params.stable : params.risky,
                msg.sender,
                deltaOut);
        }

        emit Swap(
            msg.sender,
            params.engine,
            params.poolId,
            params.riskyForStable,
            params.deltaIn,
            deltaOut,
            params.fromMargin
        );
    }

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
