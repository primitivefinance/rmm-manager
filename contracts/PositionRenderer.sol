// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

/// @title   PositionRenderer contract
/// @author  Primitive
/// @notice  Renders the visual of the position tokens

import "@primitivefinance/rmm-core/contracts/interfaces/engine/IPrimitiveEngineView.sol";
import "base64-sol/base64.sol";
import "./interfaces/IPositionRenderer.sol";
import "./interfaces/external/IERC20WithMetadata.sol";
import "./libraries/HexStrings.sol";

contract PositionRenderer is IPositionRenderer {
    /// @inheritdoc IPositionRenderer
    function render(address engine, uint256 tokenId) external view override returns (string memory) {
        return string(abi.encodePacked(
            'data:image/svg+xml;base64,',
            Base64.encode(bytes(
                '<svg width="512" height="512" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M0 0h512v512H0z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M339.976 134.664h41.048L256 340.586 130.976 134.664h41.047V98H64.143L256 414 447.857 98H339.976v36.664Zm-38.759 0V98h-90.436v36.664h90.436Z" fill="#fff"/></svg>'
            ))
        ));
    }
}
