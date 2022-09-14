const Diamond = artifacts.require('Diamond')
const OwnershipFacet = artifacts.require('OwnershipFacet')
const DiamondFactory = artifacts.require("DiamondFactory")
let GOD_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e";

module.exports = async function (deployer, network, accounts) {
    let deployedDiamond = await Diamond.deployed()
    // let deployedDiamond = {address:"0xc296440aCA127746e8034425C409d8339B51E220"};
    let FACTORY = await DiamondFactory.deployed();
    // let FACTORY = {address: '0xf630a8FcD389d12126fb3C99CFea8cD39Ec08566'}
    console.log("DEPLOYED FACTORY ADDRESS:", FACTORY.address);
  
    console.log("Setting ownership to factory @",deployedDiamond.address);
    let of = await OwnershipFacet.at(deployedDiamond.address);
    await of.transferOwnership(web3.utils.toChecksumAddress(FACTORY.address),{from: GOD_ADDR});
}