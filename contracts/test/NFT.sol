// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract NFT is ERC1155 {
    constructor() ERC1155("") {}

    function mint(
        address to,
        uint256 id,
        uint256 qty
    ) external {
        bytes memory empty;
        _mint(to, id, qty, empty);
    }
}
