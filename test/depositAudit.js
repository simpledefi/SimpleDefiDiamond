const { config } = require('dotenv');
const { assert } = require('console')
const truffleAssert = require('truffle-assertions');
const App = require("./class")

// const { artifacts } = require('hardhat');
const DiamondFactory = artifacts.require('DiamondFactory')

const ERC20 = artifacts.require("ERC20");

// const BEACON_ADDR = "0x00a890727D92AeaAC09B199Bd4a9FBc2E7D65644";
let BEACON_ADDR = "0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2";

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
        id = await app.iData();
        console.log(JSON.stringify(id));
        await web3.eth.sendTransaction({to:OWNER_ADDR, from:accounts[0], value:web3.utils.toWei("100", "ether")});
    });

    // it('Set Inter Token', async () => {        
    //     await app.setInterToken("0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d","0x0000000000000000000000000000000000000000",{from: HARVEST_ADDR});
    //     id = await app.iData();
    //     console.log(JSON.stringify(id));
    // });          

    it("Should handle deposit", async() => {
        for (let i = 0; i < 10; i++) {
            tx = await app.deposit(accounts[i], 1);
            // dumpLogs(tx);
            
            l = await app.findLog(tx, "addFunds_evt",accounts[i]);
            a = parseInt(l['_amount']);
            ui = await app.userInfo(accounts[i]);
            b = parseInt(ui['amount'])
            console.log(`UI ${i}:`,b,a-b);
            console.log("Result:", (a-b)==0 );
            // break;
        }
    });    


    it("should display after harvest", async() => {
        tx = await app.harvest(OWNER_ADDR);
        let u = 0;
        for (let i = 0; i < 10; i++) {
            ui = await app.userInfo(accounts[i]);
            let units = parseInt(ui['units']);
            u += units;
            console.log(`UI ${i}:`,units,parseInt(ui['amount']));
        }
        console.log("total units:",u);
    });

    it ("should handle big deposit", async() => {
        console.log("waiting....")
        await delay(15000);
        await app.deposit(accounts[1],100);
    });
    
    // it ("should handle liquidate", async() => {
    //     console.log("waiting....")
    //     await delay(15000);
    //     await app.liquidate(accounts[1]);
    // });
    
    
    it("should updatePool and  harvest", async() => {
        console.log("waiting....")
        await delay(15000);
        for (let i = 0; i < 50; i++) {
            console.log("updatePool:",i);
            await app.updatePool(pool_ID);
        }

        let u = 0;
        console.log("Before Harvest");
        for (let i = 0; i < 10; i++) {
            ui = await app.userInfo(accounts[i]);
            let units = parseInt(ui['units']);
            u += units;
            console.log(`UI ${i}:`,units,parseInt(ui['amount']));
        }
        console.log("total units:",u);
    });

    it("final harvest", async() => {
        console.log("Harvest....")
        tx = await app.harvest(OWNER_ADDR);
    });

    it("final balance check", async() => {
        let u = 0;
        console.log("After Harvest");
        for (let i = 0; i < 10; i++) {            
            ui = await app.userInfo(accounts[i]);
            let units = parseInt(ui['units']);
            u += units;
            console.log(`UI ${i}:`,units,parseInt(ui['amount']));
        }
        console.log("total units:",u);
    });
});