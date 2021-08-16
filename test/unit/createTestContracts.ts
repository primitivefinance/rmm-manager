import hre, { ethers } from 'hardhat'
import { Wallet, Contract } from 'ethers'
import { Contracts } from '../../types'
import { deployContract } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'
import PrimitiveFactoryArtifact from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveFactory.sol/PrimitiveFactory.json'
import PrimitiveEngineArtifact from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'
import { PrimitiveEngine, PrimitiveFactory } from '@primitivefinance/v2-core/typechain'
// import { abi as PaleoHouseAbi } from '../../artifacts/contracts/PrimitivePaleoHouse.sol/PrimitivePaleoHouse.json'

type BaseContracts = {
  factory: PrimitiveFactory
  engine: PrimitiveEngine
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

  const factory = (await deployContract(deployer, PrimitiveFactoryArtifact)) as PrimitiveFactory
  await factory.deploy(risky.address, stable.address)
  const addr = await factory.getEngine(risky.address, stable.address)
  const engine = (await ethers.getContractAt(PrimitiveEngineArtifact.abi, addr)) as PrimitiveEngine

  // Periphery
  const house = (await deploy('PrimitiveHouse', deployer, [factory.address])) as ContractTypes.PrimitiveHouse

  // Paleo
  const testAdmin = (await deploy('TestAdmin', deployer)) as ContractTypes.TestAdmin
  const whitelist = (await deploy('Whitelist', deployer)) as ContractTypes.Whitelist

  return { factory, engine, stable, risky, house, testAdmin, whitelist }
}

export default async function createTestContracts(deployer: Wallet): Promise<Contracts> {
  const loadedContracts: Contracts = {} as Contracts

  const baseContracts = await initializeBaseContracts(deployer)

  Object.assign(loadedContracts, baseContracts)

  return loadedContracts
}
