// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.6;

/// @title   Interface of PositionRenderer contract
/// @author  Primitive

interface IPositionRenderer {
    /// @notice         Returns a SVG representation of the token
    /// @param engine   Address of the engine
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         SVG image as a string
    function render(address engine, uint256 tokenId) external view returns (string memory);
}
