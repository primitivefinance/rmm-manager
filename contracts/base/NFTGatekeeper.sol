// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/INFTGatekeeper.sol";

/// @title   NFTGatekeeper
/// @author  Primitive
/// @notice  Limits access to holders of a specific NFT
contract NFTGatekeeper is INFTGatekeeper {
    /// @inheritdoc INFTGatekeeper
    uint256 public immutable override id;

    /// @inheritdoc INFTGatekeeper
    address public immutable override token;

    /// @notice Restrict the calls to the holders of token {id}
    modifier onlyHolder() {
        if (IERC1155(token).balanceOf(msg.sender, id) == 0) {
            revert ZeroBalance();
        }

        _;
    }

    /// @param token_  Address of the token contract
    /// @param id_     Id of the token to look for
    constructor(address token_, uint256 id_) {
        token = token_;
        id = id_;
    }
}
