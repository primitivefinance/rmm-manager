import hre, { ethers } from 'hardhat'
import { Wallet, Contract, utils } from 'ethers'
import { Contracts } from '../../types'
import { deployContract } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefinance/primitive-v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'
import { abi as PrimitiveHouseAbi } from '../../artifacts/contracts/PrimitiveHouse.sol/PrimitiveHouse.json'
import { abi as PaleoHouseAbi } from '../../artifacts/contracts/PrimitivePaleoHouse.sol/PrimitivePaleoHouse.json'

type BaseContracts = {
  factory: ContractTypes.PrimitiveFactory
  houseFactory: ContractTypes.PrimitiveHouseFactory
  engine: ContractTypes.PrimitiveEngine
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
  testAdmin: ContractTypes.TestAdmin
  whitelist: ContractTypes.Whitelist
  // paleoHouse: ContractTypes.PrimitivePaleoHouse
  // paleoHouseFactory: ContractTypes.PrimitivePaleoHouseFactory
}

async function deploy(contractName: string, deployer: Wallet, args?: any[]): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, args, { gasLimit: 9500000 })
  return contract
}

async function initializeBaseContracts(deployer: Wallet): Promise<BaseContracts> {
  // Core
  const risky = (await deploy('Token', deployer)) as ContractTypes.Token
  const stable = (await deploy('Token', deployer)) as ContractTypes.Token
  const factory = (await deploy('PrimitiveFactory', deployer)) as ContractTypes.PrimitiveFactory
  await factory.deploy(risky.address, stable.address)
  const addr = await factory.getEngine(risky.address, stable.address)
  const engine = (await ethers.getContractAt(PrimitiveEngineAbi, addr)) as unknown as ContractTypes.PrimitiveEngine

  // Periphery
  const houseFactory = (await deploy('PrimitiveHouseFactory', deployer)) as ContractTypes.PrimitiveHouseFactory
  await houseFactory.deploy(engine.address)
  const houseAddr = await houseFactory.getHouse(engine.address)
  const house = (await ethers.getContractAt(PrimitiveHouseAbi, houseAddr)) as unknown as ContractTypes.PrimitiveHouse

  // Paleo
  const testAdmin = (await deploy('TestAdmin', deployer)) as ContractTypes.TestAdmin
  const whitelist = (await deploy('Whitelist', deployer)) as ContractTypes.Whitelist

  /*
  const paleoHouseFactory = (await deploy('PaleoHouseFactory', deployer)) as ContractTypes.PrimitiveHouseFactory
  await paleoHouseFactory.deploy(engine.address)
  const paleoHouseAddress = await paleoHouseFactory.getHouse(engine.address)
  const paleoHouse = (await ethers.getContractAt(PaleoHouseAbi, paleoHouseAddress)) as unknown as ContractTypes.PrimitivePaleoHouse

  // await paleoHouse.addKeys([utils.solidityKeccak256(['string'], ['wentoken'])])
  // await paleoHouse.useKey('wentoken', deployer.address)

  */

  return { factory, engine, stable, risky, house, houseFactory, testAdmin, whitelist }
}

export default async function createTestContracts(deployer: Wallet): Promise<Contracts> {
  const loadedContracts: Contracts = {} as Contracts

  const baseContracts = await initializeBaseContracts(deployer)

  Object.assign(loadedContracts, baseContracts)

  return loadedContracts
}
