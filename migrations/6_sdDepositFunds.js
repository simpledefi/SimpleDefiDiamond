const sdDepositFunds = artifacts.require("sdDepositFunds")
const sdPoolUtil = artifacts.require("sdPoolUtil")


const Diamond = artifacts.require('Diamond')
const DiamondCutFacet = artifacts.require('DiamondCutFacet')
const zeroAddress = '0x0000000000000000000000000000000000000000'
let GOD_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e";

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
    // let dep = await sdPoolUtil.deployed();
    // if (!dep) {
    //     await deployer.deploy(sdPoolUtil), {from: GOD_ADDR};
    //     dep = await sdPoolUtil.deployed();
    // }

    // await deployer.link(dep, sdDepositFunds);
    // await deployer.deploy(sdDepositFunds, {from: GOD_ADDR});    

    // let diamond = await Diamond.deployed()
    // let diamond = {address: "0xc296440aCA127746e8034425C409d8339B51E220"} //staging
    let diamond = {address: "0xfc74d0202702eead690f7e7e8f58f432f01d9bcf"} //beta

    console.log("DIAOMOND ADDRESS: " + diamond.address)
    let diamondCutFacet = new web3.eth.Contract(DiamondCutFacet.abi, diamond.address)

    // let sdFacet = await sdDepositFunds.deployed()
    let sdFacet = await sdDepositFunds.at("0x9c74051c48F82BF2526B1Cc94aaB2BE984EA974F");
    let selectors = await getSelectors(sdDepositFunds)
    console.log(sdFacet.address, JSON.stringify(selectors))

    await diamondCutFacet.methods
      .diamondCut([[sdFacet.address, FacetCutAction.Add, selectors]], zeroAddress, '0x')
      .send({ from: GOD_ADDR, gas: 1000000 })


}  