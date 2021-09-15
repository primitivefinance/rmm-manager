// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "./interfaces/IPrimitiveHouse.sol";

import "./base/HouseBase.sol";
import "./base/Multicall.sol";
import "./base/CashManager.sol";
import "./base/SelfPermit.sol";
import "./base/PositionWrapper.sol";
import "./base/MarginManager.sol";
import "./base/SwapManager.sol";

import "hardhat/console.sol";

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
    using SafeERC20 for IERC20;
    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;

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
    ) external override lock {
        address engine = factory.getEngine(risky, stable);

        CreateCallbackData memory callbackData = CreateCallbackData({payer: msg.sender, risky: risky, stable: stable});

        console.log("calling create");
        (bytes32 poolId, , ) = IPrimitiveEngineActions(engine).create(
            strike,
            sigma,
            maturity,
            delta,
            delLiquidity,
            abi.encode(callbackData)
        );

        console.log("calling allocate");

        // Mints {delLiquidity - 1000} of liquidity tokens
        _allocate(msg.sender, engine, poolId, delLiquidity - 1000);

        emit Create(msg.sender, engine, poolId, strike, sigma, maturity);
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
    ) external override lock {
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

        emit Allocate(msg.sender, engine, poolId, delLiquidity, delRisky, delStable, fromMargin);
    }

    function removeLiquidity(
        address risky,
        address stable,
        bytes32 poolId,
        uint256 delLiquidity
    ) external override lock {
        // TODO: Revert if delLiquidity == 0?

        address engine = factory.getEngine(risky, stable);

        (uint256 delRisky, uint256 delStable) = IPrimitiveEngineActions(engine).remove(poolId, delLiquidity);
        _remove(msg.sender, engine, poolId, delLiquidity);

        Margin.Data storage mar = margins[engine][msg.sender];
        mar.deposit(delRisky, delStable);

        emit Remove(msg.sender, engine, poolId, risky, stable, delRisky, delStable);
    }

    // ===== Callback Implementations =====

    function createCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        CreateCallbackData memory decoded = abi.decode(data, (CreateCallbackData));

        if (msg.sender != factory.getEngine(decoded.risky, decoded.stable)) revert NotEngineError();

        if (delRisky > 0) IERC20(decoded.risky).safeTransferFrom(decoded.payer, msg.sender, delRisky);
        if (delStable > 0) IERC20(decoded.stable).safeTransferFrom(decoded.payer, msg.sender, delStable);
    }

    function allocateCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        AllocateCallbackData memory decoded = abi.decode(data, (AllocateCallbackData));

        if (msg.sender != factory.getEngine(decoded.risky, decoded.stable)) revert NotEngineError();

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
