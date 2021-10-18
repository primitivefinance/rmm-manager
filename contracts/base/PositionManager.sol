// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   PositionManager
/// @author  Primitive
/// @notice  Wraps the positions into ERC1155 tokens

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "../interfaces/IPositionManager.sol";
import "../interfaces/IPositionRenderer.sol";
import "../base/HouseBase.sol";

abstract contract PositionManager is IPositionManager, HouseBase, ERC1155("") {
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

        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, uint32 creationTimestamp) = engine
            .calibrations(bytes32(tokenId));

        return
            string(
                abi.encodePacked(
                    '"properties": {"risky":"',
                    addressToString(engine.risky()),
                    '","stable":"',
                    addressToString(engine.stable()),
                    '","strike":"',
                    uint2str(strike),
                    '","maturity":"',
                    uint2str(maturity),
                    '","sigma":"',
                    uint2str(sigma),
                    '","invariant":"',
                    "Invariant goes here",
                    '"}}'
                )
            );
    }

    /// @notice      Converts an address into a string
    /// @param addr  Address to convert
    /// @return      Address converted into a memory string
    function addressToString(address addr) private pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(51);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(value[i + 12] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(value[i + 12] & 0x0f))];
        }
        return string(str);
    }

    /// @notice   Converts a uint256 into a string
    /// @param i  Number of type uint256 to convert
    /// @return   Number converted into a memory string
    function uint2str(uint256 i) private pure returns (string memory) {
        if (i == 0) {
            return "0";
        }

        uint256 j = i;
        uint256 length;

        while (j != 0) {
            length++;
            j /= 10;
        }

        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = i;

        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }

        return string(bstr);
    }
}
