// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.6;

import "./interfaces/IAdmin.sol";

contract Admin is IAdmin {
    /// @inheritdoc IAdmin
    address public override admin;

    /// @dev Restrict the call to the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    /// @inheritdoc IAdmin
    function setAdmin(address newAdmin) external override onlyAdmin() {
        emit AdminSet(admin, newAdmin);
        admin = newAdmin;
    }

    /// @param _admin The address receiving the admin rights
    function initializeAdmin(address _admin) internal {
        admin = _admin;
    }
}
