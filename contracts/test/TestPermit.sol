// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "../interfaces/IERC1155Permit.sol";

contract TestPermit {
    function testPermit(
        address manager,
        address owner,
        address operator,
        bool approved,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        IERC1155Permit(manager).permit(owner, operator, approved, deadline, v, r, s);
    }
}
