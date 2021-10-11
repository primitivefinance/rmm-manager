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

    error DeltaInError();
    error DeltaOutError();

    /*

    function swapExactIn(SwapParameters memory params) external lock checkDeadline(params.deadline) {
        _swap(params);
    }

    function swapExactOut(SwapParameters memory params) external lock checkDeadline(params.deadline) {
        _swap(params);
    }

    */

    function swap(SwapParms memory params) external override {
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
