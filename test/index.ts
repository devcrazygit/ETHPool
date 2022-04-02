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
const reward2 = BigNumber.from("18000000000000000");
const depositB1 = BigNumber.from("30000000000000000");
const depositB2 = BigNumber.from("25600000000000000");

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
    it("Should be failed to withdraw for non-holders", async function () {
      await expect(ETHPool.connect(nonHolder).withdraw()).to.be.revertedWith(
        "No such a holder"
      );
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
  });
  describe("When userA deposit at first", function () {
    beforeEach(async function () {
      await ETHPool.connect(userA).deposit({ value: depositA1 });
    });
    it("Should set right balance of the userA", async function () {
      expect(await ETHPool.balanceOf(userA.address)).to.equal(depositA1);
    });
    it("Should set right balance of the pool", async function () {
      expect(await ethers.provider.getBalance(ETHPool.address)).to.be.equal(
        depositA1
      );
    });
    it("Should be pending reward zero for userA", async function () {
      expect(await ETHPool.getPendingReward(userA.address)).to.equal(0);
    });
    it("Should be able to withdraw without reward at this time", async function () {
      await expect(ETHPool.connect(userA).withdraw())
        .to.emit(ETHPool, "WithdrawSucceed")
        .withArgs(userA.address, depositA1);
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
      it("Should increase userA's pending reward to full reward1", async function () {
        expect(await ETHPool.getPendingReward(userA.address)).to.be.equal(
          reward1
        );
      });
      it("Should increase userA's balance to depositA1 + reward1", async function () {
        expect(await ETHPool.balanceOf(userA.address)).to.be.equal(
          depositA1.add(reward1)
        );
      });
      it("Should be able to withdraw with depositA1 + reward1", async function () {
        await expect(ETHPool.connect(userA).withdraw())
          .to.emit(ETHPool, "WithdrawSucceed")
          .withArgs(userA.address, depositA1.add(reward1));
      });
      describe("When userB deposit", async function () {
        beforeEach(async function () {
          await ETHPool.connect(userB).deposit({ value: depositB1 });
        });
        it("Should set right balance of the userB", async function () {
          expect(await ETHPool.balanceOf(userB.address)).to.equal(depositB1);
        });
        it("Should increase pool volume", async function () {
          expect(await ethers.provider.getBalance(ETHPool.address)).to.be.equal(
            depositA1.add(reward1).add(depositB1)
          );
        });
        it("Should be zero for userB's pending reward yet", async function () {
          expect(await ETHPool.getPendingReward(userB.address)).to.equal(0);
        });
        it("Should be able to withdraw without reward for userB at this time", async function () {
          await expect(ETHPool.connect(userB).withdraw())
            .to.emit(ETHPool, "WithdrawSucceed")
            .withArgs(userB.address, depositB1);
        });
        describe("When team deposit reward again", async function () {
          beforeEach(async function () {
            await ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 7]);
            await ETHPool.depositReward({ value: reward2 });
          });
          it("Should increase pool volume to depositA1 + reward1 + depositB1 + reward2", async function () {
            expect(
              await ethers.provider.getBalance(ETHPool.address)
            ).to.be.equal(depositA1.add(reward1).add(depositB1).add(reward2));
          });
          it("Should totalHolderDeposit is depositA1 + depositB1", async function () {
            expect(await ETHPool.getTotalHolderDeposit()).to.be.equal(
              depositA1.add(depositB1)
            );
          });
          it("Should increase userA's pending reward into reward1 + reward2 * depositA1 / (depositA1 + depositB1)", async function () {
            expect(await ETHPool.getPendingReward(userA.address)).to.be.equal(
              reward1.add(reward2.mul(depositA1).div(depositA1.add(depositB1)))
            );
          });
          it("Should increase userB's pending reward into reward2 * depositB1 / (depositA1 + depositB1)", async function () {
            expect(await ETHPool.getPendingReward(userB.address)).to.be.equal(
              reward2.mul(depositB1).div(depositA1.add(depositB1))
            );
          });
          it("Should be able to withdraw for userA with amount of depositA1 + reward1 + reward2 * depositA1 / (depositA1 + depositB1)", async function () {
            await expect(ETHPool.connect(userA).withdraw())
              .to.emit(ETHPool, "WithdrawSucceed")
              .withArgs(
                userA.address,
                depositA1
                  .add(reward1)
                  .add(reward2.mul(depositA1).div(depositA1.add(depositB1)))
              );
          });
          describe("When userB deposit again", function () {
            beforeEach(async function () {
              await ETHPool.connect(userB).deposit({ value: depositB2 });
            });
            it("Should userB's reward is the same as reward2 * depositB1 / (depositA1 + depositB1)", async function () {
              expect(await ETHPool.getPendingReward(userB.address)).to.be.equal(
                reward2.mul(depositB1).div(depositA1.add(depositB1))
              );
            });
            it("Should increase pool volume to depositA1 + reward1 + depositB1 + reward2 + depositB2", async function () {
              expect(
                await ethers.provider.getBalance(ETHPool.address)
              ).to.be.equal(
                depositA1
                  .add(reward1)
                  .add(depositB1)
                  .add(reward2)
                  .add(depositB2)
              );
            });

            describe("When userA withdraw", function () {
              beforeEach(async function () {
                await ETHPool.connect(userA).withdraw();
              });
              it("Should decrease the pool volume to depositB2 + depositB1 + reward2 * depositB1 / (depositA1 + depositB1)", async function () {
                expect(
                  await ethers.provider.getBalance(ETHPool.address)
                ).to.be.equal(
                  depositB2
                    .add(depositB1)
                    .add(reward2.mul(depositB1).div(depositA1.add(depositB1)))
                );
              });
              it("Should reject withdraw again for userA", async function () {
                await expect(
                  ETHPool.connect(userA).withdraw()
                ).to.be.revertedWith("No such a holder");
              });
              describe("When userB withdraw", function () {
                beforeEach(async function () {
                  await ETHPool.connect(userB).withdraw();
                });
                it("Should pool volume is zero", async function () {
                  expect(
                    await ethers.provider.getBalance(ETHPool.address)
                  ).to.be.equal(0);
                });
              });
            });
          });
        });
      });
    });
  });
});
