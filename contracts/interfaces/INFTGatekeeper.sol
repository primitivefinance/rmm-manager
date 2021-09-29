// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.6;

/// @title   INFTGatekeeper
/// @author  Primitive
/// @notice  Interface of NFTGatekeeper
interface INFTGatekeeper {
    /// @notice Emitted when the caller does not own the NFT
    error ZeroBalance();

    /// @notice Returns the address of the token contract to look for
    function token() external view returns (address);

    /// @notice Returns the id of the token contract to look for
    function id() external view returns (uint256);
}
