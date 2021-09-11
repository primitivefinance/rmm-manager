// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/IPrimitiveHouse.sol";
import "./Reentrancy.sol";

abstract contract HouseBase is IPrimitiveHouse, Reentrancy {
    /// @inheritdoc IPrimitiveHouse
    IPrimitiveFactory public override factory;
}
