// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   PositionManager
/// @author  Primitive
/// @notice  Wraps the positions into ERC1155 tokens

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "../interfaces/IPositionManager.sol";
import "../interfaces/IPositionRenderer.sol";
import "../base/HouseBase.sol";

abstract contract PositionManager is IPositionManager, HouseBase, ERC1155("") {
    using Strings for uint256;

    /// @dev Keeps track of the pool ids and the engines
    mapping(uint256 => address) private cache;

    bytes private _empty;

    /// @notice         Returns the metadata of a token
    /// @param tokenId  Token id to look for (same as pool id)
    /// @return         Metadata of the token as a string
    function uri(uint256 tokenId) public view override returns (string memory) {
        return getMetadata(tokenId);
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

    /// @notice         Returns the metadata of a token
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         JSON metadata of the token
    function getMetadata(uint256 tokenId) private view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    'data:application/json;utf8,{"name":"',
                    "Name goes here",
                    '","image":"data:image/svg+xml;utf8,',
                    IPositionRenderer(positionRenderer).render(cache[tokenId], tokenId),
                    '","license":"License goes here","creator":"creator goes here",',
                    '"description":"Description goes here",',
                    getProperties(tokenId)
                )
            );
    }

    /// @notice         Returns the properties of a token
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         Properties of the token formatted as JSON
    function getProperties(uint256 tokenId) private view returns (string memory) {
        IPrimitiveEngineView engine = IPrimitiveEngineView(cache[tokenId]);

        (uint128 strike, uint64 sigma, uint32 maturity, , ) = engine.calibrations(bytes32(tokenId));
        int128 invariant = engine.invariantOf(bytes32(tokenId));

        return
            string(
                abi.encodePacked(
                    '"properties": {"risky":"',
                    uint256(uint160(engine.risky())).toHexString(),
                    '","stable":"',
                    uint256(uint160(engine.stable())).toHexString(),
                    '","strike":"',
                    uint256(strike).toString(),
                    '","maturity":"',
                    uint256(maturity).toString(),
                    '","sigma":"',
                    uint256(sigma).toString(),
                    '","invariant":"',
                    invariant < 0 ? "-" : "",
                    uint256((uint128(invariant < 0 ? ~invariant + 1 : invariant))).toString(),
                    '"}}'
                )
            );
    }
}
