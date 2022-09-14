const { config } = require('dotenv');
const { assert } = require('console')
const truffleAssert = require('truffle-assertions');
const App = require("./class")

// const { artifacts } = require('hardhat');
const DiamondFactory = artifacts.require('DiamondFactory')

const ERC20 = artifacts.require("ERC20");

// const BEACON_ADDR = "0x00a890727D92AeaAC09B199Bd4a9FBc2E7D65644";
let BEACON_ADDR = "0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2";

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
        // let diamondFactory = await DiamondFactory.deployed()
        let diamondFactory = await DiamondFactory.at("0xf630a8FcD389d12126fb3C99CFea8cD39Ec08566")
        // console.log(web3.currentProvider);        
        // exchange = "PANCAKESWAP";
        // pool_ID = 2;
        pool_ID = 3;
        exchange = 'PANCAKESWAP';
        let tx = await diamondFactory.initialize(pool_ID,exchange,1,_salt(),{from: OWNER_ADDR})
        app2 = new App(tx,OWNER_ADDR,web3);
    

        n_pool_ID = 2;
        let n_exchange = 'PANCAKESWAP'
        let tx2 = await diamondFactory.initialize(n_pool_ID,n_exchange,1,_salt(),{from: OWNER_ADDR})
        app = new App(tx2,OWNER_ADDR,web3);

        console.log("Done deploy")
     });    

    it("Should set the pool ID", async() => {
        let id = await app.iData();
        console.log("ID:",id['poolId']);
        
        let id2 = await app2.iData();
        console.log("ID:",id2['poolId']);
        
        assert(pool_ID == parseInt(id['poolId']), "Initial Pool ID not 0: " + pool_ID);
    });

    it("Should not allow reinitialization", async() => {
        try {
            await app.initialize(3, BEACON_ADDR,  'PANCAKESWAP', accounts[0]);
            assert(false, "Allowed Reinitialization");
        } catch (e) {
             console.log("Blocked Reinitialization");
        }
    });

    it("Should restrict admin functions", async() => {
        try {
            await app.harvest({ from: accounts[3] });
            assert(1 == 2, "Harvest Function  should be restricted");
        } catch (e) {
            // console.log(e);
            assert(app.check_revert(e,"sdFunctionLocked()"), "Harvest function should be restricted");
        }
    });

    it ("Should allow admin to add a harvester",async() => {
        try{
            await app.addAdmin(accounts[0],OWNER_ADDR);
            await app.addAdmin(accounts[3],OWNER_ADDR);
        }
        catch(e) {
            console.log(e);
        }
    });

    it("Should handle deposit", async() => {
        console.log("Before UserInfo:",accounts[0]);
        // let userinfo = await debug(app.userInfo(accounts[0]));
        let userinfo = await app.userInfo(accounts[0]);
        console.log("After UserInfo");
        console.log(JSON.stringify(userinfo));
        assert(userinfo[0] == 0, "Initial value should be 0");
        await app.deposit(accounts[0],10);
        console.log("After Deposit");

        await app2.deposit(accounts[0],10);
        console.log("After Deposit2");

        userinfo = await app.userInfo(accounts[0]);
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
            tx = await app.harvest(accounts[0]); //.call({from: accounts[0]});            
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
        await app.deposit(accounts[0],10);

        let pc1 = await app.pendingReward();
        console.log("PC1", pc1.toString());
        assert(parseInt(pc1.toString()) > parseInt(pc0.toString()), `Pending cake cleared out ${pc1} ${pc0}`);
    });


    it("Should allow deposit from second user", async() => {
        await app.deposit( accounts[1],10);
        await app.audit("After Deposit from 2nd user");
    });

    it("Test Harvest with 2 users", async() => {
        let userinfo0_0 = await app.userInfo(accounts[0]);
        let userinfo1_0 = await app.userInfo(accounts[1]);
        let pid = await app.iData()
        await app.updatePool(parseInt(pid['poolId']));
        await app.updatePool(parseInt(pid['poolId']));
        let pc0 = await app.pendingReward();
        console.log("PC0 - harvest:", pc0.toString());
        await app.harvest(OWNER_ADDR);
        let userinfo0_1 = await app.userInfo(accounts[0]);
        let userinfo1_1 = await app.userInfo(accounts[1]);

        console.log(accounts[0], JSON.stringify(userinfo0_0));
        console.log(accounts[0], JSON.stringify(userinfo0_1));
        console.log(accounts[1], JSON.stringify(userinfo1_0));
        console.log(accounts[1], JSON.stringify(userinfo1_1));

        await app.audit("Test Harvest with 2 users");
    });

    it("Should allow liquidation of user 2", async() => {
        let pid = await app.iData()

        for( let i = 0; i < 10; i++) 
            await app.updatePool(parseInt(pid['poolId']));
    
        console.log("Waiting for timelock");
        await delay(15000);
        await app.audit("before liquidation");
        await app.liquidate(accounts[1]);
        await app.audit("after liquidation");
        let pr = await app.getPendingReward();
        console.log("Pending Reward:",JSON.stringify(pr))

    });


    it("Should liquidate user 0", async() => {
        let userinfo0_0 = await app.userInfo(accounts[0]);
        console.log("\nSLU0:",accounts[0], JSON.stringify(userinfo0_0));


        await app.audit("Liquidate 0");

        await app.liquidate(accounts[0]);

        await app.audit("Liquidate 1");
        let pid = await app.iData()
        
        for(let i = 0; i < 11; i++) 
            await app.updatePool(parseInt(pid['poolId']));  

        console.log("after updatepool");
        await app.harvest(OWNER_ADDR);
        await app.audit("Liquidate After Harvest");

    });

    it("should deposit on 10 accounts", async () => {
        for (let i = 0; i < 10; i++) {
            //get random amount between 1 and 200
            // let pos = Math.floor(Math.random()*10);
            let _amt = Math.floor(Math.random() * 100) + 1;
            let _dec = Math.floor(Math.random() * 5) + 1
            // console.log("Deposit:", accounts[i], app.amt(_amt,_dec+13)/1e18);
            await app.deposit(accounts[i], _amt);
        }
        console.log("Waiting for timelock");
        await delay(15000);

        let userinfo0_1 = await app.userInfo(accounts[1]);
        console.log(accounts[0], JSON.stringify(userinfo0_1));
        await app.harvest(OWNER_ADDR);
        await app.audit("Deposit 10 accounts");

    });

    it("Should allocate next harvest to all users", async() => {
        let pid = await app.iData();
        for (let i = 0; i < 10; i++) 
            await app.updatePool(parseInt(pid['poolId']));

        await app.harvest(OWNER_ADDR);
        await app.audit("Allocate next harvest to all users");
    });


    it("Should update a bunch of blocks, and liquidate a user in the middle",async () => {
        console.log("Waiting for timelock");
        await delay(15000);
        let pid = await app.iData();

        await app.updatePool(parseInt(pid['poolId']));
        await app.updatePool(parseInt(pid['poolId']));        
        await app.liquidate(accounts[5]);
        await app.updatePool(parseInt(pid['poolId']));
        await app.updatePool(parseInt(pid['poolId']));
        await app.deposit(accounts[1],12);
        await app.updatePool(parseInt(pid['poolId']));
        await app.liquidate(accounts[6]);
        
        await app.updatePool(parseInt(pid['poolId']));
        await app.deposit(accounts[3],12);
        await app.updatePool(parseInt(pid['poolId']));
        await app.updatePool(parseInt(pid['poolId']));
        await app.liquidate({from: accounts[7]});
        
        await app.updatePool(parseInt(pid['poolId']));
        await app.updatePool(parseInt(pid['poolId']));
        await app.audit(app,"Before Harvest");
        await app.harvest(OWNER_ADDR);
        await app.audit(app,"Update a bunch of blocks, and liquidate a user in the middle");
    });

    it("should try to liquidate an account that doesn't exist", async () => {
        try {
            let receipt = await app.liquidate(accounts[5]);        
            console.log("Liquidate:", receipt);
        } catch (e) {
            assert(check_revert(e,"sdNoLiquidity()"), "No Liquidity");
        }
    });

    it("Should check audit info", async () => {
        // assert(auditinfo[0].toString() == auditinfo[1].toString(),"totals should be equal")
        await app.harvest(OWNER_ADDR);
        await app.audit("Final Audit");
    });

    it("Should check pending Reward", async () => {
        let pr = await app.getPendingReward();
        console.log("Pending Reward:",JSON.stringify(pr))
        for (var account in accounts) {
            if (accounts[account].toUpperCase() == OWNER_ADDR.toUpperCase()) continue;
            try {
                // let pending = await app.pendingReward.call({from: accounts[account]});
                let pending = await app.pendingReward(accounts[account]);
                // console.log(account,"Pending Reward 1:", JSON.stringify(pending));
                console.log(account,accounts[account],pending);
            } catch(e) {
                console.log(e);
            }

        }
    });

    let swapID;
    it("display userinfo", async() => {
        for (i=0;i<10;i++) {
            console.log(`UserInfo ${i}:`,accounts[i]);
            let userinfo1 = await app.userInfo(accounts[i]);
            console.log(JSON.stringify(userinfo1),"\n");    
            if (userinfo1['amount'] != "0") swapID = i;
        }
    });


    it('Swap Pools', async () => {
        // swapID = 3;
        console.log("Before UserInfo:",accounts[swapID]);
        let userinfo1 = await app.userInfo(accounts[swapID]);
        console.log("After Swap from app 2");
        console.log("App2:",JSON.stringify(userinfo1));

        console.log("Waiting for timelock");
        await delay(15000);

        await app.updatePool(n_pool_ID);
        await app.updatePool(n_pool_ID);
        await app.updatePool(n_pool_ID);
        await app.updatePool(n_pool_ID);
        let addr = await app2.address();
        console.log(`Swap to: ${addr}`);
        tx = await app.swapPool(accounts[swapID], addr);
        console.log("Done Swap");
        await app.dumpLogs(tx);

        // await app2.updatePool(pool_ID);
        // await app2.updatePool(pool_ID);
        // // app2.deposit({ value: amt(1) });

        // console.log("Before UserInfo:",accounts[swapID]);
        // let userinfo2 =await  app2.userInfo(accounts[swapID],1);
        // console.log("After Swap from app 2");
        // console.log("App2:",JSON.stringify(userinfo2));
    });    

    // it("Should allow a system liquidation",async ()=>{
    //     let receipt = await app.system_liquidate();
    //     console.log(receipt);
    //     let auditinfo = await app.audit();
    //     console.log("AUDIT:",auditinfo[0].toString(),auditinfo[1].toString());
    //     console.log("AUDIT:",auditinfo[2].toString(),auditinfo[3].toString());
    //     assert(auditinfo[0].toString() == "0" && auditinfo[1].toString() == "0","totals should be 0")
    // });        

});