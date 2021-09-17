// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

contract Reentrancy {
    uint256 private reentrant = 1;

    /// MODIFIERS ///
    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 0;
        _;
        reentrant = 1;
    }
}
