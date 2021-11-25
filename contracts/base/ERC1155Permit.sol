// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   ERC1155Permit contract
/// @author  Primitive
/// @notice  ERC1155 contract with permit extension allowing approvals to be made via signatures

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./ERC1155.sol";
import "../interfaces/IERC1155Permit.sol";

contract ERC1155Permit is ERC1155, IERC1155Permit, EIP712 {
    /// @inheritdoc IERC1155Permit
    mapping(address => uint256) public override nonces;

    bytes32 private immutable _PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 id,uint256 amount,bytes memory data,uint256 deadline,uint8 v,bytes32 r,bytes32 s");

    /// @param name Name of the contract
    constructor(string memory name) ERC1155("") EIP712(name, "1") { }

    /// @inheritdoc IERC1155Permit
    function permit(
        address owner,
        address operator,
        bool approved,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        if (block.timestamp > deadline) revert SigExpiredError();

        bytes32 structHash = keccak256(abi.encode(
            _PERMIT_TYPEHASH,
            owner,
            operator,
            approved,
            nonces[owner],
            deadline
        ));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);

        if (signer != owner) revert InvalidSigError();

        _setApprovalForAll(owner, operator, approved);
    }

    /// @inheritdoc IERC1155Permit
    function DOMAIN_SEPARATOR() external view override returns (bytes32) {
        return _domainSeparatorV4();
    }
}
