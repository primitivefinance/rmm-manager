// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @notice  Position House Library
/// @author  Primitive
/// @dev     Custom position data structure for the House

import "@primitivefinance/v2-core/contracts/libraries/SafeCast.sol";

library PositionHouse {
    using SafeCast for uint256;

    /// @notice Thrown on attempting to supply more liquidity than available
    error LiquidityError();

    struct Data {
        uint128 float; // Balance of supplied liquidity
        uint128 liquidity; // Balance of liquidity
        uint128 debt; // Balance of liquidity debt that must be paid back, also balance of risky in position
    }

    /// @notice Add to the balance of liquidity
    function allocate(Data storage position, uint256 delLiquidity) internal {
        position.liquidity += delLiquidity.toUint128();
    }

    /// @notice Decrease the balance of liquidity
    /// @param delLiquidity The liquidity to remove
    function remove(Data storage position, uint256 delLiquidity) internal {
        position.liquidity -= delLiquidity.toUint128();
    }

    /// @notice Adds a debt balance of `delLiquidity` to `position`
    /// @param delLiquidity The liquidity to borrow
    function borrow(Data storage position, uint256 delLiquidity) internal {
        position.debt += delLiquidity.toUint128(); // add the debt post position manipulation
    }

    /// @notice Locks `delLiquidity` of liquidity as a float which can be borrowed from
    /// @param delLiquidity The liquidity to supply
    function supply(Data storage position, uint256 delLiquidity) internal {
        position.float += delLiquidity.toUint128();
        if (position.float > position.liquidity) revert LiquidityError();
    }

    /// @notice Unlocks `delLiquidity` of liquidity by reducing float
    /// @param delLiquidity The liquidity to claim
    function claim(Data storage position, uint256 delLiquidity) internal {
        position.float -= delLiquidity.toUint128();
    }

    /// @notice Reduces `delLiquidity` of position.debt
    function repay(Data storage position, uint256 delLiquidity) internal {
        position.debt -= delLiquidity.toUint128();
    }
}
