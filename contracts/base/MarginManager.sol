// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/libraries/Margin.sol";

import "../interfaces/IPrimitiveHouse.sol";

abstract contract MarginManager is IPrimitiveHouse {
    mapping(address => mapping(address => Margin.Data)) public override margins;
}
