// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title CashManager Interface
/// @author Primitive
interface ICashManager {
    /// EVENTS ///

    /// @notice Emitted when the sender is not WETH
    /// @param expected The expected sender (WETH)
    /// @param actual The actual sender
    error WrongSender(address expected, address actual);

    /// @notice Emmited when the amount required is above balance
    /// @param expected The expected amount
    /// @param actual The actual amount
    error AmountTooLow(uint256 expected, uint256 actual);

    /// EFFECT FUNCTIONS ///

    /// @notice Unwraps WETH to ETH and transfers to a recipient
    /// @param amountMin The minimum amount to unwrap
    /// @param recipient The address of the recipient
    function unwrap(uint256 amountMin, address recipient) external payable;

    /// @notice Transfers the tokens in the contract to a recipient
    /// @param token The address of the token to sweep
    /// @param amountMin The minimum amount to transfer
    /// @param recipient The recipient of the tokens
    function sweepToken(
        address token,
        uint256 amountMin,
        address recipient
    ) external payable;

    /// @notice Transfers the ETH balance of the contract to the caller
    function refundETH() external payable;

    /// VIEW FUNCTIONS ///

    /// @notice Returns the address of the WETH10 token
    /// @return The address of the WETH10 token
    function WETH10() external view returns (address);
}
