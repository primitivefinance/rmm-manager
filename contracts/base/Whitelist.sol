// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/IWhitelist.sol";
import "./Admin.sol";

contract Whitelist is IWhitelist, Admin {
    /// STORAGE PROPERTIES ///

    /// @inheritdoc IWhitelist
    mapping(address => bool) public override isWhitelisted;

    /// @inheritdoc IWhitelist
    mapping(bytes32 => bool) public override isHashedKey;

    /// MODIFIERS ///

    /// @notice Restricts the call to a whitelisted sender
    modifier onlyWhitelisted() {
        require(isWhitelisted[msg.sender] == true, "Caller not whitelisted");

        _;
    }

    constructor() {
        initializeAdmin(msg.sender);
    }

    /// @inheritdoc IWhitelist
    function addKeys(bytes32[] memory hashes) external override onlyAdmin() {
        for (uint256 i = 0; i < hashes.length; i += 1) {
            isHashedKey[hashes[i]] = true;
        }
    }

    /// @inheritdoc IWhitelist
    function useKey(string memory key, address user) public virtual override {
        require(isWhitelisted[user] == false, "Already whitelisted");
        bytes32 hash = keccak256(abi.encodePacked(key));
        require(isHashedKey[hash] == true, "Invalid key");
        isWhitelisted[user] = true;
        isHashedKey[hash] = false;
        emit Whitelisted(user);
    }

    /// @inheritdoc IWhitelist
    function blacklist(address user) external override onlyAdmin() {
        isWhitelisted[user] = false;
        emit Blacklisted(user);
    }

    /// VIEW FUNCTIONS ///

    /// @inheritdoc IWhitelist
    function isKeyValid(string memory key) external view override returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(key));
        return isHashedKey[hash];
    }
}
