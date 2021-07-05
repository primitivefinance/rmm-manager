import { Wei, toBN, formatEther, parseEther, parseWei, fromInt, BigNumber, BigNumberish } from './Units'
import { BytesLike, utils } from 'ethers'
import bn from 'bignumber.js'
import { Contract } from '@ethersproject/contracts'

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

export function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

export interface Reserve {
  reserveRisky: Wei
  reserveStable: Wei
  liquidity: Wei
  float: Wei
  debt: Wei
}

export async function getReserve(engine: Contract, poolId: BytesLike, log?: boolean): Promise<Reserve> {
  const res = await engine.reserves(poolId)
  const reserve: Reserve = {
    reserveRisky: new Wei(res.reserveRisky),
    reserveStable: new Wei(res.reserveStable),
    liquidity: new Wei(res.liquidity),
    float: new Wei(res.float),
    debt: new Wei(res.debt),
  }
  if (log)
    console.log(`
      reserveRisky: ${formatEther(res.reserveRisky)},
      reserveStable: ${formatEther(res.reserveStable)},
      liquidity: ${formatEther(res.liquidity)},
      float: ${formatEther(res.float)}
      debt: ${formatEther(res.debt)}
    `)
  return reserve
}

export interface Position {
  owner: string
  BX1: Wei
  BY2: Wei
  liquidity: Wei
  float: Wei
  debt: Wei
  unlocked: boolean
}

export async function getPosition(contract: Contract, owner: string, poolId: BytesLike, log?: boolean): Promise<Position> {
  const pos = await contract.getPosition(owner, poolId)
  const position: Position = {
    owner: pos.owner,
    BX1: new Wei(pos.balanceRisky),
    BY2: new Wei(pos.balanceStable),
    liquidity: new Wei(pos.liquidity),
    float: new Wei(pos.float),
    debt: new Wei(pos.debt),
    unlocked: pos.unlocked,
  }
  if (log)
    console.log(`
      owner: ${pos.owner},
      nonce: ${pos.nonce},
      BX1: ${formatEther(pos.balanceRisky)},
      BY2: ${formatEther(pos.balanceStable)},
      liquidity: ${formatEther(pos.liquidity)},
      float: ${formatEther(pos.float)},
      debt: ${formatEther(pos.debt)}
      unlocked: ${pos.unlocked}
    `)
  return position
}

export interface Margin {
  owner: string
  BX1: Wei
  BY2: Wei
  unlocked: boolean
}

export async function getMargin(contract: Contract, owner: string, log?: boolean): Promise<Margin> {
  const mar = await contract.margins(owner)
  const margin: Margin = {
    owner: owner,
    BX1: new Wei(mar.BX1),
    BY2: new Wei(mar.BY2),
    unlocked: mar.unlocked,
  }
  if (log)
    console.log(`
      owner: ${owner},
      BX1: ${formatEther(mar.BX1)},
      BY2: ${formatEther(mar.BY2)},
      unlocked: ${mar.unlocked}
    `)
  return margin
}

export interface Calibration {
  strike: BigNumber
  sigma: number
  time: number
}

export async function getCalibration(engine: Contract, poolId: BytesLike, log?: boolean): Promise<Calibration> {
  const cal = await engine.settings(poolId)
  const calibration: Calibration = {
    strike: toBN(cal.strike),
    sigma: +cal.sigma,
    time: +cal.time,
  }
  if (log)
    console.log(`
        Strike: ${formatEther(cal.strike)},
        Sigma:  ${cal.sigma},
        Time:   ${cal.time}
      `)
  return calibration
}

export interface PoolParams {
  reserve: Reserve
  calibration: Calibration
}

export async function getPoolParams(engine: Contract, poolId: BytesLike, log?: boolean): Promise<PoolParams> {
  const reserve: Reserve = await getReserve(engine, poolId, log)
  const calibration: Calibration = await getCalibration(engine, poolId, log)
  return { reserve, calibration }
}

export function getCreate2Address(factoryAddress: string, [stable, risky]: [string, string], bytecode: string): string {
  const encodedArguments = utils.defaultAbiCoder.encode(['address', 'address'], [stable, risky])

  const create2Inputs = ['0xff', factoryAddress, utils.keccak256(encodedArguments), utils.keccak256(bytecode)]

  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`
  return utils.getAddress(`0x${utils.keccak256(sanitizedInputs).slice(-40)}`)
}
