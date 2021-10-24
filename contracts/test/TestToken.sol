// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract TestToken is
    ERC20("TestToken", "TEST"),
    ERC20Permit("TestToken")
{
    function mint(address to, uint256 wad) public {
        _mint(to, wad);
    }

    function burn(address to, uint256 wad) public {
        _burn(to, wad);
    }
}
