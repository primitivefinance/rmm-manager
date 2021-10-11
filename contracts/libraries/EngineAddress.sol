// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @author  Primitive
/// @notice  Small library to compute the address of the engines

library EngineAddress {
    /// @notice Hash of the bytecode of the PrimitiveEngine (current hash is MockEngine)
    // bytes32 internal constant ENGINE_INIT_CODE_HASH = 0x4515c5367b203022cd8aec15c472f4b347a846943192694634b844b2c0aabaa9;
    bytes32 internal constant ENGINE_INIT_CODE_HASH =
        0x97d1f74b7617a59bbf7ef064a0b7245949d9f440dba45a53b0f6112e07e91d31;

    /// @notice         Computes the address of an engine
    /// @param factory  Address of the factory
    /// @param risky    Address of the risky token
    /// @param stable   Address of the stable token
    /// @return engine  Computed address of the engine
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
