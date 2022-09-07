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

let initial_balance = 0;
let t0 = new web3.eth.Contract(minABI, "0x6b23C89196DeB721e6Fd9726E6C76E4810a464bc");
let t1 = new web3.eth.Contract(minABI, "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d");

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

    it('Initial Deposit', async () => {
        tx = await app.deposit(accounts[1], 2500);

        // await app.harvest({from: HARVEST_ADDR});

        // tx = await app.deposit({ value: amt(1500),from: accounts[2] });
        // units = await (app.userInfo(accounts[1]));
        // console.log("Units 1:",JSON.stringify(units));
        // await delay(15000);
        // tx = await app.liquidate({from: accounts[1]});
        // dumpLogs(tx);
        // await app.harvest({from: HARVEST_ADDR}); //accounts[0]});

        // units = await (app.userInfo(accounts[2]));
        // console.log("Units 2:",JSON.stringify(units));

        // app = await simpleDefi.at("0x187C76eCc2e59e065deDf40a227f6d4e85d009dD");
        // initial_balance = await web3.eth.getBalance(accounts[1]);
        // console.log("Balance 0:", initial_balance);
        // a0 = await t0.methods.balanceOf(app.address).call();
        // a1 = await t1.methods.balanceOf(app.address).call();
        // console.log("TOKEN BALANCE:",a0,a1);
        // var beacon = await beaconApp.deployed();
        // HARVEST_ADDR = await beacon.getAddress("HARVESTER");
        // console.log("HARVEST_ADDR:",HARVEST_ADDR);
    });    


    // it("Should handle deposit", async() => {
    //     console.log("Before UserInfo:",accounts[1]);
    //     // let userinfo = await debug(app.userInfo(accounts[1]));
    //     let userinfo = await app.userInfo(accounts[1]);
    //     console.log("After UserInfo");
    //     console.log(JSON.stringify(userinfo));
    //     // assert(userinfo[0] == 0, "Initial value should be 0");
    //     tx = await app.deposit({ value: amt(2500),from: accounts[1] });
    //     dumpLogs(tx);
    //     console.log("Balance 1:", await web3.eth.getBalance(accounts[1]));
    //     console.log("After Deposit");
    //     units = await app.userInfo(accounts[1]);
    //     console.log("Units:",parseInt(units));
    //     userinfo = await app.userInfo(accounts[1]);        
    //     console.log(JSON.stringify(userinfo));
    //     // userinfo = await debug(app.userInfo2(accounts[1]));
    //     // dumpLogs(userinfo)
    //     // userinfo = await app.userInfoFlip(accounts[1]);
    //     // console.log(JSON.stringify(await app.iData()));
    //     // a0 = await t0.methods.balanceOf(app.address).call();
    //     // a1 = await t1.methods.balanceOf(app.address).call();
    //     // console.log("TOKEN BALANCE:",a0,a1);
    //     // tx = await app.deposit({ value: amt(2500),from: accounts[1] });

    // });

    it ("Should Harvest",async() => {
        for( let i = 0; i < 10; i++) 
            console.log("UPDATING:",i);
            let pid = await app.iData();

            await app.updatePool(parseInt(pid['poolId']));

            await delay(2000);

        tx = await app.harvest(OWNER_ADDR);
        console.log("Harvest:",tx.tx);
        rw = await app.userInfo(accounts[1])
        console.log("Accumulated Rewards:",parseInt(rw[4]));
    });


    // it ("Should Harvest",async() => {
    //     for( let i = 0; i < 20; i++) 
    //         console.log("UPDATING:",i);
    //         let pid = await app.iData();

    //         await updatePool(parseInt(pid['poolId']));

    //         await delay(4000);

    //     await app.resetGas();
    //     tx = await app.harvest({from: HARVEST_ADDR});
    //     dumpLogs(tx);
    //     console.log("Harvest:",tx.tx);
    //     rw = await app.userInfo(accounts[1])
    //     console.log("Accumulated Rewards:",parseInt(rw[4]));
    // });


    // it("Should allow liquidation of user 2", async() => {
    //     let pid = await app.iData();
    //     for( let i = 0; i < 10; i++) 
    //         await updatePool(parseInt(pid['poolId']));
    //     console.log("Waiting for timelock");
    //     await delay(15000);
    //     await audit(app,"before liquidation");
    //     tx = await app.liquidate({from: accounts[1]});
    //     // tx = await app.performLiquidation(accounts[1],true,{from: accounts[1]});
    //     await audit(app,"after liquidation");
    //     findLog(tx,"sdFeeSent");
    //     findLog(tx,"sdLiquidated");
    //     findLog(tx,"Swap");
    //     let final_balance = await web3.eth.getBalance(accounts[1]);
    //     console.log("Balance 2:", final_balance);
    //     console.log("Diff:", (initial_balance - final_balance)/1e18);
        
    // });

    // // it("Should rescue tokens", async() => {
    // //     a0 = await t0.methods.balanceOf(app.address).call();
    // //     a1 = await t1.methods.balanceOf(app.address).call();
    // //     console.log(a0,a1);

    // //     if (a0>0) await app.rescueToken("0x6b23C89196DeB721e6Fd9726E6C76E4810a464bc",accounts[1],a0,{from: accounts[0]});
    // //     if (a1>0) await app.rescueToken("0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",accounts[1],a1,{from: accounts[0]});
    // // });

});