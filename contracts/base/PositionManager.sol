// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   PositionManager contract
/// @author  Primitive
/// @notice  Wraps the positions into ERC1155 tokens

import "@openzeppelin/contracts/utils/Strings.sol";
import "@primitivefinance/rmm-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "base64-sol/base64.sol";
import "./ERC1155Permit.sol";
import "../interfaces/IPositionRenderer.sol";
import "../interfaces/external/IERC20WithMetadata.sol";
import "../base/ManagerBase.sol";

abstract contract PositionManager is ManagerBase, ERC1155Permit {
    using Strings for uint256;

    /// @dev  Ties together pool ids with engine addresses, this is necessary because
    ///       there is no way to get the Primitive Engine address from a pool id
    mapping(uint256 => address) private cache;

    /// @dev  Empty variable to pass to the _mint function
    bytes private _empty;

    /// @notice         Returns the metadata of a token
    /// @param tokenId  Token id to look for (same as pool id)
    /// @return         Metadata of the token as a string
    function uri(uint256 tokenId) public view override returns (string memory) {
        return getMetadata(tokenId);
    }

    /// @notice         Allocates {amount} of {poolId} liquidity to {account} balance
    /// @param account  Recipient of the liquidity
    /// @param engine   Address of the Primitive Engine
    /// @param poolId   Id of the pool
    /// @param amount   Amount of liquidity to allocate
    function _allocate(
        address account,
        address engine,
        bytes32 poolId,
        uint256 amount
    ) internal {
        _mint(account, uint256(poolId), amount, _empty);

        if (cache[uint256(poolId)] == address(0)) cache[uint256(poolId)] = engine;
    }

    /// @notice         Removes {amount} of {poolId} liquidity from {account} balance
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
        return string(abi.encodePacked(
            'data:application/json;base64,',
            Base64.encode(bytes(abi.encodePacked(
                '{"name":"',
                getName(tokenId),
                '","image":"',
                IPositionRenderer(positionRenderer).render(cache[tokenId], tokenId),
                '","license":"MIT","creator":"primitive.eth",',
                '"description":"Concentrated liquidity tokens of a two-token AMM",',
                getProperties(tokenId)
            )))
        ));
    }

    function getName(uint256 tokenId) private view returns (string memory) {
        IPrimitiveEngineView engine = IPrimitiveEngineView(cache[tokenId]);
        address risky = engine.risky();
        address stable = engine.stable();

        return string(abi.encodePacked(
            "Primitive RMM-01 LP ",
            IERC20WithMetadata(risky).name(),
            "-",
            IERC20WithMetadata(stable).name()
        ));
    }

    /// @notice         Returns the properties of a token
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         Properties of the token formatted as JSON
    function getProperties(uint256 tokenId) private view returns (string memory) {
        IPrimitiveEngineView engine = IPrimitiveEngineView(cache[tokenId]);
        int128 invariant = engine.invariantOf(bytes32(tokenId));

        return
            string(
                abi.encodePacked(
                    '"properties":{',
                    '"factory":"',
                    uint256(uint160(engine.factory())).toHexString(),
                    '","risky":',
                    getTokenMetadata(engine.risky()),
                    ',"stable":',
                    getTokenMetadata(engine.stable()),
                    ',"invariant":"',
                    invariant < 0 ? "-" : "",
                    uint256((uint128(invariant < 0 ? ~invariant + 1 : invariant))).toString(),
                    '",',
                    getCalibration(tokenId),
                    ",",
                    getReserve(tokenId),
                    "}}"
                )
            );
    }

    function getTokenMetadata(address token) private view returns (string memory) {
        string memory name = IERC20WithMetadata(token).name();
        string memory symbol = IERC20WithMetadata(token).symbol();
        uint8 decimals = IERC20WithMetadata(token).decimals();

        return string(abi.encodePacked(
            '{"name":"',
            name,
            '","symbol":"',
            symbol,
            '","decimals":"',
            uint256(decimals).toString(),
            '","address":"',
            uint256(uint160(token)).toHexString(),
            '"}'
        ));
    }

    /// @notice         Returns the calibration of a pool as JSON
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         Calibration of the pool formatted as JSON
    function getCalibration(uint256 tokenId) private view returns (string memory) {
        IPrimitiveEngineView engine = IPrimitiveEngineView(cache[tokenId]);

        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, uint32 gamma) = engine.calibrations(
            bytes32(tokenId)
        );

        return
            string(
                abi.encodePacked(
                    '"calibration":{',
                    '"strike":"',
                    uint256(strike).toString(),
                    '","sigma":"',
                    uint256(sigma).toString(),
                    '","maturity":"',
                    uint256(maturity).toString(),
                    '","lastTimestamp":"',
                    uint256(lastTimestamp).toString(),
                    '","gamma":"',
                    uint256(gamma).toString(),
                    '"}'
                )
            );
    }

    /// @notice         Returns the reserves of a pool as JSON
    /// @param tokenId  Id of the token (same as pool id)
    /// @return         Reserves of the pool formatted as JSON
    function getReserve(uint256 tokenId) private view returns (string memory) {
        IPrimitiveEngineView engine = IPrimitiveEngineView(cache[tokenId]);

        (
            uint128 reserveRisky,
            uint128 reserveStable,
            uint128 liquidity,
            uint32 blockTimestamp,
            uint256 cumulativeRisky,
            uint256 cumulativeStable,
            uint256 cumulativeLiquidity
        ) = engine.reserves(bytes32(tokenId));

        return
            string(
                abi.encodePacked(
                    '"reserve":{',
                    '"reserveRisky":"',
                    uint256(reserveRisky).toString(),
                    '","reserveStable":"',
                    uint256(reserveStable).toString(),
                    '","liquidity":"',
                    uint256(liquidity).toString(),
                    '","blockTimestamp":"',
                    uint256(blockTimestamp).toString(),
                    '","cumulativeRisky":"',
                    uint256(cumulativeRisky).toString(),
                    '","cumulativeStable":"',
                    uint256(cumulativeStable).toString(),
                    '","cumulativeLiquidity":"',
                    uint256(cumulativeLiquidity).toString(),
                    '"}'
                )
            );
    }
}
