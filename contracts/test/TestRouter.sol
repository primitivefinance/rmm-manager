// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract TestRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut) {
        console.log("Swapping", params.amountIn);

        require(
            IERC20(params.tokenIn).transferFrom(msg.sender, params.recipient, params.amountIn),
            "Amount in transfer failed"
        );

        require(
            IERC20(params.tokenOut).transfer(params.recipient, params.amountIn),
            "Amount out transfer failed"
        );

        return params.amountIn;
    }
}
