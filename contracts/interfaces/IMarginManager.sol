// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";

/// @title MarginManager Interface
/// @author Primitive
interface IMarginManager is IPrimitiveDepositCallback {
    /// ERRORS ///

    /// @notice Thrown when the risky and stable amounts are 0
    error ZeroDelError();

    /// EVENTS ///

    /// @notice Emitted when funds are deposited
    /// @param payer The address depositing the funds
    /// @param recipient The address receiving the funds (in their margin)
    /// @param engine The engine receiving the funds
    /// @param risky The address of the risky token
    /// @param stable The address of the stable token
    /// @param delRisky The amount of deposited risky
    /// @param delStable The amount of deposited stable
    event Deposit(
        address indexed payer,
        address indexed recipient,
        address indexed engine,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    );

    /// @notice Emitted when funds are withdrawn
    /// @param payer The address withdrawing the funds
    /// @param recipient The address receiving the funds (in their wallet)
    /// @param engine The engine where the funds are withdrawn from
    /// @param delRisky The amount of withdrawn risky
    /// @param delStable The amount of withdrawn stable
    event Withdraw(
        address indexed payer,
        address indexed recipient,
        address indexed engine,
        uint256 delRisky,
        uint256 delStable
    );

    /// EFFECT FUNCTIONS ///

    /// @notice Deposits funds into the margin of an engine
    /// @param recipient The address receiving the funds in their margin
    /// @param engine The engine to deposit into
    /// @param risky The address of the risky token
    /// @param stable The address of the stable token
    /// @param delRisky The amount of risky token to deposit
    /// @param delStable The amount of stable token to deposit
    function deposit(
        address recipient,
        address engine,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    /// @notice Withdraw funds from the margin of an engine
    /// @param recipient The address receiving the funds in their wallet
    /// @param engine The engine to withdraw from
    /// @param delRisky The amount of risky token to withdraw
    /// @param delStable The amount of stable token to withdraw
    function withdraw(
        address recipient,
        address engine,
        uint256 delRisky,
        uint256 delStable
    ) external;

    /// VIEW FUNCTIONS ///

    /// @notice Returns the margin of an account for a specific engine
    /// @param engine The address of the engine
    /// @param account The address of the account
    /// @return balanceRisky The balance of risky in the margin of the user
    /// balanceStable The balance of stable in the margin of the user
    function margins(
        address engine,
        address account
    ) external view returns (
        uint128 balanceRisky,
        uint128 balanceStable
    );
}
