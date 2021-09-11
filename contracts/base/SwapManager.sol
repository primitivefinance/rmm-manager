// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";

import "./MarginManager.sol";
import "./HouseBase.sol";

abstract contract SwapManager is IPrimitiveHouse, IPrimitiveSwapCallback, HouseBase, MarginManager {
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using SafeERC20 for IERC20;

    modifier checkDeadline(uint256 deadline) {
        require(_blockTimestamp() <= deadline, "Transaction too old");
        _;
    }

    struct SwapCallbackData {
        address payer;
        address risky;
        address stable;
    }

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

        SwapCallbackData memory callbackData = SwapCallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable
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

        if (fromMargin) {
            margins[engine].withdraw(riskyForStable ? deltaIn : 0, riskyForStable ? 0 : deltaIn);
        }

        // uint256 balance = IERC20(riskyForStable ? stable : risky).balanceOf(address(this));

        IERC20(riskyForStable ? stable : risky).safeTransfer(msg.sender, deltaOut);
        emit Swapped(msg.sender, engine, poolId, riskyForStable, deltaIn, deltaOut, fromMargin);
    }

    function swapCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        SwapCallbackData memory decoded = abi.decode(data, (SwapCallbackData));

        if (msg.sender != factory.getEngine(decoded.risky, decoded.stable)) revert NotEngine();

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }
}
