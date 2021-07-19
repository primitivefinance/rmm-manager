// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

interface IAdmin {
    /// EVENTS ///

    /// @notice Emitted when a new admin is set
    /// @param oldAdmin The address of the old admin
    /// @param newAdmin The address of the new admin
    event AdminSet(address oldAdmin, address newAdmin);

    /// EFFECT FUNCTIONS ///

    /// @notice Sets a new admin
    /// @param newAdmin The address of the new admin
    function setAdmin(address newAdmin) external;

    /// VIEW FUNCTIONS ///

    /// @notice The current admin
    /// @return The address of the current admin
    function admin() external view returns (address);
}
