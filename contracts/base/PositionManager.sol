// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../interfaces/IPositionManager.sol";

/// @title   PositionManager
/// @author  Primitive
/// @notice  Wraps the positions into ERC1155 tokens
abstract contract PositionManager is IPositionManager, ERC1155 {
    /// @inheritdoc IPositionManager
    mapping(address => mapping(bytes32 => uint256)) public override liquidityOf;

    /// @param URI_ Address of the base URI
    constructor(string memory URI_) ERC1155(URI_) {}

    bytes private _empty;

    /// @inheritdoc ERC1155
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        super.safeTransferFrom(from, to, id, amount, data);

        // safeTransferFrom already checks the approval
        liquidityOf[from][bytes32(id)] -= amount;
        liquidityOf[to][bytes32(id)] += amount;
    }

    /// @inheritdoc ERC1155
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        super.safeBatchTransferFrom(from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; i += 1) {
            liquidityOf[from][bytes32(ids[i])] -= amounts[i];
            liquidityOf[to][bytes32(ids[i])] += amounts[i];
        }
    }

    /// @inheritdoc IPositionManager
    function wrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external override {
        uint256 balance = balanceOf(msg.sender, uint256(poolId));
        uint256 liquidity = liquidityOf[msg.sender][poolId];
        uint256 unwrapped = liquidity - balance;

        if (amount > unwrapped) revert LiquidityError();

        _mint(msg.sender, uint256(poolId), amount, _empty);
    }

    /// @inheritdoc IPositionManager
    function unwrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external override {
        uint256 balance = balanceOf(msg.sender, uint256(poolId));

        if (amount > balance) revert LiquidityError();

        _burn(msg.sender, uint256(poolId), amount);
    }

    /// @notice                         Allocates liquidity
    /// @param account                  Recipient of the liquidity
    /// @param poolId                   Id of the pool
    /// @param amount                   Amount of liquidity to allocate
    /// @param shouldTokenizeLiquidity  True if liquidity should be tokenized
    function _allocate(
        address account,
        bytes32 poolId,
        uint256 amount,
        bool shouldTokenizeLiquidity
    ) internal {
        liquidityOf[account][poolId] += amount;

        if (shouldTokenizeLiquidity) {
            _mint(account, uint256(poolId), amount, _empty);
        }
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
        liquidityOf[account][poolId] -= amount;

        if (balanceOf(account, uint256(poolId)) >= amount) {
            _burn(account, uint256(poolId), amount);
        }
    }
}
