/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

const { utils } = require("ethers");
const { cmc, projectId, privkey, privprod, etherscan } = require('./secrets.json');

module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "rinkeby",
  gasReporter: {
    coinmarketcap: cmc,
    currency: 'EUR',
    gasPrice: 100
  },
  etherscan: {
    apiKey: etherscan
  },
  networks: {
    hardhat: {
    },
    rinkeby: {
        url: `https://rinkeby.infura.io/v3/${projectId}`,
        accounts: [privkey]
    },
    mainnet: {
        url: `https://mainnet.infura.io/v3/${projectId}`,
        accounts: [privprod],
        gasPrice: parseInt(utils.parseUnits("100", "gwei"))
    }
  }
};
