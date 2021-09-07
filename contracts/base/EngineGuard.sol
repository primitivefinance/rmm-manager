// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;


contract EngineGuard {
    /// @notice Thrown when the callback msg.sender is not the expected engine
    error NotEngineError();

    address internal _engine;

    modifier onlyEngine() {
        if (msg.sender != _engine) revert NotEngineError();
        _;
    }
}
