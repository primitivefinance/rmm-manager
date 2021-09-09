// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.6;

interface INFTGatekeeper {
    error ZeroBalance();

    function token() external view returns (address);

    function id() external view returns (uint256);
}
