![CI status](https://github.com/devcrazygit/ETHPool/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/gh/devcrazygit/ETHPool/branch/master/graph/badge.svg)](https://codecov.io/gh/devcrazygit/ETHPool)

# ETHPool

ETHPool provides a service where people can deposit ETH and they will receive weekly rewards. Users can take out their deposits along with their portion of rewards at any time. New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.

## Requiments

- Only the team can deposit rewards.
- Deposited rewards go to the pool of users, not to individual users.
- Users should be able to withdraw their deposits along with their share of rewards considering the time when they deposited.

Example:

> Let say we have user **A** and **B** and team **T**.
>
> **A** deposits 100, and **B** deposits 300 for a total of 400 in the pool. Now **A** has 25% of the pool and **B** has 75%. When **T** deposits 200 rewards, **A** should be able to withdraw 150 and **B** 450.
>
> What if the following happens? **A** deposits then **T** deposits then **B** deposits then **A** withdraws and finally **B** withdraws.
> **A** should get their deposit + all the rewards.
> **B** should only get their deposit because rewards were sent to the pool before they participated.

## Build Contracts

Compiles contracts and creates Typechain bindings

```
npm run build
```

## Run Tests

Run all tests in `/test` folder

```
npm run test
```

This command also checks the coverage of the test.

If you want only to test, run the following command

```
npm run test:light
```

## Deploy to Ethereum

Copy the `.env.example` file as `.env` and change the parameters into yours and run:

```
npx hardhat run --network ropsten scripts/deploy.ts
```

## Interact with the contract

You can query the total amount of ETH held in the contract by running:

```
npx hardhat poolsize --address <CONTRACT_ADDRESS>
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "ETHPool"
```
