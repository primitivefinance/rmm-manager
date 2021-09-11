// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title Primitive Paleo House
/// @author Primitive
/// @dev House contract tailored for the Paleo testnet release

import "./PrimitiveHouse.sol";

contract PrimitivePaleoHouse is PrimitiveHouse {
    address public token;

    constructor(
        address _factory,
        address _WETH10,
        string memory _URI
    ) PrimitiveHouse(_factory, _WETH10, _URI) {}
}
