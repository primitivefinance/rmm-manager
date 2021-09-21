// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

interface IPositionWrapper {
    /// ERRORS ///

    /// @notice Emitted when there is a liquidity issue
    error LiquidityError();

    /// EFFECT FUNCTIONS ///

    /// @notice Wraps liquidity into ERC1155 tokens
    /// @param poolId The id of the pool
    /// @param amount The amount of liquidity to wrap
    function wrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external;

    /// @notice Unwraps liquidity into ERC1155 tokens
    /// @param poolId The id of the pool
    /// @param amount The amount of liquidity to unwrap
    function unwrapLiquidity(
        bytes32 poolId,
        uint256 amount
    ) external;

    /// VIEW FUNCTIONS ///

    /// @notice Retuns the liquidity of an holder for a specific pool
    /// @param account The address of the holder
    /// @param poolId The id of the pool
    function liquidityOf(
        address account,
        bytes32 poolId
    ) external view returns (uint256);
}
