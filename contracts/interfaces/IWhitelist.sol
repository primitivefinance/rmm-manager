// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "./IAdmin.sol";

interface IWhitelist {
    /// EVENTS ///

    /// @notice Emitted when a user is whitelisted
    /// @param user The address of the user
    event Whitelisted(address user);

    /// @notice Emitted when a user is blacklisted
    /// @param user The address of the user
    event Blacklisted(address user);

    /// EFFECT FUNCTIONS ///

    /// @notice Adds new keys
    /// @param hashes An array of hashed keys to add
    function addKeys(bytes32[] memory hashes) external;

    /// @notice Uses a key
    /// @param key The key to use
    /// @param user The address of the user to whitelist
    function useKey(string memory key, address user) external;

    /// @notice Blacklists a user
    /// @param user The address of the user to blacklist
    function blacklist(address user) external;

    /// VIEW FUNCTIONS ///

    /// @notice Checks if a user is whitelisted
    /// @param user The address of the user to check
    /// @return True is the user is whitelisted
    function isWhitelisted(address user) external returns (bool);

    /// @notice Checks if a hashed key is valid
    /// @param hashedKey The hashed key to check
    /// @return True if the hashed key is valid
    function isHashedKey(bytes32 hashedKey) external returns (bool);

    /// @notice Checks if a key is valid
    /// @param key The key to inspect
    /// @return True if the key is valid
    function isKeyValid(string memory key) external returns (bool);
}
