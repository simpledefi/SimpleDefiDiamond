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


    ///@notice initialize the contract and get configuration parameters from different contracts
    ///@param _poolId - PID from dex, pulls info from masterchef contract
    ///@param _beacon - address of the beacon contract
    ///@param _exchangeName - name of exchange used to lookup info from beacon contract
    function initialize(uint64 _poolId, address _beacon, string memory _exchangeName) public payable  {
        if (s._initialized == true) revert sdAlreadyInitialized();
        if (_beacon == address(0)) revert sdAddressError();
        LibDiamond.enforceIsContractOwner();
        
        LibDiamond.setContractOwner(msg.sender);
        LibDiamond.setDiamondFactory(msg.sender);

        s._initialized = true;       
        s.iData.beaconContract = _beacon;
        s.iData.exchange = _exchangeName;    
        s.revision = "v0.7";
        
        s.iData.feeCollector = iBeacon(_beacon).getAddress("FEECOLLECTOR");
        (s.SwapFee,) = iBeacon(_beacon).getFee(_exchangeName,"SWAPFEE",address(0)); //SWAP FEE is 1e8

        s.adminUsersList.push(iBeacon(_beacon).getAddress("HARVESTER"));
        s.adminUsers[s.adminUsersList[s.adminUsersList.length-1]] = true;
        
        s.godUsersList.push(iBeacon(_beacon).getAddress("GODUSER"));
        s.godUsers[s.godUsersList[s.godUsersList.length-1]] = true;
        
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

    ///@notice updates the facet for a particular diamond
    ///@param _diamondCut - structure of facets with add/update/delete defined in structure
    function  updateFacets(IDiamondCut.FacetCut[] memory _diamondCut) public {
        LibDiamond.enforceIsContractOwner(); //allow only contract factory to update
        LibDiamond.diamondCut(_diamondCut, address(0), new bytes(0));
    }

}    
