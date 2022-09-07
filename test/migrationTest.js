const { config } = require('dotenv');
const { assert } = require('console');
const fs = require("fs");
const truffleAssert = require('truffle-assertions');
const App = require("./class")
const { exec } = require("child_process");

// const { artifacts } = require('hardhat');
const DiamondFactory = artifacts.require('DiamondFactory')
const sdData = artifacts.require("sdData")
const PF_ADDR = "0x4317A95c5f46527d87fD5AC93Fbc16F4B9580CA3"
 
const delay = ms => new Promise(res => setTimeout(res, ms));
const _salt = function() {return  (Math.random()*1e18).toString();};

function deploy() {
    this.execCommand = function () {
        return new Promise((resolve,reject)=>{
            exec("truffle deploy --f 6 --to 6",{cwd: "/mnt/src/crypto/combine_pools"},(e,o,ste)=>
                {
                    if (e) {
                        console.log(e);
                        reject(e);
                        return
                    }
                    // console.log(o);
                    resolve(o);
                    return o;
                });     
        });
    }
}

async function getLPBalance(pid, addr) {
    let abi = JSON.parse(fs.readFileSync("abi/MasterChefV2.json"));
    let c = new web3.eth.Contract(abi,"0xa5f8c5dbd5f286960b9d90548680ae5ebff07652");
    let rv = await c.methods.userInfo(pid,addr).call();
    console.log("BAL:",addr,rv);
}

contract('simpleDefi', accounts => {

    let HARVEST_ADDR = "0x6492830c2292381CcF3D439ea70a2Bfbc1a52cd9";
    let OWNER_ADDR = "0x42a515c1EDB651F4c69c56E05578D2805D6451eB";
    let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";
    let DEPLOY_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e";

    let exchange, pool_ID;
    let app;
    let bal0, bal1, bal2;
    let deposit_amount = 1;
    let contract;
    let dir = "/mnt/src/crypto/combine_pools"
    let src_contract = "0x8C180Ff5c26129c6B1AaAd8eb820255D54bcB817";
    let dst_contract;

    it(`set GOD_USER to ${OWNER_ADDR}`, async() => {
        let bc_abi = JSON.parse(fs.readFileSync(dir + "/abi/combine_beacon.json","utf8"))['abi'];
        let bc = new web3.eth.Contract(bc_abi,"0x8422d0922d3bde86a8A96461Bcd3c301b8588860"); //beta
        await bc.methods.setAddress("GODUSER",OWNER_ADDR).send({from: DEPLOY_ADDR});

    });

    it('should deploy combineApp with initial Contracts', async () => {
        await web3.eth.sendTransaction({to:OWNER_ADDR, from:accounts[0], value:web3.utils.toWei("100", "ether")});
        let diamondFactory = await DiamondFactory.deployed()
        pool_ID = 2;
        exchange = 'PANCAKESWAP'
        let tx = await diamondFactory.initialize(pool_ID,exchange,1,_salt(),{from: accounts[0]})
        app = new App(tx,OWNER_ADDR,web3);
    
        dst_contract = await app.address();
        console.log("Dst Address:", dst_contract);

        bal0 = await web3.eth.getBalance(accounts[2]);
        console.log("Balance 0:", bal0);
        id = await app.iData();
        console.log(JSON.stringify(id));
    });

    it('deploy new migration contract', async() => {
        //exec("truffle deploy --f 6 --to 6",cwd="../combine_pools",(e,o,ste)=>{console.log(e,o,ste);});
        console.log("Deploy migrate contract");
        var d = new deploy();
        let rv = await d.execCommand();
        console.log("rv:",rv);

        let rx = /\ntransferLP: (.*)\n/g;
        let arr = rx.exec(rv);
        contract = arr[1].trim();
        console.log("Found:", contract);
        console.log("After second deploy");
    });    

    it("update target contract with migrator", async() => {
        console.log("update beacon");
        let bc_abi = JSON.parse(fs.readFileSync(dir + "/abi/combine_beacon.json","utf8"))['abi'];
        let bc = new web3.eth.Contract(bc_abi,"0x8422d0922d3bde86a8A96461Bcd3c301b8588860"); //beta
        await bc.methods.setExchange("RECOVERY",contract,0).send({from: DEPLOY_ADDR});

        console.log("update target contract:", src_contract);
        let pr_abi = JSON.parse(fs.readFileSync(dir + "/abi/combine_proxy.json","utf8"))['abi'];
        let pr = new web3.eth.Contract(pr_abi,src_contract);
        await pr.methods.setExchange("RECOVERY").send({from: DEPLOY_ADDR})        
    });

    it ("test migration", async() => {
        console.log("perform migration:", src_contract);
        let sd_abi = JSON.parse(fs.readFileSync(dir + "/abi/dumpContract.json","utf8"))['abi'];
        let sd = new web3.eth.Contract(sd_abi,src_contract);
        console.log("Migrating", src_contract, "to:", dst_contract);
        await getLPBalance(pool_ID,src_contract);
        
        await sd.methods.dump(dst_contract,false).send({from: OWNER_ADDR,gas:9000000});

        await getLPBalance(pool_ID,src_contract);
        await getLPBalance(pool_ID,dst_contract);
        
    });


    it("test harvest function", async() => {
        await app.harvest(OWNER_ADDR);
        console.log("DONE MIGRATION TEST")
    });


    it("Should handle deposit", async() => {
        console.log("Before UserInfo:",accounts[3]);
        // let userinfo = await debug(app.userInfo(accounts[3]));
        let userinfo = await app.userInfo(accounts[3]);
        console.log("After UserInfo");
        console.log(JSON.stringify(userinfo));
        assert(userinfo[0] == 0, "Initial value should be 0");
        await app.deposit(accounts[3],10);
        console.log("After Deposit");

        userinfo = await app.userInfo(accounts[3]);
        console.log(JSON.stringify(userinfo));

        console.log(JSON.stringify(await app.iData()));
        assert(userinfo[0] > 0, "Initial value should not be 0");
    });

    it("Should handle harvest", async() => {
        let pid = await app.iData();
        console.log("new updated pool ID:",parseInt(pid['poolId']));
        for(let i=0; i<10; i++) {
            console.log("Updating ",i)
            await app.updatePool(parseInt(pid['poolId']));
        }

        let pc = await app.pendingReward();
        console.log("PC:", pc.toString());
        // assert(pc != 0, "Pending Cake should not be 0");

        let fee0 = await web3.eth.getBalance(HARVEST_ADDR);

        console.log("Before Harvest");
        try {
            tx = await app.harvest(OWNER_ADDR); //.call({from: accounts[3]});            
            // app.dumpLogs(tx);
            let fee1 = await web3.eth.getBalance(HARVEST_ADDR);
            console.log("Fees:",fee0,fee1);
            assert(fee1 > fee0, "Fee balance should have increased");
        } catch (error) {
            console.log(error);
            console.log("No pending cake");
        }
        // console.log("After Harvest\n",rv);

        pc = await app.pendingReward();
        assert(pc == 0, "After Harvest Pending Cake should be 0 showing: " + pc.toString());

    });

    it("Should NOT clear out cake after deposit", async() => {
        let pid = await app.iData()
        await app.updatePool(parseInt(pid['poolId']));
        await app.updatePool(parseInt(pid['poolId']));

        let pc0 = await app.pendingReward();
        console.log("PC0", pc0.toString());
        await app.deposit(accounts[3],10);

        let pc1 = await app.pendingReward();
        console.log("PC1", pc1.toString());
        assert(parseInt(pc1.toString()) > parseInt(pc0.toString()), `Pending cake cleared out ${pc1} ${pc0}`);
    });


    it("Should allow deposit from second user", async() => {
        await app.deposit( accounts[1],10);
        await app.audit("After Deposit from 2nd user");
    });

    // it("Test Harvest with 2 users", async() => {
    //     let userinfo0_0 = await app.userInfo(accounts[3]);
    //     let userinfo1_0 = await app.userInfo(accounts[1]);
    //     let pid = await app.iData()
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.updatePool(parseInt(pid['poolId']));
    //     let pc0 = await app.pendingReward();
    //     console.log("PC0 - harvest:", pc0.toString());
    //     await app.harvest(OWNER_ADDR);
    //     let userinfo0_1 = await app.userInfo(accounts[3]);
    //     let userinfo1_1 = await app.userInfo(accounts[1]);

    //     console.log(accounts[3], JSON.stringify(userinfo0_0));
    //     console.log(accounts[3], JSON.stringify(userinfo0_1));
    //     console.log(accounts[1], JSON.stringify(userinfo1_0));
    //     console.log(accounts[1], JSON.stringify(userinfo1_1));

    //     await app.audit("Test Harvest with 2 users");
    // });

    // it("Should allow liquidation of user 2", async() => {
    //     let pid = await app.iData()

    //     for( let i = 0; i < 10; i++) 
    //         await app.updatePool(parseInt(pid['poolId']));
    
    //     console.log("Waiting for timelock");
    //     await delay(15000);
    //     await app.audit("before liquidation");
    //     await app.liquidate(accounts[1]);
    //     await app.audit("after liquidation");
    //     let pr = await app.getPendingReward();
    //     console.log("Pending Reward:",JSON.stringify(pr))

    // });


    // it("Should liquidate user 0", async() => {
    //     let userinfo0_0 = await app.userInfo(accounts[3]);
    //     console.log("\nSLU0:",accounts[3], JSON.stringify(userinfo0_0));


    //     await app.audit("Liquidate 0");

    //     await app.liquidate(accounts[3]);

    //     await app.audit("Liquidate 1");
    //     let pid = await app.iData()
        
    //     for(let i = 0; i < 11; i++) 
    //         await app.updatePool(parseInt(pid['poolId']));  

    //     console.log("after updatepool");
    //     await app.harvest(OWNER_ADDR);
    //     await app.audit("Liquidate After Harvest");

    // });

    // it("should deposit on 10 accounts", async () => {
    //     for (let i = 0; i < 10; i++) {
    //         //get random amount between 1 and 200
    //         // let pos = Math.floor(Math.random()*10);
    //         let _amt = Math.floor(Math.random() * 100) + 1;
    //         let _dec = Math.floor(Math.random() * 5) + 1
    //         // console.log("Deposit:", accounts[i], app.amt(_amt,_dec+13)/1e18);
    //         await app.deposit(accounts[i], _amt);
    //     }
    //     console.log("Waiting for timelock");
    //     await delay(15000);

    //     let userinfo0_1 = await app.userInfo(accounts[1]);
    //     console.log(accounts[3], JSON.stringify(userinfo0_1));
    //     await app.harvest(OWNER_ADDR);
    //     await app.audit("Deposit 10 accounts");

    // });

    // it("Should allocate next harvest to all users", async() => {
    //     let pid = await app.iData();
    //     for (let i = 0; i < 10; i++) 
    //         await app.updatePool(parseInt(pid['poolId']));

    //     await app.harvest(OWNER_ADDR);
    //     await app.audit("Allocate next harvest to all users");
    // });


    // it("Should update a bunch of blocks, and liquidate a user in the middle",async () => {
    //     console.log("Waiting for timelock");
    //     await delay(15000);
    //     let pid = await app.iData();

    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.updatePool(parseInt(pid['poolId']));        
    //     await app.liquidate(accounts[5]);
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.deposit(accounts[1],12);
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.liquidate(accounts[6]);
        
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.deposit(accounts[3],12);
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.liquidate({from: accounts[7]});
        
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.updatePool(parseInt(pid['poolId']));
    //     await app.audit(app,"Before Harvest");
    //     await app.harvest(OWNER_ADDR);
    //     await app.audit(app,"Update a bunch of blocks, and liquidate a user in the middle");
    // });

    // it("should try to liquidate an account that doesn't exist", async () => {
    //     try {
    //         let receipt = await app.liquidate(accounts[5]);        
    //         console.log("Liquidate:", receipt);
    //     } catch (e) {
    //         assert(check_revert(e,"sdNoLiquidity()"), "No Liquidity");
    //     }
    // });

    // it("Should check audit info", async () => {
    //     // assert(auditinfo[0].toString() == auditinfo[1].toString(),"totals should be equal")
    //     await app.harvest(OWNER_ADDR);
    //     await app.audit("Final Audit");
    // });

    // it("Should check pending Reward", async () => {
    //     let pr = await app.getPendingReward();
    //     console.log("Pending Reward:",JSON.stringify(pr))
    //     for (var account in accounts) {
    //         if (accounts[account].toUpperCase() == OWNER_ADDR.toUpperCase()) continue;
    //         try {
    //             // let pending = await app.pendingReward.call({from: accounts[account]});
    //             let pending = await app.pendingReward(accounts[account]);
    //             // console.log(account,"Pending Reward 1:", JSON.stringify(pending));
    //             console.log(account,accounts[account],pending);
    //         } catch(e) {
    //             console.log(e);
    //         }

    //     }
    // });

});


/*
abi = JSON.parse(fs.readFileSync("build/contracts/sdMigration.json"))['abi'];
addr = "0x9D5E793dcF936963eB8574Ec48F5242c062B3305";
c = new web3.eth.Contract(abi, addr);

await c.methods.migrateTo(accounts[1]).send({from: accounts[3]});


    msg: {
           data: hex'4ddaf8f20000000000000000000000002320738301305c892b01f44e4e9854a2d19ae19e',
           sig: 0x4ddaf8f2,
           sender: 0xD0153B7c79473eA931DaA5FDb25751d7534c4c3B,
           value: 0
         }
   this: 0x9D5E793dcF936963eB8574Ec48F5242c062B3305 (Diamond)


    msg: {
           data: hex'4ddaf8f20000000000000000000000008c180ff5c26129c6b1aaad8eb820255d54bcb817',
           sig: 0x4ddaf8f2,
           sender: 0x42a515c1EDB651F4c69c56E05578D2805D6451eB,
           value: 0
         }
    this: 0x8C180Ff5c26129c6B1AaAd8eb820255D54bcB817 of unknown class


*/