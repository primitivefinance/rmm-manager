// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;


interface IHouseBase {
    error NotEngineError();

    function factory() external returns (address);
    function WETH10() external returns (address);
}
