// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "../interfaces/external/IERC20PermitAllowed.sol";

contract TestToken is
    ERC20("TestToken", "TEST"),
    ERC20Permit("TestToken"),
    IERC20PermitAllowed
{
    function mint(address to, uint256 wad) public {
        _mint(to, wad);
    }

    function burn(address to, uint256 wad) public {
        _burn(to, wad);
    }

    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(this.nonces(holder) == nonce, "TestERC20PermitAllowed::permit: wrong nonce");
        permit(holder, spender, allowed ? type(uint256).max : 0, expiry, v, r, s);
    }
}
