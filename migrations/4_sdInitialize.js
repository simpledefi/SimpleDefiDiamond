const sdInitialize = artifacts.require("sdInitialize")
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
    console.log("sdInitialize");
    await deployer.deploy(sdInitialize);

    let diamond = await Diamond.deployed()
    console.log("DIAOMOND ADDRESS: " + diamond.address)
    let diamondCutFacet = new web3.eth.Contract(DiamondCutFacet.abi, diamond.address)
    let sdFacet = await sdInitialize.deployed()

    let selectors = await getSelectors(sdFacet)
    console.log(JSON.stringify(selectors))

    web3.eth.defaultAccount = accounts[0]
    await diamondCutFacet.methods
      .diamondCut([[sdFacet.address, FacetCutAction.Add, selectors]], zeroAddress, '0x')
      .send({ from: web3.eth.defaultAccount, gas: 1000000 })

}  