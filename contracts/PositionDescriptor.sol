// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@primitivefi/rmm-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "base64-sol/base64.sol";
import "./interfaces/IPositionRenderer.sol";
import "./interfaces/external/IERC20WithMetadata.sol";
import "./interfaces/IPositionDescriptor.sol";

/// @title   PositionDescriptor contract
/// @author  Primitive
/// @notice  Manages the metadata of the Primitive protocol position tokens
contract PositionDescriptor is IPositionDescriptor {
    using Strings for uint256;

    /// STATE VARIABLES ///

    /// @inheritdoc IPositionDescriptor
    address public override positionRenderer;

    /// EFFECT FUNCTIONS ///

    /// @param positionRenderer_  Address of the PositionRenderer contract
    constructor(address positionRenderer_) {
        positionRenderer = positionRenderer_;
    }

    /// VIEW FUNCTIONS ///

    /// @inheritdoc IPositionDescriptor
    function getMetadata(address engine, uint256 tokenId) external view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                getName(IPrimitiveEngineView(engine)),
                                '","image":"',
                                IPositionRenderer(positionRenderer).render(engine, tokenId),
                                '","license":"MIT","creator":"primitive.eth",',
                                '"description":"Concentrated liquidity tokens of a two-token AMM",',
                                '"properties":{',
                                getProperties(IPrimitiveEngineView(engine), tokenId),
                                "}}"
                            )
                        )
                    )
                )
            );
    }

    /// @dev           Returns the name of a position token
    /// @param engine  Address of the PrimitiveEngine contract
    /// @return        Name of the position token as a string
    function getName(IPrimitiveEngineView engine) private view returns (string memory) {
        address risky = engine.risky();
        address stable = engine.stable();

        return
            string(
                abi.encodePacked(
                    "Primitive RMM-01 LP ",
                    IERC20WithMetadata(risky).name(),
                    "-",
                    IERC20WithMetadata(stable).name()
                )
            );
    }

    /// @dev            Returns the properties of a position token
    /// @param engine   Address of the PrimitiveEngine contract
    /// @param tokenId  Id of the position token (pool id)
    /// @return         Properties of the position token as a JSON object
    function getProperties(IPrimitiveEngineView engine, uint256 tokenId) private view returns (string memory) {
        int128 invariant = engine.invariantOf(bytes32(tokenId));

        return
            string(
                abi.encodePacked(
                    '"factory":"',
                    uint256(uint160(engine.factory())).toHexString(),
                    '",',
                    getTokenMetadata(engine.risky(), true),
                    ",",
                    getTokenMetadata(engine.stable(), false),
                    ',"invariant":"',
                    invariant < 0 ? "-" : "",
                    uint256((uint128(invariant < 0 ? ~invariant + 1 : invariant))).toString(),
                    '",',
                    getCalibration(engine, tokenId),
                    ",",
                    getReserve(engine, tokenId)
                )
            );
    }

    /// @dev            Returns the metadata of an ERC20 token
    /// @param token    Address of the ERC20 token
    /// @param isRisky  True if the token is the risky
    /// @return         Metadata of the ERC20 token as a JSON object
    function getTokenMetadata(address token, bool isRisky) private view returns (string memory) {
        string memory prefix = isRisky ? "risky" : "stable";
        string memory metadata;

        {
            metadata = string(
                abi.encodePacked(
                    '"',
                    prefix,
                    'Name":"',
                    IERC20WithMetadata(token).name(),
                    '","',
                    prefix,
                    'Symbol":"',
                    IERC20WithMetadata(token).symbol(),
                    '","',
                    prefix,
                    'Decimals":"',
                    uint256(IERC20WithMetadata(token).decimals()).toString(),
                    '"'
                )
            );
        }

        return
            string(abi.encodePacked(metadata, ',"', prefix, 'Address":"', uint256(uint160(token)).toHexString(), '"'));
    }

    /// @dev            Returns the calibration of a pool
    /// @param engine   Address of the PrimitiveEngine contract
    /// @param tokenId  Id of the position token (pool id)
    /// @return         Calibration of the pool as a JSON object
    function getCalibration(IPrimitiveEngineView engine, uint256 tokenId) private view returns (string memory) {
        (uint128 strike, uint64 sigma, uint32 maturity, uint32 lastTimestamp, uint32 gamma) = engine.calibrations(
            bytes32(tokenId)
        );

        return
            string(
                abi.encodePacked(
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
                    '"'
                )
            );
    }

    /// @notice         Returns the reserves of a pool
    /// @param engine   Address of the PrimitiveEngine contract
    /// @param tokenId  Id of the position token (pool id)
    /// @return         Reserves of the pool as a JSON object
    function getReserve(IPrimitiveEngineView engine, uint256 tokenId) private view returns (string memory) {
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
                    '"'
                )
            );
    }
}
