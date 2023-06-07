// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/DiamondFactory.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract deployDiamondFactoryScript is Script {
    address _beacon = 0x500fad360BC10ec706974b999b5f0D615C59fEb7; // beta beacon
    //address beacon = 0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2; // staging beacon
    address _godUser = 0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e;
    address _adminUser = 0x42a515c1EDB651F4c69c56E05578D2805D6451eB;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("privateKey");
        vm.startBroadcast(deployerPrivateKey);

        DiamondFactory df = new DiamondFactory(_beacon,_godUser,_adminUser);
        console.log(address(df));
        vm.stopBroadcast();
        verifyContract("DiamondFactory",address(df));
    }


    function verifyContract(string memory _facetName, address _addr) internal  {
        console.log("Verify:",_facetName,_addr);
        string [] memory cmd = new string[](8);
        cmd[0] = "forge";
        cmd[1] = "verify-contract";
        cmd[2] = Strings.toHexString(uint160(_addr), 20);        
        cmd[3] = _facetName;
        cmd[4] = "-e";
        cmd[5] = vm.envString("BSCSCANAPIKEY");
        cmd[6] = "--chain 56";
        cmd[7] = "--constructor-args 000000000000000000000000500fad360bc10ec706974b999b5f0d615c59feb70000000000000000000000000e0435b1ab9b9dcddff2119623e25be63ef5cb6e00000000000000000000000042a515c1edb651f4c69c56e05578d2805d6451eb";

        for(uint i=0;i<cmd.length;i++)
            console.log(i,cmd[i]);

        bytes memory res = vm.ffi(cmd);
        console.log(string(res));
    }

}
