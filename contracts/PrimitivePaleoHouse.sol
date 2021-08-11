// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title Primitive Paleo House
/// @author Primitive
/// @dev House contract tailored for the Paleo testnet release

import "./PrimitiveHouse.sol";
import "./Whitelist.sol";
import "./test/Token.sol";

contract PrimitivePaleoHouse is PrimitiveHouse, Whitelist {
    constructor(address _factory) PrimitiveHouse(_factory) {}

    function useKey(
        string memory key,
        address user,
        address risky,
        address stable
    ) public {
        super.useKey(key, user);

        Token(risky).mint(user, 1000 ether);
        Token(stable).mint(user, 1000 ether);
    }

    function create(
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity
    ) public override onlyWhitelisted {
        super.create(risky, stable, strike, sigma, maturity, delta, delLiquidity);
    }

    function deposit(
        address owner,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) public override onlyWhitelisted {
        super.deposit(owner, risky, stable, delRisky, delStable);
    }

    function withdraw(
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) public override onlyWhitelisted {
        super.withdraw(risky, stable, delRisky, delStable);
    }

    function allocate(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public override onlyWhitelisted {
        super.allocate(owner, risky, stable, poolId, delLiquidity, fromMargin);
    }

    function remove(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) public override onlyWhitelisted {
        super.remove(risky, stable, poolId, delLiquidity);
    }

    function borrow(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin,
        uint256 maxPremium
    ) public override onlyWhitelisted {
        super.borrow(owner, risky, stable, poolId, delLiquidity, fromMargin, maxPremium);
    }

    function repay(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public override onlyWhitelisted {
        super.repay(owner, risky, stable, poolId, delLiquidity, fromMargin);
    }

    function swap(
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) public override onlyWhitelisted {
        super.swap(risky, stable, poolId, riskyForStable, deltaIn, deltaOutMin, fromMargin);
    }
}
