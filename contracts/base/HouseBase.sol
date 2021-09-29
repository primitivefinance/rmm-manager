// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/IHouseBase.sol";
import "../interfaces/IPrimitiveHouse.sol";
import "./Reentrancy.sol";
import "../libraries/EngineAddress.sol";

/// @title   HouseBase
/// @author  Primitive
/// @notice  Base contract of the House
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

    /// @param factory_ The address of a PrimitiveFactory
    /// @param WETH10_ The address of WETH10
    constructor(
        address factory_,
        address WETH10_
    ) {
        factory = factory_;
        WETH10 = WETH10_;
    }
}
