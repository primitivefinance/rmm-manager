// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "./interfaces/IPositionRenderer.sol";
import "./interfaces/IERC20WithOptions.sol";

contract PositionRenderer is IPositionRenderer {
    function uri(
        address engineAddress,
        uint256 tokenId
    ) external view override returns (string memory) {
        address risky = IPrimitiveEngineView(engineAddress).risky();
        string memory riskyName = IERC20WithOptions(risky).name();
        string memory riskySymbol = IERC20WithOptions(risky).symbol();

        address stable = IPrimitiveEngineView(engineAddress).stable();
        string memory stableName = IERC20WithOptions(stable).name();
        string memory stableSymbol = IERC20WithOptions(stable).symbol();

        return string(abi.encodePacked(
            'data:application/json;utf8,{"name":"',
            "Put a name here",
            '","image":"data:image/svg+xml;utf8,',
            renderSVG(tokenId),
            '",',
            '"license":"Put license here","creator":"@PrimitiveFi",',
            '"description":"Put a description here"',
            '}'
        ));
    }

    function renderSVG(uint256 tokenId) public view returns (string memory) {
        return "";
    }

    function returnText(
        string memory text,
        string memory x,
        string memory y,
        string memory fontFamily,
        string memory fontSize,
        string memory fill,
        string memory fontWeight
    ) private view returns (string memory) {
        return string(
            abi.encodePacked(
                '<text x="',
                x,
                '" y="',
                y,
                '" font-family="',
                fontFamily,
                '" font-size="',
                fontSize,
                '" fill="',
                fill,
                bytes(fontWeight).length > 0 ?
                    '" font-weight="500">'
                    : '">',
                text,
                '</text>'
            )
        );
    }
}
