// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveBorrowCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveRepayCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";

import "@primitivefinance/v2-core/contracts/interfaces/IPrimitiveFactory.sol";

import "./IPrimitiveHouseErrors.sol";
import "./IPrimitiveHouseEvents.sol";

import "./IMulticall.sol";
import "./ICashManager.sol";
import "./ISelfPermit.sol";

interface IPrimitiveHouse is
    IPrimitiveBorrowCallback,
    IPrimitiveCreateCallback,
    IPrimitiveDepositCallback,
    IPrimitiveLiquidityCallback,
    IPrimitiveRepayCallback,
    IPrimitiveSwapCallback,
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
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity
    ) external;

    /// @notice Deposits assets into the margin of a specific engine
    /// @dev The address of the engine is defined by the risky / stable pair
    /// @param recipient The address of the recipient
    /// @param risky The address of the risky
    /// @param stable The address of the stable
    /// @param delRisky The amount of risky to deposit
    /// @param delStable The amount of stable to deposit
    function deposit(
        address recipient,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function withdraw(
        address recipient,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function addLiquidity(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) external;

    function removeLiquidity(
        address recipient,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool toMargin
    ) external;

    function borrow(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 riskyCollateral,
        uint256 stableCollateral,
        uint256 maxRiskyPremium,
        uint256 maxStablePremium,
        bool fromMargin
    ) external;

    function repay(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 riskyCollateral,
        uint256 stableCollateral,
        bool fromMargin
    ) external;

    function swap(
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) external;

    /// VIEW FUNCTIONS ///

    /// @notice Returns the factory contract
    function factory() external view returns (IPrimitiveFactory);

    /// @notice Returns the margin of an account for a specific engine
    /// @param engine The address of the engine
    /// @param account The address of the account
    /// @return balanceRisky The balance of risky in the margin of the user
    /// balanceStable The balance of stable in the margin of the user
    function margins(address engine, address account)
        external
        view
        returns (uint128 balanceRisky, uint128 balanceStable);
}
