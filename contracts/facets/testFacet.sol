//SPDX-License-Identifier: MIT-open-group
pragma solidity ^0.8.7;

import "../interfaces/AppStorage.sol";
import "../interfaces/Interfaces.sol";
import "../libraries/LibDiamond.sol";

///@title simpleDefi.sol
///@author Derrick Bradbury (derrickb@halex.com)
///@notice Common simpleDefi functions not specific to pool/solo contracts
contract testFacet {
    AppStorage internal s;

    function testFunction() public view returns (bool) {
        return (s.godUsers[msg.sender]);
    }
}    
