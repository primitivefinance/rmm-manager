// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   Primitive House
/// @author  Primitive
/// @dev     Interacts with Primitive Engine contracts

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "@primitivefinance/v2-core/contracts/libraries/Margin.sol";

import "./interfaces/IPrimitiveHouse.sol";

import "./base/Multicall.sol";
import "./base/CashManager.sol";
import "./base/SelfPermit.sol";
import "./base/PositionWrapper.sol";

import "hardhat/console.sol";

contract PrimitiveHouse is IPrimitiveHouse, Multicall, CashManager, SelfPermit, PositionWrapper {
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;

    /// STORAGE PROPERTIES ///

    /// @inheritdoc IPrimitiveHouse
    IPrimitiveFactory public override factory;

    /// @inheritdoc IPrimitiveHouse
    mapping(address => mapping(address => Margin.Data)) public override margins;

    uint256 private reentrant;

    /// MODIFIERS ///

    modifier lock() {
        require(reentrant != 1, "locked");
        reentrant = 1;
        _;
        reentrant = 0;
    }

    address private _engine;

    modifier onlyEngine() {
        if (msg.sender != _engine) revert NotEngineError();
        _;
    }

    /// EFFECT FUNCTIONS ///

    constructor(
        address _factory,
        address _WETH10,
        string memory _URI
    ) PositionWrapper(_URI) CashManager(_WETH10) {
        factory = IPrimitiveFactory(_factory);
    }

    struct CreateCallbackData {
        address payer;
        address risky;
        address stable;
    }

    /// @inheritdoc IPrimitiveHouse
    function create(
        address risky,
        address stable,
        uint256 strike,
        uint64 sigma,
        uint32 maturity,
        uint256 delta,
        uint256 delLiquidity
    ) public virtual override lock {
        _engine = factory.getEngine(risky, stable);

        CreateCallbackData memory callbackData = CreateCallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable
        });

        (bytes32 poolId, , ) = IPrimitiveEngineActions(_engine).create(
            strike,
            sigma,
            maturity,
            delta,
            delLiquidity,
            abi.encode(callbackData)
        );

        // Mints {delLiquidity - 1000} of liquidity tokens
        _allocate(msg.sender, _engine, poolId, delLiquidity - 1000);

        emit Created(msg.sender, _engine, poolId, strike, sigma, maturity);

        _engine = address(0);
    }

    struct DepositCallbackData {
        address payer;
        address risky;
        address stable;
        uint256 delRisky;
        uint256 delStable;
    }

    /// @inheritdoc IPrimitiveHouse
    function deposit(
        address recipient,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        // TODO: Revert if delRisky || delStable == 0?
        _engine = factory.getEngine(risky, stable);

        IPrimitiveEngineActions(_engine).deposit(
            address(this),
            delRisky,
            delStable,
            abi.encode(
                DepositCallbackData({
                    payer: msg.sender,
                    risky: risky,
                    stable: stable,
                    delRisky: delRisky,
                    delStable: delStable
                })
            )
        );

        Margin.Data storage mar = margins[_engine][recipient];
        mar.deposit(delRisky, delStable);

        emit Deposited(msg.sender, recipient, _engine, risky, stable, delRisky, delStable);

        _engine = address(0);
    }

    /// @inheritdoc IPrimitiveHouse
    function withdraw(
        address recipient,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) public virtual override lock {
        if (delRisky == 0 || delStable == 0) {
            // TODO: Revert the call or not?
        }

        address engine = factory.getEngine(risky, stable);

        // Reverts the call early if margins are insufficient
        margins[engine].withdraw(delRisky, delStable);

        IPrimitiveEngineActions(engine).withdraw(recipient, delRisky, delStable);

        emit Withdrawn(msg.sender, recipient, engine, delRisky, delStable);
    }

    struct AllocateCallbackData {
        address payer;
        address risky;
        address stable;
        uint256 delLiquidity;
        bool fromMargin;
    }

    function addLiquidity(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity,
        bool fromMargin
    ) public virtual override lock {
        // TODO: Revert if delLiquidity == 0?

        _engine = factory.getEngine(risky, stable);

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(_engine).allocate(
            poolId,
            address(this),
            delLiquidity,
            fromMargin,
            abi.encode(
                AllocateCallbackData({
                    payer: msg.sender,
                    risky: risky,
                    stable: stable,
                    delLiquidity: delLiquidity,
                    fromMargin: fromMargin
                })
            )
        );

        if (fromMargin) margins[_engine].withdraw(delRisky, delStable);

        // Mints {delLiquidity} of liquidity tokens
        _allocate(msg.sender, _engine, poolId, delLiquidity);

        IPrimitiveEngineActions(_engine).supply(poolId, delLiquidity);

        // TODO: Supply only 80% of the liquidity?
        _supply(msg.sender, _engine, poolId, delLiquidity);

        emit LiquidityAdded(msg.sender, _engine, poolId, delLiquidity, delRisky, delStable, fromMargin);

        _engine = address(0);
    }

    function removeLiquidity(
        address recipient,
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) public virtual override lock {
        // TODO: Revert if delLiquidity == 0?

        address engine = factory.getEngine(risky, stable);

        // TODO: Add a check to prevent from removing too much liquidity?
        _claim(msg.sender, engine, poolId, delLiquidity);
        IPrimitiveEngineActions(engine).claim(poolId, delLiquidity);

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).remove(poolId, delLiquidity);
        _remove(msg.sender, engine, poolId, delLiquidity);

        Margin.Data storage mar = margins[engine][recipient];
        mar.deposit(delRisky, delStable);

        emit LiquidityRemoved(msg.sender, recipient, engine, poolId, risky, stable, delRisky, delStable);
    }

    struct BorrowCallbackData {
        address payer;
        address risky;
        address stable;
        uint256 maxRiskyPremium;
        uint256 maxStablePremium;
    }

    function borrow(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 riskyCollateral,
        uint256 stableCollateral,
        uint256 maxRiskyPremium,
        uint256 maxStablePremium,
        bool fromMargin
    ) public virtual override lock {
        // TODO: Revert if riskyCollateral == 0 || stableCollateral == 0?

        _engine = factory.getEngine(risky, stable);

        BorrowCallbackData memory callbackData = BorrowCallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable,
            maxRiskyPremium: maxRiskyPremium,
            maxStablePremium: maxStablePremium
        });

        (
            uint256 riskyDeficit,
            uint256 riskySurplus,
            uint256 stableDeficit,
            uint256 stableSurplus
        ) = IPrimitiveEngineActions(_engine).borrow(
            poolId,
            riskyCollateral,
            stableCollateral,
            fromMargin,
            abi.encode(callbackData)
        );

        if (fromMargin) {
            margins[_engine].withdraw(riskyDeficit, stableDeficit);
            margins[_engine][msg.sender].deposit(riskySurplus, stableSurplus);
        } else {
            if (riskySurplus > 0) sweep(risky);
            if (stableSurplus > 0) sweep(stable);
        }

        _borrow(msg.sender, _engine, poolId, riskyCollateral, stableCollateral);

        emit Borrowed(msg.sender, _engine, poolId, riskyCollateral, stableCollateral);

        _engine = address(0);
    }

    function sweep(address token) private {
        IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

    struct RepayCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function repay(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 riskyCollateral,
        uint256 stableCollateral,
        bool fromMargin
    ) public virtual override lock {
        // TODO: Revert if riskyCollateral == 0 || stableCollateral == 0?

        _engine = factory.getEngine(risky, stable);

        RepayCallbackData memory callbackData = RepayCallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable
        });

        (
            uint256 riskyDeficit,
            uint256 riskySurplus,
            uint256 stableDeficit,
            uint256 stableSurplus
        ) = IPrimitiveEngineActions(_engine).repay(
            poolId,
            address(this),
            riskyCollateral,
            stableCollateral,
            fromMargin,
            abi.encode(callbackData)
        );

        _repay(msg.sender, _engine, poolId, riskyCollateral, stableCollateral);

        if (fromMargin) {
            margins[_engine].withdraw(riskyDeficit, stableDeficit);
            margins[msg.sender][_engine].deposit(riskySurplus, stableSurplus);
        } else {
            if (riskySurplus > 0) IERC20(risky).safeTransfer(msg.sender, riskySurplus);
            if (stableSurplus > 0) IERC20(stable).safeTransfer(msg.sender, stableSurplus);
        }

        emit Repaid(msg.sender, _engine, poolId, riskyCollateral, stableCollateral);

        _engine = address(0);
    }

    struct SwapCallbackData {
        address payer;
        address risky;
        address stable;
    }

    function swap(
        address risky,
        address stable,
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) public virtual override lock {
        _engine = factory.getEngine(risky, stable);

        SwapCallbackData memory callbackData = SwapCallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable
        });

        uint256 deltaOut = IPrimitiveEngineActions(_engine).swap(
            poolId,
            riskyForStable,
            deltaIn,
            fromMargin,
            abi.encode(callbackData)
        );

        // Reverts if the delta out is lower than the minimum
        if (deltaOutMin > deltaOut) revert DeltaOutMinError(deltaOutMin, deltaOut);

        if (fromMargin) {
            margins[_engine].withdraw(riskyForStable ? deltaIn : 0, riskyForStable ? 0 : deltaIn);
        }

        IERC20(riskyForStable ? risky : stable).safeTransfer(msg.sender, deltaOut);

        emit Swapped(msg.sender, _engine, poolId, riskyForStable, deltaIn, deltaOut, fromMargin);

        _engine = address(0);
    }

    // ===== Callback Implementations =====

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine() {
        CreateCallbackData memory decoded = abi.decode(data, (CreateCallbackData));

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function depositCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine() {
        DepositCallbackData memory decoded = abi.decode(data, (DepositCallbackData));

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine() {
        AllocateCallbackData memory decoded = abi.decode(data, (AllocateCallbackData));

        if (decoded.fromMargin == false) {
            if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
            if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
        }
    }

    function borrowCallback(
        uint256 riskyDeficit,
        uint256 stableDeficit,
        bytes calldata data
    ) external override onlyEngine() {
        BorrowCallbackData memory decoded = abi.decode(data, (BorrowCallbackData));

        if (riskyDeficit > decoded.maxRiskyPremium) revert AbovePremiumError(decoded.maxRiskyPremium, riskyDeficit);
        if (stableDeficit > decoded.maxStablePremium) revert AbovePremiumError(decoded.maxStablePremium, stableDeficit);

        if (riskyDeficit > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, riskyDeficit);
        if (stableDeficit > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, stableDeficit);
    }

    function repayCallback(
        uint256 riskyDeficit,
        uint256 stableDeficit,
        bytes calldata data
    ) external override onlyEngine() {
        RepayCallbackData memory decoded = abi.decode(data, (RepayCallbackData));

        if (riskyDeficit > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, riskyDeficit);
        if (stableDeficit > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, stableDeficit);
    }

    function swapCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override onlyEngine() {
        SwapCallbackData memory decoded = abi.decode(data, (SwapCallbackData));

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        // TODO: Delete this callback
    }
}
