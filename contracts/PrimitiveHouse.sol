// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/primitive-v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Margin.sol";
import "@primitivefinance/primitive-v2-core/contracts/libraries/Position.sol";

import "./interfaces/ITestERC20.sol";
import "./interfaces/IPrimitiveHouse.sol";
import "./interfaces/IPrimitiveHouseFactory.sol";

contract PrimitiveHouse is IPrimitiveHouse {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using Position for mapping(bytes32 => Position.Data);
    using Position for Position.Data;

    address public immutable engine;
    address public immutable risky;
    address public immutable stable;

    IUniswapV3Factory public uniFactory;
    IUniswapV3Pool public uniPool;

    uint256 private reentrant;

    mapping(address => Margin.Data) private _margins;
    mapping(bytes32 => Position.Data) private _positions;

    constructor() {
        (, address _engine) = IPrimitiveHouseFactory(msg.sender).args();
        engine = _engine;
        risky = IPrimitiveEngineView(_engine).risky();
        stable = IPrimitiveEngineView(_engine).stable();
    }

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    modifier onlyEngine() {
        require(msg.sender == engine);
        _;
    }

    function create(
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice
    ) public virtual override lock {
        IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            time,
            riskyPrice,
            1e18,
            abi.encode(CreateCallbackData({payer: msg.sender}))
        );
    }

    function deposit(
        address owner,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        IPrimitiveEngineActions(engine).deposit(
            address(this),
            delRisky,
            delStable,
            abi.encode(DepositCallbackData({payer: msg.sender}))
        );

        // Update Margin state
        Margin.Data storage mar = _margins[owner];
        mar.deposit(delRisky, delStable);
    }

    function withdraw(uint256 delRisky, uint256 delStable) public virtual override lock {
        IPrimitiveEngineActions(engine).withdraw(delRisky, delStable);

        _margins.withdraw(delRisky, delStable);

        if (delRisky > 0) IERC20(risky).safeTransfer(msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransfer(msg.sender, delStable);
    }

    function allocate(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).allocate(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            abi.encode(AllocateCallbackData({payer: msg.sender}))
        );

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
        uint256 maxPremium
    ) public virtual override lock {
        IPrimitiveEngineActions(engine).borrow(
            poolId,
            delLiquidity,
            maxPremium,
            abi.encode(BorrowCallbackData({payer: msg.sender}))
        );

        _positions.borrow(poolId, delLiquidity);
    }

    function repay(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        bytes memory data = "0x";
        (uint256 delRisky, uint256 delStable, uint256 premium) = IPrimitiveEngineActions(engine).repay(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            abi.encode(RepayFromExternalCallbackData({payer: msg.sender}))
        );

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
    ) public virtual override lock {
        IPrimitiveEngineActions(engine).swap(poolId, addXRemoveY, deltaOut, deltaInMax, true, data);
    }

    function swapXForY(bytes32 poolId, uint256 deltaOut) public virtual override lock {
        IPrimitiveEngineActions(engine).swap(poolId, true, deltaOut, type(uint256).max, true, new bytes(0));
    }

    function swapYForX(bytes32 poolId, uint256 deltaOut) public virtual override lock {
        IPrimitiveEngineActions(engine).swap(poolId, false, deltaOut, type(uint256).max, true, new bytes(0));
    }

    // ===== Callback Implementations =====
    struct CreateCallbackData {
        address payer;
    }

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine {
        CreateCallbackData memory decoded = abi.decode(data, (CreateCallbackData));
        if (delRisky > 0) IERC20(risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct DepositCallbackData {
        address payer;
    }

    function depositCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine {
        DepositCallbackData memory decoded = abi.decode(data, (DepositCallbackData));
        if (delRisky > 0) IERC20(risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct AllocateCallbackData {
        address payer;
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine {
        AllocateCallbackData memory decoded = abi.decode(data, (AllocateCallbackData));
        if (delRisky > 0) IERC20(risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    struct RemoveCallbackData {
        address payer;
    }

    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine {
        RemoveCallbackData memory decoded = abi.decode(data, (RemoveCallbackData));
        if (delRisky > 0) IERC20(risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function swapCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {}

    struct BorrowCallbackData {
        address payer;
    }

    function borrowCallback(
        uint256 delLiquidity,
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine {
        BorrowCallbackData memory decoded = abi.decode(data, (BorrowCallbackData));
        uint256 riskyNeeded = delLiquidity - delRisky;
        IERC20(risky).safeTransferFrom(decoded.payer, msg.sender, riskyNeeded);
        IERC20(stable).safeTransfer(decoded.payer, delStable);
    }

    struct RepayFromExternalCallbackData {
        address payer;
    }

    function repayFromExternalCallback(uint256 delStable, bytes calldata data) external override onlyEngine {
        RepayFromExternalCallbackData memory decoded = abi.decode(data, (RepayFromExternalCallbackData));
        IERC20(stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }
}
