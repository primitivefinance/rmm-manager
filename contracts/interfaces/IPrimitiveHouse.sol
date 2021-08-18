// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveBorrowCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveRepayCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/IPrimitiveFactory.sol";

import "./IMulticall.sol";

interface IPrimitiveHouse is
    IPrimitiveBorrowCallback,
    IPrimitiveCreateCallback,
    IPrimitiveDepositCallback,
    IPrimitiveLiquidityCallback,
    IPrimitiveRepayCallback,
    IPrimitiveSwapCallback,
    IMulticall
{
    /// ERRORS ///

    /// @notice Thrown when the callback msg.sender is not the expected engine
    /// @param expected The expected address (engine)
    /// @param actual The actual callback msg.sender
    error NotEngineError(address expected, address actual);

    /// @notice Thrown when the actual premium is higher than the maximum
    /// @param expected The maximum premium expected
    /// @param actual The actual premium
    error MaxPremiumError(uint256 expected, uint256 actual);

    /// @notice Thrown when the delta out is lower than the minimum
    /// @param expected The minimum delta out
    /// @param actual The actual delta out
    error DeltaOutMinError(uint256 expected, uint256 actual);

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
    /// @param risky The address of the risky
    /// @param stable The address of the stable
    /// @param owner The address of the recipient
    /// @param delRisky The amount of risky to deposit
    /// @param delStable The amount of stable to deposit
    function deposit(
        address risky,
        address stable,
        address owner,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function withdraw(
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function allocate(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) external;

    function remove(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) external;

    function borrow(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin,
        uint256 maxPremium
    ) external;

    function repay(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
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
