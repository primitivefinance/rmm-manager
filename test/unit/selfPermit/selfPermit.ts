import { parseWei } from 'web3-units'
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { utils } from 'ethers'
import expect from '../../shared/expect'
import { runTest } from '../context'

const value = parseWei('1').raw

runTest('selfPermit', function () {
  describe('success cases', function () {
    it('wraps ETH into WETH', async function () {
      const domain: TypedDataDomain = {
        name: 'TestToken',
        version: '1',
      }

      const Approve: TypedDataField[] = [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ]

      const types: Record<string, TypedDataField[]> = {
        Approve
      }

      const values: Record<string, any> = {
        owner: this.deployer.address,
        spender: this.house.address,
        value,
        nonce: 0,
        deadline: 999999,
      }

      const sig = await this.deployer._signTypedData(domain, types, values)
      const splitSig = utils.splitSignature(sig);

      await this.house.selfPermit(
        this.risky.address,
        this.house.address,
        value,
        splitSig.v,
        splitSig.r,
        splitSig.s
      )

      expect(
        this.risky.allowance(this.deployer.address, this.house.address)
      )
    })
  })

  describe('fail cases', function () {
    it('fails to wrap if not enough value is sent', async function () {
    })
  })
})
