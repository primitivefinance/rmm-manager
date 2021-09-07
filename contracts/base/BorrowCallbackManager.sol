// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title  Borrow CallBack Manager
/// @author Primitive

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveBorrowCallback.sol";

import "hardhat/console.sol";

abstract contract BorrowCallbackManager is IPrimitiveBorrowCallback {
    using SafeERC20 for IERC20;
    ISwapRouter public router;

    constructor(address _router) {
        router = ISwapRouter(_router);
    }

    struct BorrowCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function borrowCallback(
        uint256 riskyDeficit,
        uint256 stableDeficit,
        bytes calldata data
    ) external override {
        console.log("Calling callback");

        // FIXME: There is no engine lock here
        BorrowCallbackData memory decoded = abi.decode(data, (BorrowCallbackData));

        address surplusToken = riskyDeficit > stableDeficit ? decoded.stable : decoded.risky;
        address deficitToken = riskyDeficit > stableDeficit ? decoded.risky : decoded.stable;

        uint256 deficit = riskyDeficit > stableDeficit ? riskyDeficit : stableDeficit;

        console.log("Deficit", deficit);

        uint256 amountIn = IERC20(surplusToken).balanceOf(address(this));

        IERC20(surplusToken).approve(address(router), amountIn);

        console.log("Amount in", amountIn);

        // TODO: Some values were removed for testing purposes
        uint256 amountOut = router.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: surplusToken,
                tokenOut: deficitToken,
                fee: 0,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );

        console.log("Swap was successful!");

        // TODO: Check if it's possible to get more amountOut than deficit?
        uint256 remainingDeficit = amountOut > deficit ? 0 : deficit - amountOut;

        console.log("Remaining deficit", remainingDeficit);

        if (remainingDeficit > 0) IERC20(deficitToken).safeTransferFrom(decoded.payer, msg.sender, remainingDeficit);

        IERC20(deficitToken).safeTransfer(msg.sender, deficit);
    }
}
