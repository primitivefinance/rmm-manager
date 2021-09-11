// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

abstract contract Reentrancy {
    uint256 private reentrant;

    /// MODIFIERS ///
    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }
}
