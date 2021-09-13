// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "./interfaces/IPrimitiveHouse.sol";

import "./base/HouseBase.sol";
import "./base/Multicall.sol";
import "./base/CashManager.sol";
import "./base/SelfPermit.sol";
import "./base/PositionWrapper.sol";
import "./base/MarginManager.sol";
import "./base/SwapManager.sol";

/// @title Primitive House
/// @author Primitive
/// @dev Interacts with Primitive Engine contracts
contract PrimitiveHouse is
    IPrimitiveHouse,
    HouseBase,
    Multicall,
    CashManager,
    SelfPermit,
    PositionWrapper,
    MarginManager,
    SwapManager
{
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;
    using SafeERC20 for IERC20;using SafeERC20 for IERC20;

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
        address engine = factory.getEngine(risky, stable);

        CreateCallbackData memory callbackData = CreateCallbackData({
            payer: msg.sender,
            risky: risky,
            stable: stable
        });

        (bytes32 poolId, , ) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            delta,
            delLiquidity,
            abi.encode(callbackData)
        );

        // Mints {delLiquidity - 1000} of liquidity tokens
        _allocate(msg.sender, engine, poolId, delLiquidity - 1000);

        emit Created(msg.sender, engine, poolId, strike, sigma, maturity);
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
        address engine = factory.getEngine(risky, stable);

        IPrimitiveEngineActions(engine).deposit(
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

        Margin.Data storage mar = margins[engine][recipient];
        mar.deposit(delRisky, delStable);

        emit Deposited(msg.sender, recipient, engine, risky, stable, delRisky, delStable);
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

        address engine = factory.getEngine(risky, stable);

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).allocate(
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

        if (fromMargin) margins[engine].withdraw(delRisky, delStable);

        // Mints {delLiquidity} of liquidity tokens
        _allocate(msg.sender, engine, poolId, delLiquidity);

        emit LiquidityAdded(msg.sender, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    function removeLiquidity(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) public virtual override lock {
        // TODO: Revert if delLiquidity == 0?

        address engine = factory.getEngine(risky, stable);

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).remove(poolId, delLiquidity);
        _remove(msg.sender, engine, poolId, delLiquidity);

        Margin.Data storage mar = margins[engine][msg.sender];
        mar.deposit(delRisky, delStable);

        emit LiquidityRemoved(msg.sender, engine, poolId, risky, stable, delRisky, delStable);
    }

    // ===== Callback Implementations =====

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        CreateCallbackData memory decoded = abi.decode(data, (CreateCallbackData));

        if (msg.sender != factory.getEngine(decoded.risky, decoded.stable)) revert NotEngine();

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function depositCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        DepositCallbackData memory decoded = abi.decode(data, (DepositCallbackData));

        if (msg.sender != factory.getEngine(decoded.risky, decoded.stable)) revert NotEngine();

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        AllocateCallbackData memory decoded = abi.decode(data, (AllocateCallbackData));

        if (msg.sender != factory.getEngine(decoded.risky, decoded.stable)) revert NotEngine();

        if (decoded.fromMargin == false) {
            if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
            if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
        }
    }

    function removeCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        // TODO: Delete this callback
    }
}
