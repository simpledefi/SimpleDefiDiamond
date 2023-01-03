// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../lib/solidity-stringutils/strings.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "forge-std/Script.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Diamond.sol";
import "../src/facets/DiamondCutFacet.sol";
import "../src/facets/DiamondLoupeFacet.sol";
import "../src/facets/OwnershipFacet.sol";
import "../src/facets/sdData.sol";
import "../src/facets/sdDepositFunds.sol";
import "../src/facets/sdInitialize.sol";
import "../src/facets/sdMigration.sol";
import "../src/facets/sdSystem.sol";

import "../src/DiamondFactory.sol";
import "../src/interfaces/IDiamondCut.sol";

interface sdBeacon {
    function setExchange(string memory,address,uint) external;
}

// interface iApp {
//     function  updateFacets(IDiamondCut.FacetCut[] memory _diamondCut) external;
// }
interface iProxyFactory {
    function  updateFacets(IDiamondCut.FacetCut[] memory _diamondCut) external;
}

contract deployDiamondScript is Script {
    using strings for *;

    bool _upgrade;
    bool _verify = false;

    address _beacon = 0x500fad360BC10ec706974b999b5f0D615C59fEb7;
    address _godUser = 0x0e0435B1aB9B9DCddff2119623e25be63ef5CB6e;
    address _adminUser = 0x42a515c1EDB651F4c69c56E05578D2805D6451eB;

    address _contract = 0xD1C9A57cd1B4013b2e1178Fc4AA90CC42338c77b; // DEVELOPMENT
    // address _contract = 0x0000000000000000000000000000000000000000; // DEVELOPMENT

    address _factory = 0x0000000000000000000000000000000000000000; // DEVELOPMENT
    // address _factory = 0x42a515c1EDB651F4c69c56E05578D2805D6451eB; // BETA
    // address _factory = 0x42a515c1EDB651F4c69c56E05578D2805D6451eB; // STAGING
    // address _factory = 0x42a515c1EDB651F4c69c56E05578D2805D6451eB; // PRODUCTION


    struct DiamondArgs {
        address owner;
    }

    IDiamondCut.FacetCut[] _cut;

    function deployDiamond(bool v) public returns (address) {
    // function run() external {
        uint256 deployerPrivateKey = vm.envUint("privateKey");
        bool _upgrade_DiamondCutFacet   = false;
        bool _upgrade_DiamondLoupeFacet = false;
        bool _upgrade_OwnershipFacet    = false;
        bool _upgrade_sdData            = false;
        bool _upgrade_sdDepositFunds    = false;
        bool _upgrade_sdInitialize      = false;
        bool _upgrade_sdMigration       = false;
        bool _upgrade_sdSystem          = false;

         _upgrade = _upgrade_DiamondCutFacet || _upgrade_DiamondLoupeFacet || _upgrade_OwnershipFacet || _upgrade_sdData || _upgrade_sdDepositFunds ||
            _upgrade_sdInitialize || _upgrade_sdMigration || _upgrade_sdSystem;

        if (v) console.log("Action:",_upgrade?"Upgrade":"Create");
        
        vm.startBroadcast(deployerPrivateKey);
        
        if (!_upgrade || (_upgrade && _upgrade_DiamondCutFacet)) {
            DiamondCutFacet dcf = new DiamondCutFacet();        
            if (v) console.log("Deploying DiamondCutFacet:  ", address(dcf));
            _cut.push(IDiamondCut.FacetCut(
                address(dcf),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("DiamondCutFacet")
            ));
            if (_verify) verifyContract("DiamondCutFacet",address(dcf));
        } 

        
        if (!_upgrade || (_upgrade && _upgrade_DiamondLoupeFacet)) {
            DiamondLoupeFacet dlf = new DiamondLoupeFacet();
            if (v) console.log("deploying DiamondLoupeFacet:", address(dlf));
            _cut.push(IDiamondCut.FacetCut(
                address(dlf),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("DiamondLoupeFacet")
            ));
            if (_verify) verifyContract("DiamondLoupeFacet",address(dlf));
        }

        if (!_upgrade || (_upgrade && _upgrade_OwnershipFacet)) {
            OwnershipFacet dof = new OwnershipFacet();
            if (v) console.log("deploying OwnershipFacet:   ", address(dof));
            _cut.push(IDiamondCut.FacetCut(
                address(dof),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("OwnershipFacet")
            ));
            // if (_verify) verifyContract("OwnershipFacet",address(dof));
        }

        if (!_upgrade || (_upgrade && _upgrade_sdData)) {
            sdData _sdData = new sdData();
            if (v) console.log("deploying sdData:           ", address(_sdData));
            _cut.push(IDiamondCut.FacetCut(
                address(_sdData),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("sdData")
            ));
            // if (_verify) verifyContract("sdData",address(_sdData));
        }

        if (!_upgrade || (_upgrade && _upgrade_sdDepositFunds)) {
            sdDepositFunds  _sdDepositFunds = new sdDepositFunds();
            if (v) console.log("deploying sdDepositFunds:   ", address(_sdDepositFunds));
            _cut.push(IDiamondCut.FacetCut(
                address(_sdDepositFunds),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("sdDepositFunds")
            ));
            // if (_verify) verifyContract("sdDepositFunds",address(_sdDepositFunds));
        }

        if (!_upgrade || (_upgrade && _upgrade_sdInitialize)) {
            sdInitialize  _sdInitialize = new sdInitialize();
            if (v) console.log("deploying sdInitialize:     ", address(_sdInitialize));
            _cut.push(IDiamondCut.FacetCut(
                address(_sdInitialize),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("sdInitialize")
            ));
            // if (_verify) verifyContract("sdInitialize",address(_sdInitialize));
        }

        if (!_upgrade || (_upgrade && _upgrade_sdMigration)) {
            sdMigration  _sdMigration = new sdMigration();
            if (v) console.log("deploying sdMigration:      ", address(_sdMigration));
            _cut.push(IDiamondCut.FacetCut(
                address(_sdMigration),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("sdMigration")
            ));
            // if (_verify) verifyContract("sdMigration",address(_sdMigration));
        }

        if (!_upgrade || (_upgrade && _upgrade_sdSystem)) {
            sdSystem  _sdSystem = new sdSystem();
            if (v) console.log("deploying sdSystem:         ", address(_sdSystem));
            _cut.push(IDiamondCut.FacetCut(
                address(_sdSystem),
                _upgrade?IDiamondCut.FacetCutAction.Replace:IDiamondCut.FacetCutAction.Add,
                generateSelectors("sdSystem")
            ));
            // if (_verify) verifyContract("sdSystem",address(_sdSystem));
        }
        address _d;

        if (_upgrade){
            if (v) console.log("Upgrade");
            if (_contract != address(0)) {
                iApp(_contract).updateFacets(_cut);
            }
            else {
                iProxyFactory(_factory).updateFacets(_cut);
            }
        }
        else {
            Diamond _di = new Diamond(_cut, Diamond.DiamondArgs(_godUser));
            _d = address(_di);
            if (v) console.log("Diamond:",address(_d));
        }

        vm.stopBroadcast();
        return address(_d);
    }

    function deployFactory(address _diamond, bool v) public returns(address) {
        if (v) console.log("deploying factory");
        DiamondFactory df = new DiamondFactory(_beacon, _godUser, _adminUser);        
        if (_diamond != address(0)) {
            // console.log("Update Beacon");
            vm.prank(_godUser);
            sdBeacon(_beacon).setExchange("MULTIEXCHANGEPOOLED",_diamond,0);
        }

        return address(df);
    }

    function run() external {
        bool _deployFactory = true;

        address _d = deployDiamond(true);
        console.log("New Diamond: %s",_d);

        if (!_upgrade && _deployFactory) {
            address _df = deployFactory(_d, true);
            console.log("Diamond Factory:",_df);
        }
    }

    function verifyContract(string memory _facetName, address _addr) internal  {
        console.log("Verify:",_facetName,_addr);
        string [] memory cmd = new string[](7);
        cmd[0] = "forge";
        cmd[1] = "verify-contract";
        cmd[2] = Strings.toHexString(uint160(_addr), 20);        
        cmd[3] = _facetName;
        cmd[4] = "6C9YAI39WV3XAMFE5QFYW6RJI25T138RHW";
        cmd[5] = "--verifier-url";
        cmd[6] = "https://api.bscscan.com/api";

        for(uint i=0;i<cmd.length;i++)
            console.log(i,cmd[i]);

        bytes memory res = vm.ffi(cmd);
        console.log(string(res));
    }

    function generateSelectors(string memory _facetName) internal returns (bytes4[] memory selectors)
    {
        //get string of contract methods
        string[] memory cmd = new string[](4);
        cmd[0] = "forge";
        cmd[1] = "inspect";
        cmd[2] = _facetName;
        cmd[3] = "methods";
        bytes memory res = vm.ffi(cmd);
        string memory st = string(res);

        // extract function signatures and take first 4 bytes of keccak
        strings.slice memory s = st.toSlice();
        strings.slice memory delim = ":".toSlice();
        strings.slice memory delim2 = ",".toSlice();
        selectors = new bytes4[]((s.count(delim)));
        for(uint i = 0; i < selectors.length; i++) {
            s.split('"'.toSlice());
            selectors[i] = bytes4(s.split(delim).until('"'.toSlice()).keccak());
            s.split(delim2);
        }
        return selectors;
    }        
}