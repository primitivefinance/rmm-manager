// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

interface IPrimitiveHouseEvents {
    event Created(
        address indexed owner,
        address indexed engine,
        bytes32 poolId,
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice,
        uint256 delRisky,
        uint256 delStable
    );

    event Deposited(
        address indexed owner,
        address indexed engine,
        uint256 delRisky,
        uint256 delStable
    );

    event Withdrawn(
        address indexed owner,
        address indexed engine,
        uint256 delRisky,
        uint256 delStable
    );

    event AllocatedAndLent(
        address indexed owner,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    );

    event Borrowed(
        address indexed owner,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 maxPremium,
        uint256 premium
    );

    event Repaid(
        address indexed owner,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    );

    event Swapped(
        address indexed owner,
        address indexed engine,
        bytes32 indexed poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOut,
        bool fromMargin
    );
}
