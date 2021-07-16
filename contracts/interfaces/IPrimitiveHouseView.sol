// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

interface IPrimitiveHouseView {
    /// @return The address of the associated engine
    function engine() external view returns (address);

    /// @return The address of the associated risky
    function risky() external view returns (address);

    /// @return The address of the associated stable
    function stable() external view returns (address);
}
