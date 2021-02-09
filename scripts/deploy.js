const { ethers, upgrades } = require("hardhat");

async function main() {
  const YAEToken = await ethers.getContractFactory("YAEToken");
  const mc = await YAEToken.deploy()
  await mc.deployed();
  console.log("YAE Contract deployed to:", mc.address);
}

main();
