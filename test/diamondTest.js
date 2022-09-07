/* eslint-disable prefer-const */

const { assert } = require('console')
const app = require("./library")
const app2 = require("./library")

/* global contract artifacts web3 before it assert */
const DiamondFactory = artifacts.require('DiamondFactory')

const delay = ms => new Promise(res => setTimeout(res, ms));

contract('DiamondTest', async (accounts) => {
  let diamondFactory

  const OWNER_ADDR= web3.utils.toChecksumAddress("0x42a515c1EDB651F4c69c56E05578D2805D6451eB");
  
  before(async () => {
    diamondFactory = await DiamondFactory.deployed()
    web3.eth.defaultAccount = accounts[0]
  })
  

  it("Deploy new Contract", async() => {
    let tx = await diamondFactory.initialize(2,"PANCAKESWAP",1,32496593476593,{from: accounts[0]})
    let proxy = app.setProxy(tx);
    console.log("proxy:",proxy);
  });

  it("Test Audit function",async() => {
    await app.audit();
  });

  it("Test Deposit Funds", async() => {
    await app.deposit(accounts[1], "1");
  });

  it("Test Audit function after deposit",async() => {
    await app.audit("After deposit");
  });

  it("test harvest", async() => {
    await delay(10000);
    await app.harvest(OWNER_ADDR);
    await app.audit("after harvest");
  });

  // it("Test early Liquidation", async() => {
  //   if (await liquidate(accounts[1])) {
  //     assert("Allowed Liquidation")
  //   } else {
  //     console.log("Blocked early Liquidation");
  //   }
  // });

  it("test Liqudate", async() => {
    await delay(16000);
    await app.liquidate(accounts[1],true);
    await app.audit("After Liquidation");
  });

})
