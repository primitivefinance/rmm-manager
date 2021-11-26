import {
  Wallet,
  BigNumberish,
  Signature,
  utils
} from 'ethers'

export async function getERC20PermitSignature(
  wallet: Wallet,
  token: string,
  spender: string,
  value: BigNumberish,
  deadline: BigNumberish,
  permitConfig: {
    nonce: BigNumberish,
    name: string,
    chainId: number,
    version: string
  }
): Promise<Signature> {
  return utils.splitSignature(
    await wallet._signTypedData(
      {
        name: permitConfig.name,
        version: permitConfig.version,
        chainId: permitConfig.chainId,
        verifyingContract: token
      },
      {
        Permit: [
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
        ],
      },
      {
        owner: wallet.address,
        spender,
        value,
        nonce: permitConfig.nonce,
        deadline,
      }
    )
  )
}

export async function getERC1155PermitSignature(
  wallet: Wallet,
  token: string,
  operator: string,
  approved: boolean,
  deadline: BigNumberish,
  permitConfig: {
    nonce: BigNumberish,
    name: string,
    chainId: number,
    version: string
  }
): Promise<Signature> {
  return utils.splitSignature(
    await wallet._signTypedData(
      {
        name: permitConfig.name,
        version: permitConfig.version,
        chainId: permitConfig.chainId,
        verifyingContract: token
      },
      {
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'operator',
            type: 'address',
          },
          {
            name: 'approved',
            type: 'bool',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
      {
        owner: wallet.address,
        operator,
        approved,
        nonce: permitConfig.nonce,
        deadline,
      }
    )
  )
}
