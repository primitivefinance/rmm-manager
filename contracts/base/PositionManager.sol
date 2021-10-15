// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

/// @title   PositionManager
/// @author  Primitive
/// @notice  Wraps the positions into ERC1155 tokens

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../interfaces/IPositionManager.sol";
import "../interfaces/IPositionRenderer.sol";
import "../base/HouseBase.sol";

abstract contract PositionManager is IPositionManager, HouseBase, ERC1155("") {
    /// @dev Keeps track of the pool ids and the engines
    mapping(uint256 => address) private cache;

    bytes private _empty;

    /// @notice Returns the metadata of a token
    /// @param tokenId Token id to look for (pool id)
    /// @return The metadata as a string
    function uri(uint256 tokenId) public view override returns (string memory) {
        return IPositionRenderer(positionRenderer).uri(cache[tokenId], tokenId);
    }

    /// @notice         Allocates liquidity
    /// @param account  Recipient of the liquidity
    /// @param poolId   Id of the pool
    /// @param amount   Amount of liquidity to allocate
    function _allocate(
        address account,
        address engine,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _mint(account, uint256(poolId), amount, _empty);
        cache[uint256(poolId)] = engine;
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
