// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "../interfaces/IPositionWrapper.sol";

/// @title PositionWrapper
/// @author Primitive
/// @notice Wraps the positions into ERC1155 tokens
abstract contract PositionWrapper is ERC1155 {
    error LiquidityError();

    mapping(address => mapping(bytes32 => uint256)) public liquidityOf;

    constructor(string memory _URI) ERC1155(_URI) {}

    bytes private empty;

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

    function wrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external {
        uint256 balance = balanceOf(msg.sender, uint256(poolId));
        uint256 liquidity = liquidityOf[msg.sender][poolId];
        uint256 unwrapped = liquidity - balance;

        if (amount > unwrapped) revert LiquidityError();

        _mint(msg.sender, uint256(poolId), amount, empty);
    }

    function unwrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external {
        uint256 balance = balanceOf(msg.sender, uint256(poolId));

        if (amount > balance) revert LiquidityError();

        _burn(msg.sender, uint256(poolId), amount);
    }

    function _allocate(
        address account,
        bytes32 poolId,
        uint256 amount,
        bool shouldTokenizeLiquidity
    ) internal {
        liquidityOf[account][poolId] += amount;

        if (shouldTokenizeLiquidity) {
            _mint(account, uint256(poolId), amount, empty);
        }
    }

    function _remove(
        address account,
        bytes32 poolId,
        uint256 amount
    ) internal {
        liquidityOf[account][poolId] -= amount;

        _burn(account, uint256(poolId), amount);
    }
}
