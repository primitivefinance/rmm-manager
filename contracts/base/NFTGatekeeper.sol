// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/INFTGatekeeper.sol";

contract NFTGatekeeper is INFTGatekeeper {
    uint256 public immutable override id;
    address public immutable override token;

    modifier onlyHolder() {
        if (IERC1155(token).balanceOf(msg.sender, id) == 0) {
            revert ZeroBalance();
        }

        _;
    }

    constructor(address _token, uint256 _id) {
        token = _token;
        id = _id;
    }
}
