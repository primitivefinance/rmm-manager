// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveSwapCallback.sol";

interface ISwapManager is IPrimitiveSwapCallback {
    struct SwapParameters {
        address engine;
        address risky;
        address stable;
        bytes32 poolId;
        bool riskyForStable;
        uint256 deltaIn;
        uint256 deltaOutMin;
        bool fromMargin;
        bool toMargin;
        uint256 deadline;
    }


    /// @notice Thrown when the delta out is lower than the minimum
    /// @param expected The minimum delta out
    /// @param actual The actual delta out
    error DeltaOutMinError(uint256 expected, uint256 actual);

    error DeadlineReachedError();

    event Swap(
        address indexed recipient,
        address indexed engine,
        bytes32 indexed poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOut,
        bool fromMargin
    );

    function swap(SwapParameters memory params) external returns (uint256 deltaOut);
}
