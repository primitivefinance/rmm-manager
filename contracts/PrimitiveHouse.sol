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

import "hardhat/console.sol";

contract PrimitiveHouse is IPrimitiveHouse {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using Position for mapping(bytes32 => Position.Data);
    using Position for Position.Data;

    address public constant NO_CALLER = address(21);

    address public engine;

    IERC20 public risky;
    IERC20 public stable;
    IUniswapV3Factory public uniFactory;
    IUniswapV3Pool public uniPool;

    address public CALLER = NO_CALLER;
    uint private reentrant;

    mapping(address => Margin.Data) public _margins;
    mapping(bytes32 => Position.Data) public _positions;

    constructor() {}

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    modifier useCallerContext() {
      require(CALLER == NO_CALLER, "CSF"); // Caller set failure
      CALLER = msg.sender;
      _;
      CALLER = NO_CALLER;
    }

    modifier executionLock() {
        require(reentrant == 1, "Not guarded");
        require(CALLER != NO_CALLER, "No caller set");
        require(address(engine) == msg.sender, "Engine not sender");
        _;
    }

    function initialize(address engine_) public override {
        require(engine == address(0), "Already initialized");
        engine = engine_;
        risky = IERC20(IPrimitiveEngineView(engine_).risky());
        stable = IERC20(IPrimitiveEngineView(engine_).stable());
    }

    function create(uint strike, uint64 sigma, uint32 time, uint riskyPrice, bytes calldata data) public override lock useCallerContext {
      IPrimitiveEngineActions(engine).create(strike, sigma, time, riskyPrice, 1e18, data);
    }

    /**
     * @notice Adds delRisky and delStable to internal balance of `msg.sender`.
     */
    function deposit(address owner, uint delRisky, uint delStable, bytes calldata data) public override lock useCallerContext {
        IPrimitiveEngineActions(engine).deposit(address(this), delRisky, delStable, data);

        // Update Margin state
        Margin.Data storage mar = _margins[owner];
        mar.deposit(delRisky, delStable);
    }

    /**
     * @notice Removes delRisky and delStable to internal balance of `msg.sender`.
     */
    function withdraw(uint delRisky, uint delStable) public override lock useCallerContext {
        IPrimitiveEngineActions(engine).withdraw(delRisky, delStable);

        _margins.withdraw(delRisky, delStable);

        if (delRisky > 0) risky.safeTransfer(CALLER, delRisky);
        if (delStable > 0) stable.safeTransfer(CALLER, delStable);
    }

    function allocate(
      bytes32 poolId,
      address owner,
      uint256 delLiquidity,
      bool fromMargin,
      bytes calldata data
    ) external override lock useCallerContext {
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
    ) public override lock useCallerContext {
      IPrimitiveEngineActions(engine).borrow(poolId, delLiquidity, maxPremium, data);
      
      _positions.borrow(poolId, delLiquidity);
    }

    function repay(
      bytes32 poolId,
      address owner,
      uint256 delLiquidity,
      bool fromMargin,
      bytes calldata data
    ) public override lock useCallerContext {
      (uint256 delRisky, uint256 delStable, uint256 premium) = fromMargin ? 
        IPrimitiveEngineActions(engine).repay(poolId, address(this), delLiquidity, true, data) :
        IPrimitiveEngineActions(engine).repay(poolId, address(this), delLiquidity, false, data);

      console.log('here');

      if (fromMargin) _margins.withdraw(0, delStable);

      Position.Data storage pos = _positions.fetch(owner, poolId);
      pos.repay(delLiquidity);

      Margin.Data storage mar = _margins[owner];
      mar.deposit(premium, 0);
    }

    
    function swap(bytes32 pid, bool addXRemoveY, uint256 deltaOut, uint256 deltaInMax, bytes calldata data) public override lock {
        CALLER = msg.sender;
        IPrimitiveEngineActions(engine).swap(pid, addXRemoveY, deltaOut, deltaInMax, true, data);
    }

    function swapXForY(bytes32 pid, uint deltaOut) public override lock {
        CALLER = msg.sender;
        IPrimitiveEngineActions(engine).swap(pid, true, deltaOut, type(uint256).max, true, new bytes(0));
    }

    function swapYForX(bytes32 pid, uint deltaOut) public override lock {
        CALLER = msg.sender;
        IPrimitiveEngineActions(engine).swap(pid, false, deltaOut, type(uint256).max, true, new bytes(0));
    }
    
    // ===== Callback Implementations =====
    function createCallback(uint delRisky, uint delStable, bytes calldata data) public override executionLock {
        if (delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if (delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function depositCallback(uint delRisky, uint delStable, bytes calldata data) public override executionLock {
        if (delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if (delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function allocateCallback(uint delRisky, uint delStable, bytes calldata data) public override executionLock {
        if(delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if(delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function removeCallback(uint delRisky, uint delStable, bytes calldata data) public override executionLock {
        if(delRisky > 0) risky.safeTransferFrom(CALLER, msg.sender, delRisky);
        if(delStable > 0) stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function swapCallback(uint delRisky, uint delStable, bytes calldata data) public override {
    }

    function borrowCallback(
      uint256 delLiquidity, 
      uint256 delRisky,
      uint256 delStable,
      bytes calldata data
    ) public override executionLock {
      console.log('here');
      uint256 riskyNeeded = delLiquidity - delRisky;
      risky.safeTransferFrom(CALLER, msg.sender, riskyNeeded);
      stable.safeTransfer(CALLER, delStable);
    }

    function repayFromExternalCallback(
      uint256 delStable, 
      bytes calldata data
    ) public override {
      stable.safeTransferFrom(CALLER, msg.sender, delStable);
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata date) external {

    }

    /// @notice Returns the internal balances of risky and riskless tokens for an owner
    function margins(address owner) public override view returns (Margin.Data memory mar) {
        mar = _margins[owner];
    }

    function getPosition(address owner, bytes32 pid) public view returns (Position.Data memory pos) {
        pos = _positions[keccak256(abi.encodePacked(address(this), owner, pid))];
    }
}
