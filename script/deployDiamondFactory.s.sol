// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DiamondFactory.sol";

contract DeployScript is Script {
    address _beacon = 0x500fad360BC10ec706974b999b5f0D615C59fEb7;
    address _godUser = 0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e;
    address _adminUser = 0x42a515c1EDB651F4c69c56E05578D2805D6451eB;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("privateKey");
        vm.startBroadcast(deployerPrivateKey);

        DiamondFactory df = new DiamondFactory(_beacon,_godUser,_adminUser);

        vm.stopBroadcast();
    }
}