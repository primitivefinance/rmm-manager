// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

interface ICashManager {
    error WrongSender(address expected, address actual);
    error AmountTooLow(uint256 expected, uint256 actual);

    function unwrap(uint256 amountMin, address recipient) external payable;

    function sweepToken(
        address token,
        uint256 amountMin,
        address recipient
    ) external payable;

    function refundETH() external payable;

    function WETH10() external view returns (address);
}
