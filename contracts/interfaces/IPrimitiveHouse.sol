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
    // init
    function initialize(address engine_, address factory_, uint24 fee_) external;
    // Margin
    function create(uint strike, uint64 sigma, uint32 time, uint riskyPrice, bytes calldata data) external;
    function deposit(address owner, uint deltaX, uint deltaY, bytes calldata data) external;
    function withdraw(uint deltaX, uint deltaY) external;
    function borrow(bytes32 pid, address owner, uint deltaL, bytes calldata data) external;
    function allocateFromMargin(bytes32 pid, address owner, uint deltaL, bytes calldata data) external;
    function allocateFromExternal(bytes32 pid, address owner, uint deltaL, bytes calldata data) external;
    function repayFromExternal(bytes32 pid, address owner, uint deltaL, bytes calldata data) external;
    function repayFromMargin(bytes32 pid, address owner, uint deltaL, bytes calldata data) external;
    // Swap
    function swap(bytes32 pid, bool addXRemoveY, uint deltaOut, uint maxDeltaIn, bytes calldata data) external;
    function swapXForY(bytes32 pid, uint deltaOut) external;
    function swapYForX(bytes32 pid, uint deltaOut) external;
    // Lending
    function lend(bytes32 pid, uint deltaL) external;
    function margins(address owner) external view returns (Margin.Data memory);
}
