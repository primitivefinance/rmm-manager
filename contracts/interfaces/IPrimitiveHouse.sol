// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";

/// @title   PrimitiveHouse Interface
/// @author  Primitive
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

    /// @notice           Emitted when a new pool is created
    /// @param recipient  Recipient of the liquidity
    /// @param engine     Address of the engine
    /// @param poolId     Id of the new pool
    /// @param strike     Strike of the new pool
    /// @param sigma      Sigma of the new pool
    /// @param maturity   Maturity of the new pool
    event Create(
        address indexed recipient,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 strike,
        uint64 sigma,
        uint32 maturity
    );

    /// @notice              Emitted when liquidity is allocated
    /// @param payer         Payer sending liquidity
    /// @param engine        Engine receiving liquidity
    /// @param poolId        Id of the pool receiving liquidity
    /// @param delLiquidity  Amount of liquidity allocated
    /// @param delRisky      Amount of risky tokens allocated
    /// @param delStable     Amount of stable tokens allocated
    /// @param fromMargin    True if liquidity was paid from margin
    event Allocate(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    );

    /// @notice              Emitted when liquidity is removed
    /// @param payer         Payer receiving liquidity
    /// @param engine        Engine where liquidity is removed from
    /// @param poolId        Id of the pool where liquidity is removed from
    /// @param delLiquidity  Amount of liquidity removed
    /// @param delRisky      Amount of risky tokens allocated
    /// @param delStable     Amount of stable tokens allocated
    event Remove(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable
    );

    /// EFFECT FUNCTIONS ///

    /// @notice              Creates a new pool using the
    /// @param risky         Address of the risky asset
    /// @param stable        Address of the stable asset
    /// @param sigma         Sigma of the curve
    /// @param maturity      Maturity of the curve (as a timestamp)
    /// @param delta         Initial delta of the curve
    /// @param delLiquidity  Amount of initial liquidity to provide
    function create(
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity
    ) external returns (
        bytes32 poolId,
        uint256 delRisky,
        uint256 delStable
    );

    /// @notice                         Allocates liquidity into a pool
    /// @param risky                    Address of the risky asset
    /// @param stable                   Address of the stable asset
    /// @param poolId                   Id of the pool
    /// @param delLiquidity             Amount of liquidity to allocate
    /// @param fromMargin               True if margins should be used
    function allocate(
        bytes32 poolId,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    ) external returns (uint256 delLiquidity);

    /// @notice              Removes liquidity from a pool
    /// @param engine        Address of the engine
    /// @param poolId        Id of the pool
    /// @param delLiquidity  Amount of liquidity to remove
    function remove(
        address engine,
        bytes32 poolId,
        uint256 delLiquidity
    ) external returns (
        uint256 delRisky,
        uint256 delStable
    );
}
