// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

import "./interfaces/IPrimitiveHouse.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Margin.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Position.sol";

contract PrimitiveHouse is IPrimitiveHouse {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using Position for mapping(bytes32 => Position.Data);
    using Position for Position.Data;

    address external constant NO_CALLER = address(21);

    address external engine;

    IERC20 external risky;
    IERC20 external stable;
    IUniswapV3Factory external uniFactory;
    IUniswapV3Pool external uniPool;

    address external CALLER = NO_CALLER;
    uint private reentrant;

    mapping(address => Margin.Data) external _margins;
    mapping(bytes32 => Position.Data) external _positions;

    constructor() {}

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    function initialize(
      address engine_
    ) external override {
        require(engine == address(0), "Already initialized");
        engine = engine_;
        risky = IERC20(IPrimitiveEngineView(engine_).risky());
        stable = IERC20(IPrimitiveEngineView(engine_).stable());
    }

    function create(
      uint256 strike, 
      uint64 sigma, 
      uint32 time, 
      uint riskyPrice, 
      bytes calldata data
    ) external override lock  {
      IPrimitiveEngineActions(engine).create(strike, sigma, time, riskyPrice, 1e18, data);
    }

    function deposit(
      address owner, 
      uint256 delRisky, 
      uint256 delStable, 
      bytes calldata data
    ) external override lock  {
        IPrimitiveEngineActions(engine).deposit(address(this), delRisky, delStable, data);

        // Update Margin state
        Margin.Data storage mar = _margins[owner];
        mar.deposit(delRisky, delStable);
    }

    function withdraw(
      uint256 delRisky, 
      uint256 delStable
    ) external override lock  {
        IPrimitiveEngineActions(engine).withdraw(delRisky, delStable);

        _margins.withdraw(delRisky, delStable);

        if (delRisky > 0) risky.safeTransfer(msg.sender, delRisky);
        if (delStable > 0) stable.safeTransfer(msg.sender, delStable);
    }

    function allocate(
      bytes32 poolId,
      address owner,
      uint256 delLiquidity,
      bool fromMargin,
      bytes calldata data
    ) external override lock  {
      (uint256 delRisky, uint256 delStable) = fromMargin ? 
        IPrimitiveEngineActions(engine).allocate(poolId, address(this), delLiquidity, true, data) :
        IPrimitiveEngineActions(engine).allocate(poolId, address(this), delLiquidity, false, data);

      if (fromMargin) _margins.withdraw(delRisky, delStable);
      
      Position.Data storage pos = _positions.fetch(owner, poolId);
      pos.allocate(delLiquidity);

      IPrimitiveEngineActions(engine).lend(poolId, delLiquidity);

      _positions.lend(poolId, delLiquidity);
    }

    function borrow(
      bytes32 poolId, 
      address owner, 
      uint256 delLiquidity, 
      uint256 maxPremium, 
      bytes calldata data
    ) external override lock  {
      IPrimitiveEngineActions(engine).borrow(poolId, delLiquidity, maxPremium, data);
      
      _positions.borrow(poolId, delLiquidity);
    }

    function repay(
      bytes32 poolId,
      address owner,
      uint256 delLiquidity,
      bool fromMargin,
      bytes calldata data
    ) external override lock  {
      (uint256 delRisky, uint256 delStable, uint256 premium) = fromMargin ? 
        IPrimitiveEngineActions(engine).repay(poolId, address(this), delLiquidity, true, data) :
        IPrimitiveEngineActions(engine).repay(poolId, address(this), delLiquidity, false, data);

      if (fromMargin) _margins.withdraw(0, delStable);

      Position.Data storage pos = _positions.fetch(owner, poolId);
      pos.repay(delLiquidity);

      Margin.Data storage mar = _margins[owner];
      mar.deposit(premium, 0);
    }
    
    function swap(
      bytes32 poolId, 
      bool addXRemoveY, 
      uint256 deltaOut, 
      uint256 deltaInMax, 
      bytes calldata data
    ) external override lock {
        IPrimitiveEngineActions(engine).swap(poolId, addXRemoveY, deltaOut, deltaInMax, true, data);
    }

    function swapXForY(
      bytes32 poolId, 
      uint256 deltaOut
    ) external override lock {
        IPrimitiveEngineActions(engine).swap(poolId, true, deltaOut, type(uint256).max, true, new bytes(0));
    }

    function swapYForX(
      bytes32 poolId, 
      uint256 deltaOut) external override lock {
        IPrimitiveEngineActions(engine).swap(poolId, false, deltaOut, type(uint256).max, true, new bytes(0));
    }
    
    // ===== Callback Implementations =====
    function createCallback(
      uint256 delRisky, 
      uint256 delStable, 
      bytes calldata data
    ) external override executionLock {
        if (delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if (delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function depositCallback(
      uint256 delRisky, 
      uint256 delStable, 
      bytes calldata data
    ) external override executionLock {
        if (delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if (delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function allocateCallback(
      uint256 delRisky, 
      uint256 delStable, 
      bytes calldata data
    ) external override executionLock {
        if (delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if (delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function removeCallback(
      uint256 delRisky, 
      uint256 delStable, 
      bytes calldata data
    ) external override executionLock {
        if (delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if (delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function swapCallback(uint delRisky, uint delStable, bytes calldata data) external override {
    }

    function borrowCallback(
      uint256 delLiquidity, 
      uint256 delRisky,
      uint256 delStable,
      bytes calldata data
    ) external override executionLock {
      uint256 riskyNeeded = delLiquidity - delRisky;
      risky.safeTransferFrom(CALLER, msg.sender, riskyNeeded);
      stable.safeTransfer(CALLER, delStable);
    }

    function repayFromExternalCallback(
      uint256 delStable, 
      bytes calldata data
    ) external override {
      stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }
}
