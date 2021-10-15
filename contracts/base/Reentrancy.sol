// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

/// @title   Reentrancy
/// @author  Primitive
/// @notice  Prevents reentrancy

contract Reentrancy {
    /// @notice Thrown when a call to the contract is made during a locked state
    error LockedError();

    uint256 private _unlocked = 1;

    /// @notice Locks the contract to prevent reentrancy
    modifier lock() {
        if (_unlocked != 1) revert LockedError();

        _unlocked = 0;
        _;
        _unlocked = 1;
    }
}
