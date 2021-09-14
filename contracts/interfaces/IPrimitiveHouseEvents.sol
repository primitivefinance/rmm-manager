// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

interface IPrimitiveHouseEvents {
    event Create(
        address indexed recipient,
        address indexed engine,
        bytes32 poolId,
        uint256 strike,
        uint64 sigma,
        uint32 maturity
    );

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

    event Allocate(
        address indexed payer,
        address indexed engine,
        bytes32 indexed poolId,
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bool fromMargin
    );

    event Remove(
        address indexed payer,
        address engine,
        bytes32 poolId,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    );

    event Swap(
        address indexed recipient,
        address indexed engine,
        bytes32 indexed poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOut,
        bool fromMargin
    );
}
