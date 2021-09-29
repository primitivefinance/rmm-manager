// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   CashManager Interface
/// @author  Primitive
interface ICashManager {
    /// EVENTS ///

    /// @notice          Thrown when the sender is not WETH
    /// @param expected  Expected sender (WETH)
    /// @param actual    Actual sender
    error WrongSender(address expected, address actual);

    /// @notice          Thrown when the amount required is above balance
    /// @param expected  Expected amount
    /// @param actual    Actual amount
    error AmountTooLow(uint256 expected, uint256 actual);

    /// EFFECT FUNCTIONS ///

    /// @notice           Unwraps WETH to ETH and transfers to a recipient
    /// @param amountMin  Minimum amount to unwrap
    /// @param recipient  Address of the recipient
    function unwrap(uint256 amountMin, address recipient) external payable;

    /// @notice           Transfers the tokens in the contract to a recipient
    /// @param token      Address of the token to sweep
    /// @param amountMin  Minimum amount to transfer
    /// @param recipient  Recipient of the tokens
    function sweepToken(
        address token,
        uint256 amountMin,
        address recipient
    ) external payable;

    /// @notice Transfers the ETH balance of the contract to the caller
    function refundETH() external payable;
}
