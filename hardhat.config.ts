import { HardhatUserConfig } from 'hardhat/types'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import 'prettier-plugin-solidity'
import 'hardhat-tracer'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import 'hardhat-contract-sizer'
import '@primitivefi/hardhat-dodoc'

import { resolve } from 'path'
import { config as dotenvConfig } from 'dotenv'
import { NetworkUserConfig } from 'hardhat/types'
dotenvConfig({ path: resolve(__dirname, './.env') })

import './scripts/checkEngineHash'

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const INFURA_API_KEY = process.env.INFURA_API_KEY || ''

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
}

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = 'https://' + network + '.infura.io/v3/' + INFURA_API_KEY
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic: 'test test test test test test',
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  }
}

const config: HardhatUserConfig = {
  dodoc: {
    runOnCompile: false,
    include: [
      'PositionRenderer',
      'PrimitiveManager',
      'CashManager',
      'ERC1155Permit',
      'ManagerBase',
      'MarginManager',
      'Multicall',
      'PositionManager',
      'Reentrancy',
      'SelfPermit',
      'SwapManager',
      'ICashManager',
      'IERC1155Permit',
      'IManagerBase',
      'IMarginManager',
      'IMulticall',
      'IPositionRenderer',
      'IPrimitiveManager',
      'ISelfPermit',
      'ISwapManager',
      'EngineAddress',
      'HexStrings',
      'Margin',
      'TransferHelper',
    ],
    templatePath: './docusaurus.sqrl',
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    dev: {
      chainId: 1337,
      url: 'http://127.0.0.1:8545',
      blockGasLimit: 12e6,
      gas: 12e6,
    },
    mainnet: createTestnetConfig('mainnet'),
    goerli: createTestnetConfig('goerli'),
    kovan: createTestnetConfig('kovan'),
    rinkeby: createTestnetConfig('rinkeby'),
    ropsten: createTestnetConfig('ropsten'),
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 400,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: false,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ['./node_modules/@primitivefi/**/artifacts/contracts/**/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
}

export default config
