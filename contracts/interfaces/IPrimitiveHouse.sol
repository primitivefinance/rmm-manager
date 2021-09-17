// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/IPrimitiveFactory.sol";

import "./IPrimitiveHouseErrors.sol";
import "./IPrimitiveHouseEvents.sol";

import "./IMulticall.sol";
import "./ICashManager.sol";
import "./ISelfPermit.sol";

interface IPrimitiveHouse is
    IPrimitiveCreateCallback,
    IPrimitiveDepositCallback,
    IPrimitiveLiquidityCallback,
    IPrimitiveHouseErrors,
    IPrimitiveHouseEvents,
    IMulticall
{
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

    /// @notice Deposits assets into the margin of a specific engine
    /// @dev The address of the engine is defined by the risky / stable pair
    /// @param recipient The address of the recipient
    /// @param risky The address of the risky
    /// @param stable The address of the stable
    /// @param delRisky The amount of risky to deposit
    /// @param delStable The amount of stable to deposit
    function deposit(
        address recipient,
        address engine,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function withdraw(
        address recipient,
        address engine,
        uint256 delRisky,
        uint256 delStable
    ) external;

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

    function swap(
        address engine,
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin,
        bool toMargin
    ) external returns (uint256 deltaOut);
}
