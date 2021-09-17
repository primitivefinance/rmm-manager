// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineActions.sol";
import "@primitivefinance/v2-core/contracts/libraries/Margin.sol";

import "../interfaces/IMarginManager.sol";
import "./HouseBase.sol";

import "../libraries/TransferHelper.sol";

abstract contract MarginManager is IMarginManager, HouseBase {
    using TransferHelper for IERC20;

    using Margin for mapping(address => Margin.Data);
    using Margin for Margin.Data;

    mapping(address => mapping(address => Margin.Data)) public override margins;

    struct DepositCallbackData {
        address payer;
        address risky;
        address stable;
        uint256 delRisky;
        uint256 delStable;
    }

    /// @inheritdoc IMarginManager
    function deposit(
        address recipient,
        address engine,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external override lock {
        if (delRisky == 0 && delStable == 0) revert ZeroDelError();

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

        emit Deposit(msg.sender, recipient, engine, risky, stable, delRisky, delStable);
    }

    /// @inheritdoc IMarginManager
    function withdraw(
        address recipient,
        address engine,
        uint256 delRisky,
        uint256 delStable
    ) external override lock {
        if (delRisky == 0 && delStable == 0) revert ZeroDelError();

        // Reverts the call early if margins are insufficient
        margins[engine].withdraw(delRisky, delStable);

        IPrimitiveEngineActions(engine).withdraw(recipient, delRisky, delStable);

        emit Withdraw(msg.sender, recipient, engine, delRisky, delStable);
    }

    function depositCallback(
        uint256 delRisky,
        uint256 delStable,
        bytes calldata data
    ) external override {
        DepositCallbackData memory decoded = abi.decode(data, (DepositCallbackData));

        address engine = EngineAddress.computeAddress(factory, decoded.risky, decoded.stable);
        if (msg.sender != engine) revert NotEngineError();

        if (delStable > 0) TransferHelper.safeTransferFrom(decoded.stable, decoded.payer, msg.sender, delStable);
        if (delRisky > 0) TransferHelper.safeTransferFrom(decoded.risky, decoded.payer, msg.sender, delRisky);
    }
}
