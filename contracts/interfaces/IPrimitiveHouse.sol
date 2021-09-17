// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";

interface IPrimitiveHouse is
    IPrimitiveCreateCallback,
    IPrimitiveLiquidityCallback
{
    error EngineNotDeployedError();
    error ZeroLiquidityError();

    event Create(
        address indexed recipient,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 strike,
        uint64 sigma,
        uint32 maturity
    );

    event Allocate(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    );

    event Remove(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        address risky,
        address stable,
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
        uint256 delLiquidity
    ) external returns (
        bytes32 poolId,
        uint256 delRisky,
        uint256 delStable
    );

    function allocate(
        address engine,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) external returns (
        uint256 delRisky,
        uint256 delStable
    );

    function remove(
        address engine,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) external returns (
        uint256 delRisky,
        uint256 delStable
    );
}
