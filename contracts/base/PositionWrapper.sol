// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

abstract contract PositionWrapper is ERC1155 {
    constructor() ERC1155("") {}

    enum Token {
        Liquidity,
        Float,
        Risky,
        Stable
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

    function _supply(
        address account,
        address engine,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _mint(account, getTokenId(engine, poolId, Token.Float), amount, empty);
        _burn(account, getTokenId(engine, poolId, Token.Liquidity), amount);
    }

    function _claim(
        address account,
        address engine,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _burn(account, getTokenId(engine, poolId, Token.Float), amount);
        _mint(account, getTokenId(engine, poolId, Token.Liquidity), amount, empty);
    }

    function _borrow(
        address account,
        address engine,
        bytes32 poolId,
        uint256 risky,
        uint256 stable
    ) internal {
        _mint(account, getTokenId(engine, poolId, Token.Risky), risky, empty);
        _mint(account, getTokenId(engine, poolId, Token.Stable), stable, empty);
    }

    function _repay(
        address account,
        address engine,
        bytes32 poolId,
        uint256 risky,
        uint256 stable
    ) internal {
        _burn(account, getTokenId(engine, poolId, Token.Risky), risky);
        _burn(account, getTokenId(engine, poolId, Token.Stable), stable);
    }

    function getTokenId(
        address engine,
        bytes32 poolId,
        Token token
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(engine, poolId, token)));
    }
}
