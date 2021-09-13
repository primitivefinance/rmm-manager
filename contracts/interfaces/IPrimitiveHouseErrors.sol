// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

interface IPrimitiveHouseErrors {
    /// @notice Thrown when the delta out is lower than the minimum
    /// @param expected The minimum delta out
    /// @param actual The actual delta out
    error DeltaOutMinError(uint256 expected, uint256 actual);

    error NotEngineError();
}
