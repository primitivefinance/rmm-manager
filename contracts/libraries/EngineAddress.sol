// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

library EngineAddress {
    bytes32 internal constant ENGINE_INIT_CODE_HASH = 0x8225a637619e373ee53c6e0a24f8681cdca3558c44010a60631b320229711097;

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
