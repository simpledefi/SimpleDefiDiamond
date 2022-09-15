const DiamondFactory = artifacts.require('DiamondFactory')

module.exports = async function (deployer, network, accounts) {
    // let BEACON_ADDR = "0x8422d0922d3bde86a8A96461Bcd3c301b8588860";
    // let BEACON_ADDR = "0xd94d32a4a79ddE20CB7D58aBcEC697f20Ed0D3d2"; //staging
    let BEACON_ADDR = "0x500fad360BC10ec706974b999b5f0D615C59fEb7"; //beta 
    let GOD_ADDR = "0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e";
    let ADMIN_ADDR = "0x42a515c1EDB651F4c69c56E05578D2805D6451eB";

    await deployer.deploy(DiamondFactory, BEACON_ADDR, GOD_ADDR, ADMIN_ADDR, {from:GOD_ADDR, gas:67219750});
    let df = await DiamondFactory.deployed();
    await df.addAdmin(accounts[0], {from: GOD_ADDR});
    console.log("FACTORY ADDR:",df.address);

}