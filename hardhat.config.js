/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

const { cmc, projectId, privkey, etherscan } = require('./secrets.json');

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
  defaultNetwork: "hardhat",
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
    }
  }
};
