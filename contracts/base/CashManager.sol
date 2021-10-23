// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   CashManager
/// @author  Primitive
/// @notice  Utils contract to manage ETH and token balances

import "../interfaces/ICashManager.sol";
import "../base/HouseBase.sol";
import "../libraries/TransferHelper.sol";
import "../interfaces/external/IWETH9.sol";

abstract contract CashManager is ICashManager, HouseBase {
    /// @notice Only WETH9 can send ETH to this contract
    receive() external payable {
        if (msg.sender != WETH9) revert WrongSender(WETH9, msg.sender);
    }

    /// @inheritdoc ICashManager
    function unwrap(uint256 amountMin, address recipient) external payable override {
        uint256 balance = IWETH9(WETH9).balanceOf(address(this));

        if (balance < amountMin) revert AmountTooLow(amountMin, balance);

        if (balance > 0) {
            IWETH9(WETH9).withdraw(balance);
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

    function wrap(uint256 value) external payable {
        if (address(this).balance >= value) {
            IWETH9(WETH9).deposit{value: value}();
            IWETH9(WETH9).transfer(msg.sender, value);
        }
    }
}
