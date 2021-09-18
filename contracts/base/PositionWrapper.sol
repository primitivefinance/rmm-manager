// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/// @title PositionWrapper
/// @notice Wraps the positions into ERC1155 tokens
/// @author Primitive
abstract contract PositionWrapper is ERC1155 {
    error LiquidityError();

    mapping(address => mapping(bytes32 => uint256)) public liquidityOf;

    constructor(string memory _URI) ERC1155(_URI) {}

    enum Token {
        Liquidity
    }

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

        _mint(msg.sender, getTokenId(poolId, Token.Liquidity), amount, empty);
    }

    function unwrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external {
        uint256 balance = balanceOf(msg.sender, uint256(poolId));

        if (amount > balance) revert LiquidityError();

        _burn(msg.sender, getTokenId(poolId, Token.Liquidity), amount);
    }

    function _allocate(
        address account,
        bytes32 poolId,
        uint256 amount,
        bool shouldTokenizeLiquidity
    ) internal {
        liquidityOf[account][poolId] += amount;

        if (shouldTokenizeLiquidity) {
            _mint(account, getTokenId(poolId, Token.Liquidity), amount, empty);
        }
    }

    function _remove(
        address account,
        bytes32 poolId,
        uint256 amount
    ) internal {
        liquidityOf[account][poolId] -= amount;

        _burn(account, getTokenId(poolId, Token.Liquidity), amount);
    }

    function getTokenId(
        bytes32 poolId,
        Token token
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(poolId, token)));
    }
}
