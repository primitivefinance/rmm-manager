// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

/// @title   Primitive House Factory interface
/// @author  Primitive

interface IPrimitiveHouseFactory {
    /// @notice Created a new engine contract!
    /// @param  from    Calling `msg.sender`
    /// @param  engine  Referenced engine address
    /// @param  house   Deployed house address
    event Deployed(address indexed from, address indexed engine, address indexed house);

    /// @notice Deploys a new House contract and sets the `getHouse` mapping for the engine 
    /// @param  engine  Referenced engine address
    /// @return house   Newly deployed house address
    function deploy(address engine) external returns (address house);

    // ===== View =====

    /// @notice Transiently set so the Engine can set immutable variables without constructor args
    /// @return factory Smart contract deploying the Engine contract
    /// engine  Referenced engine address
    /// factory address of self
    function args()
        external
        view
        returns (
            address factory,
            address engine
        );

    /// @notice Fetches engine address of a token pair
    /// @param  engine Engine address referenced by the house
    /// @return house House address for a given engine 
    function getHouse(address engine) external view returns (address house);

    /// @return Controlling address of this factory contract
    function owner() external view returns (address);
}

