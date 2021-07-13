// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;
pragma abicoder v2;

interface IPrimitiveHouseView {
    function engine() external view returns (address);

    function risky() external view returns (address);

    function stable() external view returns (address);
}
