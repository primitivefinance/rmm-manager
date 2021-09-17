// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/ICashManager.sol";
import "../base/HouseBase.sol";

import "../libraries/TransferHelper.sol";
import "../interfaces/IWETH10.sol";

/// @title CashManager
/// @notice Utils contract to manage ETH and token balances
/// @author Primitive
abstract contract CashManager is ICashManager, HouseBase {
    /// @notice Only WETH10 can send ETH to this contract
    receive() external payable {
        if (msg.sender != WETH10) {
            revert WrongSender(WETH10, msg.sender);
        }
    }

    /// @inheritdoc ICashManager
    function unwrap(uint256 amountMin, address recipient) external payable override {
        uint256 balance = IWETH10(WETH10).balanceOf(address(this));

        if (balance < amountMin) revert AmountTooLow(amountMin, balance);

        if (balance > 0) {
            IWETH10(WETH10).withdraw(balance);
            TransferHelper.safeTransferETH(recipient, balance);
        }
    }

    /// @inheritdoc ICashManager
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

    /// @inheritdoc ICashManager
    function refundETH() external payable override {
        if (address(this).balance > 0) TransferHelper.safeTransferETH(msg.sender, address(this).balance);
    }
}
