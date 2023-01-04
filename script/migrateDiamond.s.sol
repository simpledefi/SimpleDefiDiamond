// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../src/DiamondFactory.sol";

contract migrateFactoryScript is Script {
    address constant owner = 0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e;

    address _from = 0xaBe79Ec7712804b5957088600f73648E8AB76dd4;
    address _to = 0xe45f5313e71fb81347b99e491A8d09EBe22A38fC;
    
    address[] contracts;
    
    function run() external {

        uint256 deployerPrivateKey = vm.envUint("privateKey");

        uint i = 0;
        while(1==1) {
            try  DiamondFactory(_from).proxyContracts(owner,i) returns (address _result) {
                console.log(i, _result);
                contracts.push(_result);
                i++;
            }
            catch {
                break;
            }
        }
        console.log("Contracts:", contracts.length);
    
        vm.broadcast(deployerPrivateKey);
        DiamondFactory(_from).addProxyArray(contracts, owner);
    }
}