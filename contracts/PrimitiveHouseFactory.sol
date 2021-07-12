/// @title   Primitive Factory
/// @author  Primitive
/// @dev     Deploy new PrimitiveEngine contracts

import "./interfaces/IPrimitiveHouseFactory.sol";
import "./PrimitiveHouse.sol";
import "./interfaces/IAdmin.sol";

contract PrimitiveHouseFactory is IPrimitiveHouseFactory {
    /// @inheritdoc IPrimitiveHouseFactory
    address public override owner;

    /// @inheritdoc IPrimitiveHouseFactory
    mapping(address => address) public override getHouse;

    struct Args {
        address factory;
        address engine;
    }

    /// @inheritdoc IPrimitiveHouseFactory
    Args public override args; // Used instead of an initializer in Engine contract

    constructor() {
        owner = msg.sender;
    }

    /// @inheritdoc IPrimitiveHouseFactory
    function deploy(address engine) external override returns (address house) {
        require(engine != address(0), "Cannot be same token");
        house = deploy(address(this), engine);
        getHouse[engine] = house;
        IAdmin(house).setAdmin(msg.sender);
        emit Deployed(msg.sender, engine, house);
    }

    /// @notice Deploys an house contract with a `salt`.
    /// @dev    The house contract should have no constructor args, because this affects the deployed address
    ///         From solidity docs:
    ///         "It will compute the address from the address of the creating contract,
    ///         the given salt value, the (creation) bytecode of the created contract and the constructor arguments."
    /// @param  factory The address of the deploying smart contract
    /// @param  engine  A valid engine contract which was deployed 
    /// @return house   The house contract address which was deployed
    function deploy(
        address factory,
        address engine
    ) internal returns (address house) {
        args = Args({factory: factory, engine: engine}); // Engines call this to get constructor args
        house = address(new PrimitiveHouse{salt: keccak256(abi.encode(engine))}());
        delete args;
    }
}

