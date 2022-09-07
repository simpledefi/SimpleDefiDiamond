const { config } = require('dotenv');
const { assert } = require('console');
const fs = require("fs");
const truffleAssert = require('truffle-assertions');
const App = require("./class")

// const { artifacts } = require('hardhat');
const DiamondFactory = artifacts.require('DiamondFactory')

const PF_ADDR = "0x4317A95c5f46527d87fD5AC93Fbc16F4B9580CA3"
 
const delay = ms => new Promise(res => setTimeout(res, ms));
const _salt = function() {return  (Math.random()*1e18).toString();};


contract('simpleDefi', accounts => {
    let HARVEST_ADDR = "0x6492830c2292381CcF3D439ea70a2Bfbc1a52cd9";
    let OWNER_ADDR = "0x42a515c1EDB651F4c69c56E05578D2805D6451eB";
    let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";

    let exchange, pool_ID;
    let app;
    let bal0, bal1, bal2;
    let deposit_amount = 1;

    async function holdback(amt) {
        await app.setHoldback(accounts[1], amt);
    
        let pid = await app.iData();
        for(let i = 0; i < 10; i++) 
            await app.updatePool(parseInt(pid['poolId']));
    
        let result = await app.harvest(OWNER_ADDR);
        app.dumpLogs(result);
        fs.writeFileSync("/tmp/result.json", (JSON.stringify(result)));

        console.log(await app.findLog(result, "distContrib_evt",accounts[1]));
        console.log(await app.findLog(result, "sendHoldback_evt",accounts[1]));
    }

    it('should deploy combineApp with initial Contracts', async () => {
        let diamondFactory = await DiamondFactory.deployed()
        pool_ID = 2;
        exchange = 'PANCAKESWAP'
        let tx = await diamondFactory.initialize(pool_ID,exchange,1,_salt(),{from: accounts[0]})
        app = new App(tx,OWNER_ADDR,web3);
    
        bal0 = await web3.eth.getBalance(accounts[2]);
        console.log("Balance 0:", bal0);
        id = await app.iData();
        console.log(JSON.stringify(id));
        await web3.eth.sendTransaction({to:OWNER_ADDR, from:accounts[0], value:web3.utils.toWei("100", "ether")});
    });

    it('Deposit Into account', async () => {
        await app.deposit(accounts[1],1250);
        await holdback(50);
    
    });    

    // it('25% holdback', async () => {
    //     await app.resetGas(OWNER_ADDR);
    //     await holdback(25);
    // });    

    // it('0% holdback', async () => {
    //     await app.resetGas(OWNER_ADDR);
    //     await holdback(0);
    // });    
});