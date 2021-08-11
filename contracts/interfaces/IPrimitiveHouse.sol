// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveBorrowCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveCreateCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveLiquidityCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveRepayCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";
import "@primitivefinance/v2-core/contracts/interfaces/IPrimitiveFactory.sol";

interface IPrimitiveHouse is
    IPrimitiveBorrowCallback,
    IPrimitiveCreateCallback,
    IPrimitiveDepositCallback,
    IPrimitiveLiquidityCallback,
    IPrimitiveRepayCallback,
    IPrimitiveSwapCallback
{
    /// VIEW FUNCTIONS ///

    /// @notice Returns the factory contract
    function factory() external view returns (IPrimitiveFactory);

    /// EFFECT FUNCTIONS ///

    function create(
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity
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

    function remove(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) external;

    function borrow(
        address owner,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin,
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
