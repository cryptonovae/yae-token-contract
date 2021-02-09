# Cryptonovae token contract

This smart contract was written for the Cryptonovae token and 
utilizes OpenZeppelin contracts with a custom vesting mechanism
to allow funds to vest over time. The total balance will be booked
on the receiving end of a vesting user immediately but the user
will only be able to spend a certain amount given the chosen
vesting scheme for this account. The conditions are as follows:

 - Each account has only 1 vesting scheme tops
 - If no vesting scheme is applied the token is considered a regular ERC-20
 - Vesting is done on a daily basis since contract start, rounded up to 1 YAE
 - Additional tokens added to a vesting address can be spent immediately
 - A transaction to send more tokens as allowed results in a failed transaction

We use hardhat to test, compile and deploy this script + sync with etherscan.
We use Infura to deploy the smart contract, and need a API key for 
CoinMarketCap to calculate gas prices for testing and an API key for Etherscan
to verify the contract.

These secrets are managed in `secrets.json`, please copy `secrets.json.example`
to `secrets.json` and modify the values so the commands will work as expected.

## Commonly used commands

### Run the automated tests + calculate gas
```
npx hardhat test
```


### Deploy to the Rinkeby testnet
```
npx hardhat run --network rinkeby scripts/deploy.js 
```

### Verify the smart contract on etherscan
```
npx hardhat verify --network rinkeby CONTRACT_ADDRESS
```
