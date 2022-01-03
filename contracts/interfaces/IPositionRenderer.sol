// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.6;

/// @title   Interface of PositionRenderer contract
/// @author  Primitive
interface IPositionRenderer {
    /// @notice         Returns a SVG representation of a position token
    /// @param engine   Address of the PrimitiveEngine contract
    /// @param tokenId  Id of the position token (pool id)
    /// @return         SVG image as a base64 encoded string
    function render(address engine, uint256 tokenId) external view returns (string memory);
}
