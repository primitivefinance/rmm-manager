// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "@primitivefinance/v2-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";

import "./interfaces/IPositionRenderer.sol";
import "./interfaces/IERC20WithOptions.sol";

library HexStrings {
    bytes16 internal constant ALPHABET = '0123456789abcdef';

    /// @notice Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
    /// @dev Credit to Open Zeppelin under MIT license https://github.com/OpenZeppelin/openzeppelin-contracts/blob/243adff49ce1700e0ecb99fe522fb16cff1d1ddc/contracts/utils/Strings.sol#L55
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = '0';
        buffer[1] = 'x';
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = ALPHABET[value & 0xf];
            value >>= 4;
        }
        require(value == 0, 'Strings: hex length insufficient');
        return string(buffer);
    }

    function toHexStringNoPrefix(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length);
        for (uint256 i = buffer.length; i > 0; i--) {
            buffer[i - 1] = ALPHABET[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }
}

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

    function returnGradient(
        address risky,
        address stable
    ) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:',
                returnColor(risky),
                ';stop-opacity:1" /><stop offset="100%" style="stop-color:',
                returnColor(stable),
                ';stop-opacity:1" /></linearGradient></defs>'
            )
        );
    }
    function returnColor(address token) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "#",
                HexStrings.toHexStringNoPrefix(uint160(token), 3)
            )
        );
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
