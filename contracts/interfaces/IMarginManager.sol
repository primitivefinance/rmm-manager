// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";

interface IMarginManager is IPrimitiveDepositCallback {
    /// ERRORS ///

    error ZeroDelError();

    /// EVENTS ///

    event Deposit(
        address indexed payer,
        address indexed recipient,
        address indexed engine,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    );

    event Withdraw(
        address indexed payer,
        address indexed recipient,
        address indexed engine,
        uint256 delRisky,
        uint256 delStable
    );

    /// EFFECT FUNCTIONS ///

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

    /// VIEW FUNCTIONS ///

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
