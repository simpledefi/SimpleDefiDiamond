const sdInitialize = artifacts.require("sdInitialize")
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
    console.log("sdInitialize");
    await deployer.deploy(sdInitialize, {from: GOD_ADDR});

    let diamond = await Diamond.deployed()
    // let diamond = {address: "0xc296440aCA127746e8034425C409d8339B51E220"}

    console.log("DIAOMOND ADDRESS: " + diamond.address)
    let diamondCutFacet = new web3.eth.Contract(DiamondCutFacet.abi, diamond.address)
    let sdFacet = await sdInitialize.deployed()

    let selectors = await getSelectors(sdFacet)
    console.log(JSON.stringify(selectors))

    await diamondCutFacet.methods
      .diamondCut([[sdFacet.address, FacetCutAction.Add, selectors]], zeroAddress, '0x')
      .send({ from: GOD_ADDR, gas: 1000000 })

}  