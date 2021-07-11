import hre, { ethers } from 'hardhat'
import { Wallet, Contract } from 'ethers'
import { Contracts } from '../../types'
import { deployContract } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefinance/primitive-v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'
import { abi as PrimitiveHouseAbi } from '../../artifacts/contracts/PrimitiveHouse.sol/PrimitiveHouse.json'

type BaseContracts = {
  factory: ContractTypes.PrimitiveFactory
  houseFactory: ContractTypes.PrimitiveHouseFactory
  engine: ContractTypes.PrimitiveEngine
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
  admin: ContractTypes.Admin
  whitelist: ContractTypes.Whitelist
}

async function deploy(contractName: string, deployer: Wallet, args?: any[]): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, args, { gasLimit: 9500000 })
  return contract
}

async function initializeBaseContracts(deployer: Wallet): Promise<BaseContracts> {
  const risky = (await deploy('Token', deployer)) as ContractTypes.Token
  const stable = (await deploy('Token', deployer)) as ContractTypes.Token
  const factory = (await deploy('PrimitiveFactory', deployer)) as ContractTypes.PrimitiveFactory
  const houseFactory = (await deploy('PrimitiveHouseFactory', deployer)) as ContractTypes.PrimitiveHouseFactory
  await factory.deploy(risky.address, stable.address)
  const addr = await factory.getEngine(risky.address, stable.address)
  const engine = (await ethers.getContractAt(PrimitiveEngineAbi, addr)) as unknown as ContractTypes.PrimitiveEngine
  await houseFactory.deploy(engine.address)
  const houseAddr = await houseFactory.getHouse(engine.address)
  const house = (await ethers.getContractAt(PrimitiveHouseAbi, houseAddr)) as unknown as ContractTypes.PrimitiveHouse
  const admin = (await deploy('Admin', deployer, [deployer.address])) as ContractTypes.Admin
  const whitelist = (await deploy('Whitelist', deployer, [deployer.address])) as ContractTypes.Whitelist
  return { factory, engine, stable, risky, house, houseFactory, admin, whitelist }
}

export default async function createTestContracts(deployer: Wallet): Promise<Contracts> {
  const loadedContracts: Contracts = {} as Contracts

  const { factory, engine, risky, stable, house, admin, whitelist } = await initializeBaseContracts(deployer)

  loadedContracts.factory = factory
  loadedContracts.engine = engine
  loadedContracts.house = house
  loadedContracts.risky = risky
  loadedContracts.stable = stable
  loadedContracts.admin = admin
  loadedContracts.whitelist = whitelist

  return loadedContracts
}
