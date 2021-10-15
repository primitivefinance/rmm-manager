// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.9;

import "../libraries/EngineAddress.sol";

contract TestEngineAddress {
    function computeAddress(
        address factory,
        address risky,
        address stable
    ) external pure returns (address) {
        return EngineAddress.computeAddress(factory, risky, stable);
    }
}
