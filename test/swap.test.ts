import { expect } from 'chai'
import { parseWei, Time } from 'web3-units'
import { constants, Wallet } from 'ethers'
import { createFixtureLoader, Fixture } from '@ethereum-waffle/provider'
import { PrimitiveEngine } from '@primitivefinance/v2-core/typechain'
import { abi as EngineAbi } from '@primitivefinance/v2-core/artifacts/contracts/PrimitiveEngine.sol/PrimitiveEngine.json'
import hre, { waffle, ethers } from 'hardhat'
import { deployContract } from 'ethereum-waffle'
import { Calibration } from './shared/calibration'
import { computePoolId } from './shared/utilities'
import { PrimitiveHouse, Token, MockEngine, MockFactory } from '../typechain'
import { Contract } from '@ethersproject/contracts'
const { HashZero, AddressZero, MaxUint256 } = constants

interface PrimitiveFixture {
  factory: MockFactory
  engine: MockEngine
  risky: Token
  stable: Token
  house: PrimitiveHouse
}

export async function deploy(contractName: string, deployer: Wallet, args: any[] = []): Promise<Contract> {
  const artifact = await hre.artifacts.readArtifact(contractName)
  const contract = await deployContract(deployer, artifact, args, { gasLimit: 9500000 })
  return contract
}

export async function primitiveFixture([wallet]: Wallet[], provider: any): Promise<PrimitiveFixture> {
  const factory = (await deploy('MockFactory', wallet)) as MockFactory
  const risky = (await await deploy('Token', wallet, [])) as Token
  const stable = (await await deploy('Token', wallet, [])) as Token
  await factory.deploy(risky.address, stable.address)
  const addr = await factory.getEngine(risky.address, stable.address)
  const engine = (await ethers.getContractAt(EngineAbi, addr)) as unknown as MockEngine
  const house = (await deploy('PrimitiveHouse', wallet, [factory.address, AddressZero])) as unknown as PrimitiveHouse
  return { factory, engine, stable, risky, house }
}

let loadFixture = createFixtureLoader(waffle.provider.getWallets())

describe('Test stable swap', function () {
  let engine, poolId, deployer, house, factory, risky, stable
  beforeEach(async function () {
    ;[deployer] = await waffle.provider.getWallets()
    const fixture = await loadFixture(primitiveFixture)
    const cal = new Calibration(10, 1, Time.YearInSeconds + 1, 1, 10)
    ;({ engine, house, risky, stable, factory } = fixture)

    poolId = computePoolId(engine.address, cal.strike.raw, cal.sigma.raw, cal.maturity.raw)
    await risky.mint(deployer.address, parseWei('1000').raw)
    await stable.mint(deployer.address, parseWei('1000').raw)
    await risky.approve(house.address, MaxUint256)
    await stable.approve(house.address, MaxUint256)

    await house.create(
      risky.address,
      stable.address,
      cal.strike.raw,
      cal.sigma.raw,
      cal.maturity.raw,
      parseWei(cal.delta).raw,
      parseWei('100').raw
    )
  })

  it('swaps stable tokens to risky', async function () {
    await expect(house.swap(risky.address, stable.address, poolId, false, parseWei('1').raw, 0, false, false))
  })
})
