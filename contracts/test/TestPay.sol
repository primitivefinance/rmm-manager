// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../base/CashManager.sol";

contract TestPay is CashManager {
    constructor(
        address factory_,
        address WETH9_,
        address positionRenderer_
    ) HouseBase(factory_, WETH9_, positionRenderer_) {}

    function testPay(
        address token,
        address payer,
        address recipient,
        uint256 value
    ) external payable {
        pay(token, payer, recipient, value);
    }
}
