// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.0;

import "./PrimitiveHouse.sol";
import "./Whitelist.sol";

contract PrimitivePaleoHouse is PrimitiveHouse, Whitelist {
    /// @inheritdoc IWhitelist
    function useKey(string memory key, address user) public override {
        super.useKey(key, user);

        ITestERC20(risky).mint(user, 100 ether);
        ITestERC20(stable).mint(user, 100 ether);
    }

    /// @inheritdoc IPrimitiveHouse
    function create(
        uint256 strike,
        uint64 sigma,
        uint32 time,
        uint256 riskyPrice
    ) public override onlyWhitelisted {
        super.create(strike, sigma, time, riskyPrice);
    }

    /// @inheritdoc IPrimitiveHouse
    function deposit(
        address owner,
        uint256 delRisky,
        uint256 delStable
    ) public override onlyWhitelisted {
        super.deposit(owner, delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function withdraw(uint256 delRisky, uint256 delStable) public override onlyWhitelisted {
        super.withdraw(delRisky, delStable);
    }

    /// @inheritdoc IPrimitiveHouse
    function allocate(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        bool fromMargin
    ) public override onlyWhitelisted {
        super.allocate(poolId, owner, delLiquidity, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function borrow(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        uint256 maxPremium
    ) public override onlyWhitelisted {
        super.borrow(poolId, owner, delLiquidity, maxPremium);
    }

    /// @inheritdoc IPrimitiveHouse
    function repay(
        bytes32 poolId,
        address owner,
        uint256 delLiquidity,
        bool fromMargin
    ) public override onlyWhitelisted {
        super.repay(poolId, owner, delLiquidity, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function swap(
        bytes32 poolId,
        bool riskyForStable,
        uint256 deltaIn,
        uint256 deltaOutMin,
        bool fromMargin
    ) public override onlyWhitelisted {
        super.swap(poolId, riskyForStable, deltaIn, deltaOutMin, fromMargin);
    }

    /// @inheritdoc IPrimitiveHouse
    function swapXForY(bytes32 poolId, uint256 deltaOut) public override onlyWhitelisted {
        super.swapXForY(poolId, deltaOut);
    }

    /// @inheritdoc IPrimitiveHouse
    function swapYForX(bytes32 poolId, uint256 deltaOut) public override onlyWhitelisted {
        super.swapYForX(poolId, deltaOut);
    }
}
