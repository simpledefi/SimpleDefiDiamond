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
    // let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";
    let BEACON_ADDR = "0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2";


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


    it("Set Discount", async () => {
        // let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";
        let BEACON_ADDR = "0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2";

        let ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e";
        let BEACON_ABI = JSON.parse(fs.readFileSync("../combine_pools/abi/combine_beacon.json","utf-8"))["abi"];
        let beacon = new web3.eth.Contract(BEACON_ABI,BEACON_ADDR)
                
        await beacon.methods.setDiscount(accounts[1], app.amt(50), 0).send({from: ADDR,gas:9000000});
        let discount = await beacon.methods.getDiscount(accounts[1]).call();
        console.log("Fee set: ", parseInt(discount[0])/1e18);
    });


    it('Deposit Into account', async () => {
        await app.deposit(accounts[0],1250);
        await app.deposit(accounts[1],1250);
        await app.harvest(OWNER_ADDR); //accounts[0]});
        let pid = await app.iData();
    
        for(let i = 0; i<50; i++) 
            await app.updatePool(parseInt(pid['poolId']));
    
        await app.resetGas(OWNER_ADDR);

        let result = await app.harvest(OWNER_ADDR); //accounts[0]});
        fs.writeFileSync("/tmp/result.json", (JSON.stringify(result)));

        let fees = await app.findLog(result, "distContrib_evt");
        for (let fee in fees) {
            let item = fees[fee];
            console.log(item._to_, item._feeAmount);
        }

    });    


    // it ('should assign multiple addresses to the discounts', async () => {
    //     let ary = [
    //         [accounts[2], amt(50),0],
    //         [accounts[3], amt(50),0],
    //         [accounts[4], amt(50),0]
    //     ];

    //     let beacon = await beaconApp.deployed();
    //     await beacon.setDiscountArray(ary, {from: OWNER_ADDR});

    // });
});

/*
 a = JSON.parse(fs.readFileSync("/tmp/result.json","utf-8"));
*/