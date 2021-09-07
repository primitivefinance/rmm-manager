// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../libraries/TransferHelper.sol";
import "../interfaces/IWETH10.sol";
import "../interfaces/ICashManager.sol";

/// @title CashManager
/// @notice Utils to manage ETH and tokens
/// @author Primitive
abstract contract CashManager is ICashManager {
    address public override WETH10;

    constructor(address _WETH10) {
        WETH10 = _WETH10;
    }

    receive() external payable {
        if (msg.sender != WETH10) {
            revert WrongSender(WETH10, msg.sender);
        }
    }

    function unwrap(uint256 amountMin, address recipient) external payable override {
        uint256 balance = IWETH10(WETH10).balanceOf(address(this));

        if (balance < amountMin) revert AmountTooLow(amountMin, balance);

        if (balance > 0) {
            IWETH10(WETH10).withdraw(balance);
            TransferHelper.safeTransferETH(recipient, balance);
        }
    }

    function sweepToken(
        address token,
        uint256 amountMin,
        address recipient
    ) external payable override {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance < amountMin) revert AmountTooLow(amountMin, balance);

        if (balance > 0) {
            TransferHelper.safeTransfer(token, recipient, balance);
        }
    }

    function refundETH() external payable override {
        if (address(this).balance > 0) TransferHelper.safeTransferETH(msg.sender, address(this).balance);
    }
}
