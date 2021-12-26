// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.6;

/// @title   Interface of PositionDescriptor contract
/// @author  Primitive
interface IPositionDescriptor {

    function positionRenderer() external view returns (address);

    function getMetadata(address engine, uint256 tokenId) external view returns (string memory);
}
