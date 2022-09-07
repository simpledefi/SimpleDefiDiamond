/* eslint-disable prefer-const */
/* global artifacts */

const Diamond = artifacts.require('Diamond')
const DiamondCutFacet = artifacts.require('DiamondCutFacet')
const DiamondLoupeFacet = artifacts.require('DiamondLoupeFacet')
const OwnershipFacet = artifacts.require('OwnershipFacet')
const DiamondFactory = artifacts.require("DiamondFactory")

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
  await deployer.deploy(DiamondCutFacet)
  await deployer.deploy(DiamondLoupeFacet)

  await deployer.deploy(OwnershipFacet).then(async () => {
    const diamondCut = [
      [DiamondCutFacet.address, FacetCutAction.Add, getSelectors(DiamondCutFacet)],
      [DiamondLoupeFacet.address, FacetCutAction.Add, getSelectors(DiamondLoupeFacet)],
      [OwnershipFacet.address, FacetCutAction.Add, getSelectors(OwnershipFacet)],
    ]
    let dp = await deployer.deploy(Diamond, diamondCut, [accounts[0]])
    return dp
  })
}
