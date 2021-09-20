// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title Reentrancy
/// @author Primitive
/// @notice Prevents reentrancy
contract Reentrancy {
    uint256 private reentrant = 1;

    /// @notice Locks the contract to prevent reentrancy
    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 0;
        _;
        reentrant = 1;
    }
}
