//SPDX-License-Identifier: MIT-open-group
pragma solidity ^0.8.7;

import "../interfaces/AppStorage.sol";
import "../interfaces/Interfaces.sol";
import "../libraries/LibDiamond.sol";

///@title simpleDefi.sol
///@author Derrick Bradbury (derrickb@halex.com)
///@notice Common simpleDefi functions not specific to pool/solo contracts
contract sdInitialize {
    AppStorage internal s;

    event sdInitialized(uint64 poolId, address lpContract);

    error sdFunctionLocked();
    error sdAlreadyInitialized();
    error sdAddressError();
    error sdBeaconNotConfigured();
    error sdLPContractRequired();
    error sdPoolNotActive();

    function initialize(uint64 _poolId, address _beacon, string memory _exchangeName) public payable  {
        if (s._initialized == true) revert sdAlreadyInitialized();
        if (_beacon == address(0)) revert sdAddressError();
        LibDiamond.enforceIsContractOwner();
        
        // address ownerAddr = iBeacon(_beacon).getAddress("OWNERADDRESS");
        // require(ownerAddr != address(0), "OWNERADDRESS not configured");

        LibDiamond.setContractOwner(msg.sender);
        LibDiamond.setDiamondFactory(msg.sender);

        s._initialized = true;       
        s.iData.beaconContract = _beacon;
        s.iData.exchange = _exchangeName;    
        s.revision = "v0.7";
        
        s.iData.feeCollector = 0x6492830c2292381CcF3D439ea70a2Bfbc1a52cd9; //iBeacon(_beacon).getAddress("FEECOLLECTOR");
        (s.SwapFee,) = iBeacon(_beacon).getFee(_exchangeName,"SWAPFEE",address(0)); //SWAP FEE is 1e8

        s.adminUsers[iBeacon(_beacon).getAddress("HARVESTER")] = true;
        s.godUsers[iBeacon(_beacon).getAddress("GODUSER")] = true;
        
        iBeacon.sExchangeInfo memory ex = iBeacon(_beacon).getExchangeInfo(_exchangeName);
        s.exchangeInfo.chefContract = ex.chefContract;
        s.exchangeInfo.routerContract = ex.routerContract;
        s.exchangeInfo.rewardToken = ex.rewardToken;
        s.exchangeInfo.intermediateToken = ex.intermediateToken;
        s.exchangeInfo.baseToken = ex.baseToken;
        s.exchangeInfo.pendingCall = ex.pendingCall;
        s.exchangeInfo.contractType_solo = ex.contractType_solo;
        s.exchangeInfo.contractType_pooled = ex.contractType_pooled;
        s.exchangeInfo.psV2 = ex.psV2;

        if (s.exchangeInfo.chefContract == address(0)) revert sdBeaconNotConfigured();

        address _lpContract;
        uint _alloc;

        if (s.exchangeInfo.psV2) {
            _lpContract = iMasterChefv2(s.exchangeInfo.chefContract).lpToken(_poolId);
            (,,_alloc,,) = iMasterChefv2(s.exchangeInfo.chefContract).poolInfo(_poolId);
        }
        else {
            (_lpContract, _alloc,,) = iMasterChef(s.exchangeInfo.chefContract).poolInfo(_poolId);
        }
        
        if(_lpContract == address(0)) revert sdLPContractRequired();
        if(_alloc == 0) revert sdPoolNotActive();

        s.iData.poolId = _poolId;
        s.iData.lpContract =  _lpContract;
        s.iData.token0 = iLPToken(_lpContract).token0();
        s.iData.token1 = iLPToken(_lpContract).token1();

        ERC20(s.iData.token0).approve(s.exchangeInfo.routerContract,MAX_INT);
        ERC20(s.iData.token1).approve(s.exchangeInfo.routerContract,MAX_INT);
        ERC20(s.exchangeInfo.rewardToken).approve(s.exchangeInfo.routerContract,MAX_INT);
        
        iLPToken(_lpContract).approve(s.exchangeInfo.chefContract,MAX_INT);        
        iLPToken(_lpContract).approve(s.exchangeInfo.routerContract,MAX_INT);        
        
        emit sdInitialized(_poolId,_lpContract);
    }
    function  updateFacets(IDiamondCut.FacetCut[] memory _diamondCut) public {
        LibDiamond.enforceIsContractOwner(); //allow only contract factory to update
        LibDiamond.diamondCut(_diamondCut, address(0), new bytes(0));
    }

}    
