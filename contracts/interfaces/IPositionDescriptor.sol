// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.6;

/// @title   Interface of PositionDescriptor contract
/// @author  Primitive
interface IPositionDescriptor {
    /// VIEW FUNCTIONS ///

    /// @notice  Returns the PositionRenderer contract
    function positionRenderer() external view returns (address);

    /// @notice         Returns the metadata of a token
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         JSON metadata of the token
    function getMetadata(address engine, uint256 tokenId) external view returns (string memory);
}
