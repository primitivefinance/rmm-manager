// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   PositionRenderer Interface
/// @author  Primitive

interface IPositionRenderer {
    function uri(address engineAddress, uint256 tokenId) external view returns (string memory);
}
