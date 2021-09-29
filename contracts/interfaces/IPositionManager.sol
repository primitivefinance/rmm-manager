// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @notice  PositionManager Interface
/// @author  Primitive
interface IPositionManager {
    /// ERRORS ///

    /// @notice Emitted when there is a liquidity issue
    error LiquidityError();

    /// EFFECT FUNCTIONS ///

    /// @notice        Wraps liquidity into ERC1155 tokens
    /// @param poolId  Id of the pool
    /// @param amount  Amount of liquidity to wrap
    function wrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external;

    /// @notice        Unwraps liquidity into ERC1155 tokens
    /// @param poolId  Id of the pool
    /// @param amount  Amount of liquidity to unwrap
    function unwrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external;

    /// VIEW FUNCTIONS ///

    /// @notice         Retuns the liquidity of an holder for a specific pool
    /// @param account  Address of the holder
    /// @param poolId   Id of the pool
    function liquidityOf(
        address account,
        bytes32 poolId
    ) external view returns (uint256);
}
