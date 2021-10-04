// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

library PositionRenderer {
    function returnURI() public view returns (string memory) {
        return "";
    }

    function returnSVG() public view returns (string memory) {
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
