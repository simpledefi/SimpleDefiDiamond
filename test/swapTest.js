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
    let exchange, pool_ID, n_pool_ID
    let app
    let app2

    it('should deploy combineApp with initial Contracts', async () => {
        await web3.eth.sendTransaction({to:OWNER_ADDR, from:accounts[0], value:web3.utils.toWei("100", "ether")});
        let diamondFactory = await DiamondFactory.deployed()
        // console.log(web3.currentProvider);        
        // exchange = "PANCAKESWAP";
        // pool_ID = 2;
        pool_ID = 93;
        exchange = 'PANCAKESWAP';
        let tx = await diamondFactory.initialize(pool_ID,exchange,1,_salt(),{from: accounts[0]})
        app2 = new App(tx,OWNER_ADDR,web3);
        let addr = await app2.address();
        console.log(`Address 2: ${addr}`);
    

        n_pool_ID = 2;
        let n_exchange = 'PANCAKESWAP'
        let tx2 = await diamondFactory.initialize(n_pool_ID,n_exchange,1,_salt(),{from: accounts[0]})
        app = new App(tx2,OWNER_ADDR,web3);
        addr = await app.address();
        console.log(`Address 1: ${addr}`);

        console.log("Done deploy")
     });    

    it("Should set the pool ID", async() => {
        let id = await app.iData();
        console.log("ID:",id['poolId']);
        
        let id2 = await app2.iData();
        console.log("ID:",id2['poolId']);
    });

    it('Initial deposit', async () => {
        console.log("Executing deposit");
        await app.deposit(accounts[5],5);
        // await app2.deposit(accounts[1],1);
    });

    it('Swap Pools', async () => {

        console.log("Waiting for timelock");
        await delay(15000);

        await app.updatePool(n_pool_ID);
        await app.updatePool(n_pool_ID);
        await app.updatePool(n_pool_ID);
        await app.updatePool(n_pool_ID);
        let addr = await app2.address();
        console.log(`Swap to: ${addr}`);
        tx = await app.swapPool(accounts[5], addr);
        console.log("Done Swap");
        await app.dumpLogs(tx);

        await app2.updatePool(pool_ID);
        await app2.updatePool(pool_ID);
        // app2.deposit({ value: amt(1) });

        console.log("Before UserInfo:",accounts[5]);
        let userinfo2 = await app2.userInfo(accounts[5],1);
        console.log("After Swap from app 2");
        console.log("App2:",JSON.stringify(userinfo2));
    });    


});