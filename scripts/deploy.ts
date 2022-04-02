import { ethers } from "hardhat";

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

async function main() {
  const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
  const ETHPool = await ETHPoolFactory.deploy("ETHPool");
  await ETHPool.deployed();
  console.log("ETH POOL address: ", ETHPool.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((e) => {
  console.error(e);
});
