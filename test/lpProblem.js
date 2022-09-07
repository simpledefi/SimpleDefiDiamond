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

    it('Test deposit pattern', async() => {
        tx = await app.deposit(accounts[1], 3000);
        units = await (app.userInfo(accounts[1]));
        console.log("Units 1-0:",parseInt(units[1]));
        await delay(5000);
        units = await (app.userInfo(accounts[1]));
        console.log("Units 1-1:",parseInt(units[1]));
        
        await app.harvest(OWNER_ADDR);
        
        units = await (app.userInfo(accounts[1]));
        console.log("Units 1-2:",parseInt(units[1]));

        await delay(5000);
        tx = await app.deposit(accounts[2],1000);

        await delay(5000);
        units = await (app.userInfo(accounts[2]));
        console.log("Units 2-3:",parseInt(units[1]));

        units = await (app.userInfo(accounts[1]));
        console.log("Units 1-4:",parseInt(units[1]));

        console.log("Waiting for deposit timeout...");
        await delay(15000);
        tx = await app.liquidate(accounts[1]);
        app.dumpLogs(tx);
        await app.harvest(OWNER_ADDR);

        units = await (app.userInfo(accounts[2]));
        console.log("Units 2-5:",parseInt(units[1]));

        units = await (app.userInfo(accounts[1]));
        console.log("Units 1-6:",parseInt(units[1]));

    });    



});