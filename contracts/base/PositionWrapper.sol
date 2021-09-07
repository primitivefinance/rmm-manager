// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/// @title PositionWrapper
/// @notice Wraps the positions into ERC1155 tokens
/// @author Primitive
abstract contract PositionWrapper is ERC1155 {
    constructor(string memory _URI) ERC1155(_URI) {}

    enum Token {
        Liquidity
    }

    bytes private empty;

    function _allocate(
        address account,
        address engine,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _mint(account, getTokenId(engine, poolId, Token.Liquidity), amount, empty);
    }

    function _remove(
        address account,
        address engine,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _burn(account, getTokenId(engine, poolId, Token.Liquidity), amount);
    }

    function getTokenId(
        address engine,
        bytes32 poolId,
        Token token
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(engine, poolId, token)));
    }
}
