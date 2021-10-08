// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @notice  Small library to compute address of engines
/// @author  Primitive
library EngineAddress {
    // bytes32 internal constant ENGINE_INIT_CODE_HASH = 0x4515c5367b203022cd8aec15c472f4b347a846943192694634b844b2c0aabaa9;
    bytes32 internal constant ENGINE_INIT_CODE_HASH =
        0x97d1f74b7617a59bbf7ef064a0b7245949d9f440dba45a53b0f6112e07e91d31;

    /// @notice         Computes the address of an engine
    /// @param factory  The address of the factory
    /// @param risky    The address of the risky token
    /// @param stable   The address of the stable token
    /// @return engine  The computed address of the engine
    function computeAddress(
        address factory,
        address risky,
        address stable
    ) internal pure returns (address engine) {
        engine = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(hex"ff", factory, keccak256(abi.encode(risky, stable)), ENGINE_INIT_CODE_HASH)
                    )
                )
            )
        );
    }
}
