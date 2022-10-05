const fs = require("fs");
const Diamond = artifacts.require('Diamond')
// let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";
// let BEACON_ADDR = "0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2"; //stage
let BEACON_ADDR = "0x500fad360BC10ec706974b999b5f0D615C59fEb7"; //beta

// let BEACON_ABI = [{"inputs": [{"internalType": "string","name": "_exchange","type": "string"},{"internalType": "address","name": "_replacement_logic_contract","type": "address"},{"internalType": "uint256","name": "_start","type": "uint256"}],"name": "setExchange","outputs": [],"stateMutability": "nonpayable","type": "function"}];
let BEACON_ABI = JSON.parse(fs.readFileSync("../../combine_pools/abi/combine_beacon.json","utf-8"))["abi"];
let CONTRACT_TYPE = "MULTIEXCHANGEPOOLED"; // "DIAMONDPOOLED"
let FEE_COLLECTOR = "0x42a515c1EDB651F4c69c56E05578D2805D6451eB";
let OWNER_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e"

function amt(val) {
    return  parseFloat(val).toFixed(18).replace(".","").toString();
}
  
  
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function(deployer, network, accounts) {

    let deployedDiamond = await Diamond.deployed()
    // let deployedDiamond ={address: "0xc296440aCA127746e8034425C409d8339B51E220"};    
    // let deployedDiamond = {address: "0xfc74d0202702eead690f7e7e8f58f432f01d9bcf"} //beta

    console.log("Setting MEP to " + deployedDiamond.address);
    let beacon = new web3.eth.Contract(BEACON_ABI,BEACON_ADDR)

    await beacon.methods.setExchange(CONTRACT_TYPE, deployedDiamond.address, 0).send({from: OWNER_ADDR,gas:150000})
    await beacon.methods.setAddress("GODUSER",OWNER_ADDR).send({from: OWNER_ADDR});
    await beacon.methods.setAddress("FEECOLLECTOR",FEE_COLLECTOR).send({from: OWNER_ADDR});
}


