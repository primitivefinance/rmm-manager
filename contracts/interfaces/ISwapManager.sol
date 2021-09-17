// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";

interface ISwapManager is IPrimitiveSwapCallback {
    function swap(
        address engine,
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin,
        bool toMargin
    ) external;
}
