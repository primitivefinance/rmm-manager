// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   HouseBase
/// @author  Primitive
/// @notice  Base contract of the House

import "../interfaces/IHouseBase.sol";
import "../interfaces/IPrimitiveHouse.sol";
import "./Reentrancy.sol";
import "../libraries/EngineAddress.sol";

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
    address public immutable override WETH9;

    /// @inheritdoc IHouseBase
    address public immutable override positionRenderer;

    /// @param factory_  Address of a PrimitiveFactory
    /// @param WETH9_   Address of WETH9
    /// @param WETH9_   Address of the position renderer
    constructor(
        address factory_,
        address WETH9_,
        address positionRenderer_
    ) {
        factory = factory_;
        WETH9 = WETH9_;
        positionRenderer = positionRenderer_;
    }
}
