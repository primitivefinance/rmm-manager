// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/callback/IPrimitiveDepositCallback.sol";

interface IMarginManager is IPrimitiveDepositCallback {
    function deposit(
        address recipient,
        address engine,
        address risky,
        address stable,
        uint256 delRisky,
        uint256 delStable
    ) external;

    function withdraw(
        address recipient,
        address engine,
        uint256 delRisky,
        uint256 delStable
    ) external;
}
