// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.6;

/// @title   Interface of ERC1155Permit contract
/// @author  Primitive

interface IERC1155Permit {
    /// ERRORS ///

    error DeadlineReachedError();

    error InvalidSigError();

    /// EFFECT FUNCTIONS ///

    function permit(
        address owner,
        address operator,
        bool approved,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /// VIEW FUNCTIONS ///

    function nonces(address owner) external view returns (uint256);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
}
