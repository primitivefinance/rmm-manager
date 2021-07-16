// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

interface IPrimitiveHouseEvents {
    event Created(
        address indexed user,
        bytes32 poolId,
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice,
        uint256 delRisky,
        uint256 delStable
    );

    event Deposited(address indexed user, uint256 delRisky, uint256 delStable);

    event Withdrawn(address indexed user, uint256 delRisky, uint256 delStable);

    event Borrowed(
        address indexed user,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 maxPremium,
        uint256 premium
    );

    event AllocatedAndLent(
        address indexed user,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        bool fromMargin,
        uint256 delRisky,
        uint256 delStable
    );

    event Repaid(
        address indexed user,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        bool fromMargin,
        uint256 delRisky,
        uint256 delStable
    );

    event Swapped(
        address indexed user,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOut,
        bool fromMargin
    );
}
