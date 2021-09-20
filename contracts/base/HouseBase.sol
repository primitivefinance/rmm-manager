// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/IHouseBase.sol";
import "../interfaces/IPrimitiveHouse.sol";

import "./Reentrancy.sol";

import "../libraries/EngineAddress.sol";

/// @title HouseBase
/// @author Primitive
/// @notice Base contract of the House
abstract contract HouseBase is IHouseBase, Reentrancy {
    /// @notice Data struct reused by callbacks
    struct CallbackData {
        address payer;
        address risky;
        address stable;
    }

    /// @inheritdoc IHouseBase
    address public immutable override factory;

    /// @inheritdoc IHouseBase
    address public immutable override WETH10;

    /// @param _factory The address of a PrimitiveFactory
    /// @param _WETH10 The address of WETH10
    constructor(
        address _factory,
        address _WETH10
    ) {
        factory = _factory;
        WETH10 = _WETH10;
    }
}
