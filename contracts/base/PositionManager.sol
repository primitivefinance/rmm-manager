// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../interfaces/IPositionManager.sol";

/// @title   PositionManager
/// @author  Primitive
/// @notice  Wraps the positions into ERC1155 tokens
abstract contract PositionManager is IPositionManager, ERC1155 {
    /// @param URI_ Address of the base URI
    constructor(string memory URI_) ERC1155(URI_) {}

    bytes private _empty;

    /// @notice                         Allocates liquidity
    /// @param account                  Recipient of the liquidity
    /// @param poolId                   Id of the pool
    /// @param amount                   Amount of liquidity to allocate
    function _allocate(
        address account,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _mint(account, uint256(poolId), amount, _empty);
    }

    /// @notice         Removes liquidity
    /// @param account  Account to remove from
    /// @param poolId   Id of the pool
    /// @param amount   Amount of liquidity to remove
    function _remove(
        address account,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _burn(account, uint256(poolId), amount);
    }
}
