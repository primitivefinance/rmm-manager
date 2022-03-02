// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../libraries/EngineAddress.sol";

contract TestHash {
    function getEngineCodeHash() external pure returns (bytes32) {
        return EngineAddress.ENGINE_INIT_CODE_HASH;
    }
}
