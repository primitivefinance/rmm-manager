// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";

/// @title  SwapManager Interface
/// @author  Primitive
interface ISwapManager is IPrimitiveSwapCallback {
    /// @notice                Parameters for the swap function
    /// @param recipient       Address of the recipient
    /// @param risky           Address of the risky token
    /// @param stable          Address of the stable token
    /// @param poolId          Id of the pool
    /// @param riskyForStable  True if swapping risky for stable
    /// @param deltaIn         Exact amount to swap
    /// @param deltaOutMin     Minimum expected amount to receive
    /// @param fromMargin      True if the sent amount should be taken from the margin
    /// @param toMargin        True if the received amount should be sent to the margin
    /// @param deadline        Transaction will revert above this deadline
    struct SwapParameters {
        address recipient;
        address risky;
        address stable;
        bytes32 poolId;
        bool riskyForStable;
        uint256 deltaIn;
        uint256 deltaOutMin;
        bool fromMargin;
        bool toMargin;
        uint256 deadline;
    }

    /// ERRORS ///

    /// @notice          Thrown when the delta out is lower than the minimum expected
    /// @param expected  Minimum expected delta out
    /// @param actual    Actual delta out
    error DeltaOutMinError(uint256 expected, uint256 actual);

    /// @notice Thrown when the deadline is reached
    error DeadlineReachedError();

    /// EVENTS ///

    /// @notice                Emitted when a swap occurs
    /// @param payer           Address of the payer
    /// @param recipient       Address of the recipient
    /// @param engine          Address of the engine
    /// @param poolId          Id of the pool
    /// @param riskyForStable  True if swapping risky for stable
    /// @param deltaIn         Sent amount
    /// @param deltaOut        Received amount
    /// @param fromMargin      True if the sent amount is taken from the margin
    /// @param toMargin        True if the received amount is sent to the margin
    event Swap(
        address indexed payer,
        address recipient,
        address indexed engine,
        bytes32 indexed poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOut,
        bool fromMargin,
        bool toMargin
    );

    /// EFFECTS FUNCTIONS ///

    /// @notice           Swaps an exact amount of risky OR stable tokens for some risky OR stable tokens
    /// @dev              Funds are swapped from a specific pool located into a specific engine
    /// @param params     A struct of type SwapParameters
    /// @return deltaOut  The amount of received tokens
    function swap(SwapParameters memory params) external returns (uint256 deltaOut);
}
