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
        address risky,
        address stable,
        uint256 delLiquidity,
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice
    ) external;

    function deposit(
        address risky,
        address stable,
        address owner,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function withdraw(
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function allocate(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) external;

    function borrow(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        uint256 maxPremium
    ) external;

    function repay(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) external;

    // Swap
    function swap(
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) external;
}
