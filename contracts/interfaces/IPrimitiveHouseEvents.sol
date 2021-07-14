// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

interface IPrimitiveHouseEvents {
    event Created(
        address indexed payer,
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice,
        uint256 delRisky,
        uint256 delStable
    );

    event Deposited(address indexed owner, uint256 delRisky, uint256 delStable);

    event Withdrawn(address indexed owner, uint256 delRisky, uint256 delStable);

    event Borrowed(bytes32 indexed poolId, address indexed owner, uint256 delLiquidity, uint256 maxPremium);

    event Allocated(
        bytes32 indexed poolId,
        address indexed owner,
        uint256 delLiquidity,
        bool fromMargin,
        uint256 delRisky,
        uint256 delStable
    );

    event Repaid(bytes32 indexed poolId, address indexed owner, uint256 delLiquidity, bool fromMargin);

    event Swapped(bytes32 indexed poolId, bool addXRemoveY, uint256 deltaOut, uint256 maxDeltaIn);
}
