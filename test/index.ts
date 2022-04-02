import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

let ETHPool: Contract;
let team: SignerWithAddress;
let userA: SignerWithAddress;
let userB: SignerWithAddress;
let nonHolder: SignerWithAddress;

const depositA1 = BigNumber.from("10000000000000000");
const reward1 = BigNumber.from("11000000000000000");

describe("ETHPool", function () {
  const POOL_NAME = "ETHPool";

  beforeEach(async function () {
    const ETHPoolFactory = await ethers.getContractFactory(POOL_NAME);
    ETHPool = await ETHPoolFactory.deploy("ETHPool");
    await ETHPool.deployed();
    [team, userA, userB, nonHolder] = await ethers.getSigners();
  });
  describe("When deployed first", function () {
    it("Should set the right owner", async function () {
      expect(await ETHPool.owner()).to.equal(team.address);
    });
    it("Should return right pool name", async function () {
      expect(await ETHPool.name()).to.equal(POOL_NAME);
    });
    it("Should be rewardable for the team", async function () {
      expect(await ETHPool.rewardable()).to.equal(true);
    });
    it("Should be failed to get balance for non-holders", async function () {
      await expect(ETHPool.connect(nonHolder).balance()).to.be.revertedWith(
        "No such a holder"
      );
    });
    it("Should be failed to withdraw for non-holders", async function () {
      await expect(ETHPool.connect(nonHolder).withdraw()).to.be.revertedWith(
        "No such a holder"
      );
    });
  });
  describe("When userA deposit at first", function () {
    beforeEach(async function () {
      await ETHPool.connect(userA).deposit({ value: depositA1 });
    });
    it("Should set right balance of the userA", async function () {
      expect(await ETHPool.connect(userA).balance()).to.equal(depositA1);
    });
    it("Should set right balance of the pool", async function () {
      expect(await ethers.provider.getBalance(ETHPool.address)).to.be.equal(
        depositA1
      );
    });
    it("Should be pending reward zero for userA", async function () {
      expect(await ETHPool.getPendingReward(userA.address)).to.equal(0);
    });
    it("Should be withdrawed without reward at this time", async function () {
      await expect(ETHPool.connect(userA).withdraw())
        .to.emit(ETHPool, "WithdrawSucceed")
        .withArgs(userA.address, depositA1);
    });
    it("Should reject reward deposit for who is not in the team", async function () {
      await expect(
        ETHPool.connect(userA).depositReward({ value: reward1 })
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        ETHPool.connect(nonHolder).depositReward({ value: reward1 })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should reject reward deposit for zero amount", async function () {
      await expect(ETHPool.depositReward()).to.be.revertedWith(
        "Not enough reward value"
      );
    });
    describe("When the team deposit reward", async function () {
      beforeEach(async function () {
        await ETHPool.depositReward({ value: reward1 });
      });
      it("Should increase pool volume", async function () {
        expect(await ethers.provider.getBalance(ETHPool.address)).to.be.equal(
          depositA1.add(reward1)
        );
      });
      it("Should reject reward deposit before a week", async function () {
        await expect(
          ETHPool.depositReward({ value: reward1 })
        ).to.be.revertedWith("Please wait a week");
      });
    });
  });
});
