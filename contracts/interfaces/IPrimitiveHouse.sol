// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;
pragma abicoder v2;

import "@primitivefinance/primitive-v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/callback/IPrimitiveLendingCallback.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/callback/IPrimitiveMarginCallback.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Margin.sol";

interface IPrimitiveHouse is
    IPrimitiveCreateCallback,
    IPrimitiveLendingCallback,
    IPrimitiveLiquidityCallback,
    IPrimitiveMarginCallback,
    IPrimitiveSwapCallback
{
    // Margin
    function create(
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice
    ) external;

    function deposit(
        address owner,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function withdraw(uint256 delRisky, uint256 delStable) external;

    function borrow(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        uint256 maxPremium
    ) external;

    function allocate(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        bool fromMargin
    ) external;

    function repay(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        bool fromMargin
    ) external;

    // Swap
    function swap(
        bytes32 poolId,
        bool addXRemoveY,
        uint256 deltaOut,
        uint256 maxDeltaIn,
        bytes memory data
    ) external;

    function swapXForY(bytes32 poolId, uint256 deltaOut) external;

    function swapYForX(bytes32 poolId, uint256 deltaOut) external;
}
