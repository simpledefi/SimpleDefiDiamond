const Diamond = artifacts.require('Diamond')
const OwnershipFacet = artifacts.require('OwnershipFacet')
const DiamondFactory = artifacts.require("DiamondFactory")

module.exports = async function (deployer, network, accounts) {
    let deployedDiamond = await Diamond.deployed()
    let FACTORY = await DiamondFactory.deployed();
    console.log("DEPLOYED FACTORY ADDRESS:", FACTORY.address);
  
    console.log("Setting ownership to factory @",deployedDiamond.address);
    let of = await OwnershipFacet.at(deployedDiamond.address);
    await of.transferOwnership(web3.utils.toChecksumAddress(FACTORY.address));
}