import hre, { ethers } from 'hardhat'
import { Wallet, Contract } from 'ethers'
import { Contracts, ContractName } from '../../types'
import { deployContract } from 'ethereum-waffle'
import * as ContractTypes from '../../typechain'
import { abi as PrimitiveEngineAbi } from '@primitivefinance/primitive-v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'

type BaseContracts = {
  factory: ContractTypes.PrimitiveFactory
  engine: ContractTypes.PrimitiveEngine
  house: ContractTypes.PrimitiveHouse
  risky: ContractTypes.Token
  stable: ContractTypes.Token
}

async function deploy(contractName: string, deployer: Wallet): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, [], { gasLimit: 9500000 })
  return contract
}

async function initializeBaseContracts(deployer: Wallet): Promise<BaseContracts> {
  const risky = (await deploy('Token', deployer)) as ContractTypes.Token
  const stable = (await deploy('Token', deployer)) as ContractTypes.Token
  const factory = (await deploy('PrimitiveFactory', deployer)) as ContractTypes.PrimitiveFactory
  await factory.deploy(risky.address, stable.address)
  const addr = await factory.getEngine(risky.address, stable.address)
  const engine = (await ethers.getContractAt(PrimitiveEngineAbi, addr)) as unknown as ContractTypes.PrimitiveEngine
  const house = (await deploy('PrimitiveHouse', deployer)) as ContractTypes.PrimitiveHouse
  return { factory, engine, stable, risky, house }
}

export default async function createTestContracts(deployer: Wallet): Promise<Contracts> {
  const loadedContracts: Contracts = {} as Contracts

  const { factory, engine, risky, stable, house } = await initializeBaseContracts(deployer)

  loadedContracts.factory = factory
  loadedContracts.engine = engine
  loadedContracts.house = house
  loadedContracts.risky = risky
  loadedContracts.stable = stable

  return loadedContracts
}
