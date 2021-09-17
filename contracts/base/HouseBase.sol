// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/IHouseBase.sol";
import "../interfaces/IPrimitiveHouse.sol";

import "./Reentrancy.sol";

import "../libraries/EngineAddress.sol";

abstract contract HouseBase is IHouseBase, Reentrancy {
    /// @inheritdoc IHouseBase
    address public immutable override factory;

    /// @inheritdoc IHouseBase
    address public immutable override WETH10;

    constructor(
        address _factory,
        address _WETH10
    ) {
        factory = _factory;
        WETH10 = _WETH10;
    }
}
