// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   PositionRenderer contract
/// @author  Primitive
/// @notice  Renders the visual of the position tokens

import "@primitivefinance/rmm-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "./interfaces/IPositionRenderer.sol";
import "./interfaces/external/IERC20WithMetadata.sol";
import "./libraries/HexStrings.sol";

contract PositionRenderer is IPositionRenderer {
    /// @inheritdoc IPositionRenderer
    function render(address engine, uint256 tokenId) external view override returns (string memory) {
        address risky = IPrimitiveEngineView(engine).risky();
        string memory riskySymbol = IERC20WithMetadata(risky).symbol();

        address stable = IPrimitiveEngineView(engine).stable();
        string memory stableSymbol = IERC20WithMetadata(stable).symbol();

        return
            string(
                abi.encodePacked(
                    '<svg width="260" height="260" xmlns="http://www.w3.org/2000/svg">',
                    returnGradient(risky, stable),
                    '<rect x="0" y="0" width="260" height="260" rx="15" ry="15"  fill="url(#g)"/>',
                    "</svg>"
                )
            );
    }

    /// @notice Credits https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary/
    function _daysToDate(uint256 _days)
        internal
        pure
        returns (
            uint256 year,
            uint256 month,
            uint256 day
        )
    {
        int256 __days = int256(_days);

        int256 L = __days + 68569 + 2440588;
        int256 N = (4 * L) / 146097;
        L = L - (146097 * N + 3) / 4;
        int256 _year = (4000 * (L + 1)) / 1461001;
        L = L - (1461 * _year) / 4 + 31;
        int256 _month = (80 * L) / 2447;
        int256 _day = L - (2447 * _month) / 80;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;

        year = uint256(_year);
        month = uint256(_month);
        day = uint256(_day);
    }

    function returnGradient(address risky, address stable) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    '<defs><linearGradient id="g" x1="100%" y1="100%" x2="0%" y2="0%">',
                    '<stop offset="0%" style="stop-color:',
                    returnColor(risky),
                    ';stop-opacity:1"/><stop offset="100%" style="stop-color:',
                    returnColor(stable),
                    ';stop-opacity:1"/></linearGradient></defs>'
                )
            );
    }

    function returnColor(address token) public pure returns (string memory) {
        return string(abi.encodePacked("#", HexStrings.toHexStringNoPrefix(uint160(token), 3)));
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
        return
            string(
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
                    bytes(fontWeight).length > 0 ? '" font-weight="500">' : '">',
                    text,
                    "</text>"
                )
            );
    }
}
