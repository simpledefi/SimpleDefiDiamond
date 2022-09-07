const { config } = require('dotenv');
const { assert } = require('console')
const truffleAssert = require('truffle-assertions');
const App = require("./class")

// const { artifacts } = require('hardhat');
const DiamondFactory = artifacts.require('DiamondFactory')

const ERC20 = artifacts.require("ERC20");

const BEACON_ADDR = "0x00a890727D92AeaAC09B199Bd4a9FBc2E7D65644";
const PF_ADDR = "0x4317A95c5f46527d87fD5AC93Fbc16F4B9580CA3"

const delay = ms => new Promise(res => setTimeout(res, ms));
const _salt = function() {return  (Math.random()*1e18).toString();};

contract('simpleDefi', accounts => {
    let HARVEST_ADDR = "0x6492830c2292381CcF3D439ea70a2Bfbc1a52cd9";
    let OWNER_ADDR = "0x42a515c1EDB651F4c69c56E05578D2805D6451eB";
    let exchange, pool_ID;
    let app;
    let bal0, bal1, bal2;
    let deposit_amount = 1;

    it('should deploy combineApp with initial Contracts', async () => {
        let diamondFactory = await DiamondFactory.deployed()
        pool_ID = 2;
        exchange = 'PANCAKESWAP'
        let tx = await diamondFactory.initialize(pool_ID,exchange,1,_salt(),{from: accounts[0]})
        app = new App(tx,OWNER_ADDR,web3);
    
        bal0 = await web3.eth.getBalance(accounts[2]);
        console.log("Balance 0:", bal0);
    });    


    it("Should handle deposit", async() => {
        bal0 = await web3.eth.getBalance(accounts[2]);
        let tx = await app.deposit(accounts[2], deposit_amount);
        console.log("After Deposit");
        let userinfo = await app.userInfo(accounts[1]);
        console.log(JSON.stringify(userinfo));
        console.log(JSON.stringify(await app.iData()));
        bal1 = await web3.eth.getBalance(accounts[2]);
        console.log("Balance 1:", bal1);
    });

    it("should handle harvest", async() => {
        console.log("Waiting for harvest...");
        await app.harvest(OWNER_ADDR);
    })

    it ("should handle liquidate", async() => {
        await delay(20000);
        await app.liquidate(accounts[2]);
        bal2 = await web3.eth.getBalance(accounts[2]);
        console.log("Balance 0:", bal0);
        console.log("Balance 1:", bal1);
        console.log("Balance 2:", bal2);
        console.log("Diff:", bal2-bal0);
        console.log("PCT:", ((bal0-bal1)/1e18)/deposit_amount);
    });
});