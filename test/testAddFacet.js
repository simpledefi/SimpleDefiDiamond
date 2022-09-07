const { config } = require('dotenv');
const { assert } = require('console');
const fs = require("fs");
const truffleAssert = require('truffle-assertions');
const App = require("./class")

// const { artifacts } = require('hardhat');
const DiamondFactory = artifacts.require('DiamondFactory')
const TestFacet = artifacts.require("testFacet");
const PF_ADDR = "0x4317A95c5f46527d87fD5AC93Fbc16F4B9580CA3"
 
const delay = ms => new Promise(res => setTimeout(res, ms));
const _salt = function() {return  (Math.random()*1e18).toString();};

const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2
  }

async function  getSelectors (contract) {
    const selectors = contract.abi.reduce((acc, val) => {
        if (val.type === 'function') {
        acc.push(val.signature)
        return acc
        } else {
        return acc
        }
    }, [])
    return selectors
}



contract('simpleDefi', accounts => {
    let HARVEST_ADDR = "0x6492830c2292381CcF3D439ea70a2Bfbc1a52cd9";
    let OWNER_ADDR = "0x42a515c1EDB651F4c69c56E05578D2805D6451eB";
    let GOD_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e"

    let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";

    let exchange, pool_ID;
    let app;
    let bal0, bal1, bal2;
    let deposit_amount = 1;
    let diamondFactory;

    it('should deploy combineApp with initial Contracts', async () => {
        await web3.eth.sendTransaction({to:OWNER_ADDR, from:accounts[0], value:web3.utils.toWei("100", "ether")});
        diamondFactory = await DiamondFactory.deployed()
    
        pool_ID = 2;
        exchange = 'PANCAKESWAP'
        let tx = await diamondFactory.initialize(pool_ID,exchange,1,_salt(),{from: accounts[0]})
        app = new App(tx,OWNER_ADDR,web3);
    
        bal0 = await web3.eth.getBalance(accounts[2]);
        console.log("Balance 0:", bal0);
        id = await app.iData();
        console.log(JSON.stringify(id));
    });

    it("reject attempt to upgrade diamond from regular account",async() => {
        let sdFacet = await TestFacet.deployed();
        let selectors = await getSelectors(sdFacet);
        try {
            await diamondFactory.updateFacets([[sdFacet.address, FacetCutAction.Add, selectors]],{ from: OWNER_ADDR, gas: 1000000 });
            assert("Allowed update");
        }
        catch(e) {
            console.log("Blocked call");
        }
                
    })

    it("Add facet to existing diamond", async () => {        
        let sdFacet = await TestFacet.deployed();
        let selectors = await getSelectors(sdFacet);

        await diamondFactory.updateFacets([[sdFacet.address, FacetCutAction.Add, selectors]],{ from: GOD_ADDR, gas: 1000000 });
          
    });

    it("Test new facet to ensure it's there",  async()=>{
        const abi = JSON.parse('[{"inputs": [],"name": "testFunction","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "view","type": "function"}]');
        const c = new web3.eth.Contract(abi, await app.address());
        let val =  await c.methods.testFunction().call();
        console.log("GOD:",val);
    });
});