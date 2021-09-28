// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @notice Small library to compute address of engines
/// @author Primitive
library EngineAddress {
    // bytes32 internal constant ENGINE_INIT_CODE_HASH = 0x7909528d5b1a7b26bdda2cd0df5561bb4809b2b6e7174bfbf6088c07dfac06f7;
    bytes32 internal constant ENGINE_INIT_CODE_HASH = 0x1e29399d3968f92524a701c583d9e8face50641b3704050d67d9ea17c819b635;

    /// @notice Computes the address of an engine
    /// @param factory The address of the factory
    /// @param risky The address of the risky token
    /// @param stable The address of the stable token
    /// @return engine The computed address of the engine
    function computeAddress(
        address factory,
        address risky,
        address stable
    ) internal pure returns (address engine) {
        engine = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex'ff',
                            factory,
                            keccak256(abi.encode(risky, stable)),
                            ENGINE_INIT_CODE_HASH
                        )
                    )
                )
            )
        );
    }
}
