// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";

/// @title IPrimitiveHouse
/// @author Primitive
/// @notice Interface of PrimitiveHouse
interface IPrimitiveHouse is
    IPrimitiveCreateCallback,
    IPrimitiveLiquidityCallback
{
    /// ERRORS ///

    /// @notice Emitted when the engine is not deployed
    error EngineNotDeployedError();

    /// @notice Emitted when the liquidity is zero
    error ZeroLiquidityError();

    /// EVENTS ///

    /// @notice Emitted when a new pool is created
    /// @param recipient The recipient of the liquidity
    /// @param engine The address of the engine
    /// @param poolId The id of the new pool
    /// @param strike The strike of the new pool
    /// @param sigma The sigma of the new pool
    /// @param maturity The maturity of the new pool
    event Create(
        address indexed recipient,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 strike,
        uint64 sigma,
        uint32 maturity
    );

    /// @notice Emitted when liquidity is allocated
    /// @param payer The payer sending liquidity
    /// @param engine The engine receiving liquidity
    /// @param poolId The id of the pool receiving liquidity
    /// @param delLiquidity The amount of liquidity allocated
    /// @param delRisky The amount of risky tokens allocated
    /// @param delStable The amount of stable tokens allocated
    /// @param fromMargin True if liquidity was paid from margin
    event Allocate(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    );

    /// @notice Emitted when liquidity is removed
    /// @param payer The payer receiving liquidity
    /// @param engine The engine where liquidity is removed from
    /// @param poolId The id of the pool where liquidity is removed from
    /// @param delLiquidity The amount of liquidity removed
    /// @param delRisky The amount of risky tokens allocated
    /// @param delStable The amount of stable tokens allocated
    event Remove(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable
    );

    /// EFFECT FUNCTIONS ///

    /// @notice Creates a new pool using the
    /// @param risky The address of the risky asset
    /// @param stable The address of the stable asset
    /// @param sigma The sigma of the curve
    /// @param maturity The maturity of the curve (as a timestamp)
    /// @param delta The initial delta of the curve
    /// @param delLiquidity The amount of initial liquidity to provide
    function create(
        address engine,
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity,
        bool shouldTokenizeLiquidity
    ) external returns (
        bytes32 poolId,
        uint256 delRisky,
        uint256 delStable
    );

    /// @notice Allocates liquidity into a pool
    /// @param engine The address of the engine
    /// @param risky The address of the risky asset
    /// @param stable The address of the stable asset
    /// @param poolId The id of the pool
    /// @param delLiquidity The amount of liquidity to allocate
    /// @param fromMargin True if margins should be used
    /// @param shouldTokenizeLiquidity True if liquidity should be tokenized
    function allocate(
        address engine,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin,
        bool shouldTokenizeLiquidity
    ) external returns (
        uint256 delRisky,
        uint256 delStable
    );

    /// @notice Removes liquidity from a pool
    /// @param engine The address of the engine
    /// @param poolId The id of the pool
    /// @param delLiquidity The amount of liquidity to remove
    function remove(
        address engine,
        bytes32 poolId,
        uint256 delLiquidity
    ) external returns (
        uint256 delRisky,
        uint256 delStable
    );
}
