// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   HouseBase Interface
/// @author  Primitive

interface IHouseBase {
    /// @notice Thrown when the sender is not an engine
    error NotEngineError();

    /// @notice Returns the address of the factory
    function factory() external view returns (address);

    /// @notice Returns the address of WETH9
    function WETH9() external view returns (address);

    /// @notice Returns the address of the position renderer
    function positionRenderer() external view returns (address);
}
