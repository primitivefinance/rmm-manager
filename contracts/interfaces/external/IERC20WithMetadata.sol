// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

/// @title   ERC20 Interface with metadata
/// @author  Primitive

import "./IERC20.sol";

interface IERC20WithMetadata is IERC20 {
    function symbol() external view returns (string memory);

    function name() external view returns (string memory);

    function decimals() external view returns (uint8);
}
