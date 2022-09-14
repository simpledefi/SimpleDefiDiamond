/* eslint-disable prefer-const */
/* global artifacts */

const Diamond = artifacts.require('Diamond')
const DiamondCutFacet = artifacts.require('DiamondCutFacet')
const DiamondLoupeFacet = artifacts.require('DiamondLoupeFacet')
const OwnershipFacet = artifacts.require('OwnershipFacet')
const DiamondFactory = artifacts.require("DiamondFactory")
let GOD_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e";

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2
}

function getSelectors (contract, output=false) {
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
  
  // let DCF = await DiamondCutFacet.at("0x8Fd91daBC584c75b644489F4Fd7e6a9a6A374B5d")
  // let DLF = await DiamondLoupeFacet.at("0x2e1158c658471e8e29B988AC39890ea8A6a2C4fc")
  // let DOF = await OwnershipFacet.at("0x9c6d8180990641301eae0e6cd7658403179240b6")
  
  // const diamondCut = [
  //   [DCF.address, FacetCutAction.Add, getSelectors(DCF)],
  //   [DLF.address, FacetCutAction.Add, getSelectors(DLF)],
  //   [DOF.address, FacetCutAction.Add, getSelectors(DOF)],
  // ]
  // console.log("Deployed most");
  // console.log(JSON.stringify(diamondCut));

  // await deployer.deploy(Diamond, diamondCut, [GOD_ADDR])

  await deployer.deploy(DiamondCutFacet, {from: GOD_ADDR})
  await deployer.deploy(DiamondLoupeFacet, {from: GOD_ADDR})
  await deployer.deploy(OwnershipFacet, {from: GOD_ADDR}).then(async () => {
    console.log("DEPLOYING DIAMOND")
    const diamondCut = [
      [DiamondCutFacet.address, FacetCutAction.Add, getSelectors(DiamondCutFacet)],
      [DiamondLoupeFacet.address, FacetCutAction.Add, getSelectors(DiamondLoupeFacet)],
      [OwnershipFacet.address, FacetCutAction.Add, getSelectors(OwnershipFacet)],
    ]
    let dp = await deployer.deploy(Diamond, diamondCut, [GOD_ADDR], {from: GOD_ADDR})
    return dp
  })
}
