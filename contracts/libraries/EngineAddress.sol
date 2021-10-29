// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.6;

/// @author  Primitive
/// @notice  Small library to compute the address of the engines

library EngineAddress {
    /// @notice Hash of the bytecode of the PrimitiveEngine
    bytes32 internal constant ENGINE_INIT_CODE_HASH =
        0x0d62364ad54864dd6772b62036f8de0177709709fa3d2e7319eeb5c96560060d;

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
