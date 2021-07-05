// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

import "../../interfaces/IERC20.sol";

import "hardhat/console.sol";

import "../../interfaces/IPrimitiveHouse.sol";

contract HouseInitialize {
    address public house;

    constructor() {}

    function initialize(
        address _house
    ) public {
        house = _house;
    }

    function init(
      address engine
    ) public {
        IPrimitiveHouse(house).initialize(engine);
    }

    function name() public pure returns (string memory) {
        return "HouseInitialize";
    }
}

