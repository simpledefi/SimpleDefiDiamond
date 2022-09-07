const sdDepositFunds = artifacts.require("sdDepositFunds")
const sdPoolUtil = artifacts.require("sdPoolUtil")


const Diamond = artifacts.require('Diamond')
const DiamondCutFacet = artifacts.require('DiamondCutFacet')
const zeroAddress = '0x0000000000000000000000000000000000000000'

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
    
module.exports = async function (deployer, network, accounts) {
    console.log("sdDepositFunds");
    let dep = await sdPoolUtil.deployed();
    if (!dep) {
        await deployer.deploy(sdPoolUtil);
        dep = await sdPoolUtil.deployed();
    }

    await deployer.link(dep, sdDepositFunds);
    await deployer.deploy(sdDepositFunds);    

    let diamond = await Diamond.deployed()
    console.log("DIAOMOND ADDRESS: " + diamond.address)
    let diamondCutFacet = new web3.eth.Contract(DiamondCutFacet.abi, diamond.address)
    let sdFacet = await sdDepositFunds.deployed()

    let selectors = await getSelectors(sdFacet)
    console.log(JSON.stringify(selectors))

    web3.eth.defaultAccount = accounts[0]
    await diamondCutFacet.methods
      .diamondCut([[sdFacet.address, FacetCutAction.Add, selectors]], zeroAddress, '0x')
      .send({ from: web3.eth.defaultAccount, gas: 1000000 })


}  