//SPDX-License-Identifier: MIT-open-group
pragma solidity ^0.8.7;

import "../interfaces/AppStorage.sol";
import "../interfaces/Interfaces.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/sdPoolUtil.sol";

///@title simpleDefi.sol
///@author Derrick Bradbury (derrickb@halex.com)
///@notice Common simpleDefi functions not specific to pool/solo contracts
contract sdData {
    AppStorage internal s;

    event sdHeldFunds(uint amount);
    event sdAdminUserAdd(address _harvester, bool _enabled);
    event sdGodUserAdd(address _harvester, bool _enabled);
    event sdResetGas();
    event sdPause(bool _paused);

    error sdHoldBackTooHigh();
    error sdAddressError();

    modifier allowAdmin() {
        if(!s.adminUsers[msg.sender]) {
            LibDiamond.enforceIsContractOwner();
        }
        _;
    }

    modifier allowGodUser() {
        require(s.godUsers[msg.sender] == true, "restricted function");
        _;
    }

    ///@notice function returns status of contract
    ///$returns bool true if contract is paused

    function paused() public view returns (bool) { return s.paused; }

    
    ///@notice toggles pause state of contract
    function pause() public allowAdmin {
        s.paused = !s.paused;
        emit sdPause(s.paused);
    }

    ///@notice function returns gas used in previous harvest
    ///@return uint amount of gas used in previous harvest
    function lastGas() public view  returns(uint) {return s.lastGas;}

    ///@notice function resets gas used to 0 from previous harvest
    function resetGas() public allowAdmin {
        s.lastGas = 0;
        emit sdResetGas();
    }

    ///@notice function returns internal stucture iData
    ///@return iData structure
    function iData() public view returns (stData memory) { return s.iData; }

    ///@notice function returns internal stucture exchangeInfo
    ///@return exchangeInfo structure
    function exchangeData() public view returns (sExchangeInfo memory) { return s.exchangeInfo; }

    ///@notice function returns intenral user structure
    ///@return user structure
    function iHolders(address _user) public view returns (sHolders memory) {
        return s.iHolders[_user]; 
    }

    ///@notice function returns internal structure of transaction Log
    ///@return transactionLog structure
    function transactionLog() public view allowAdmin returns (transHolders[] memory) { return s.transactionLog; }

    ///@notice Runs a check to display information from the pool and the holders
    ///@return _holders total amount held by users, added up individurally
    ///@return _poolTotal Total amount reported by state variable
    ///@return _dQueue total amount of unprocessed deposits
    ///@return _wQueue total amount of unprocessed withdrawals
    function audit() external view returns (uint _holders,uint _poolTotal,uint _dQueue, uint _wQueue){
        (_holders,_poolTotal,_dQueue,_wQueue) = sdPoolUtil.auditHolders(s);
    }

    ///@notice Future functionality, sets amount of reward to hold back from re-investment
    ///@param _holdback uint amount of reward to hold back
    function setHoldback(uint _holdback) external {
        if (_holdback > 100*1e18) revert sdHoldBackTooHigh();

        s.iHolders[msg.sender].holdback = _holdback;
        emit sdHeldFunds(_holdback);
    }

    ///@notice helper function to return balance of both tokens in a pair
    ///@return _bal0 is token0 balance
    ///@return _bal1 is token1 balance
    function tokenBalance() internal view returns (uint ,uint ) {
        return (ERC20(s.iData.token0).balanceOf(address(this)),ERC20(s.iData.token1).balanceOf(address(this)));
    }    

    ///@notice Return information on pool holdings based on user
    ///@param _user address of the user
    ///@return lastDeposit timestamp of last deposit
    ///@return units Percentage of pool user holds
    ///@return amount internal tokens held by user
    ///@return _pendingReward amount of pending reward for the user
    ///@return _accumulatedRewards total rewards accumulated by the user
    function userInfo(address _user) external view returns (uint lastDeposit,uint units, uint amount,uint _pendingReward, uint _accumulatedRewards) {   
        (amount,lastDeposit,units, _accumulatedRewards) = sdPoolUtil.getUserInfo(s, _user);
        _pendingReward = pendingRewardUser(_user,units) ;  
    }

    ///@notice Returns pending reward baesd on user
    ///@param _user address of the user
    ///@param _units units allocated to user
    ///@return amount of pending reward for the user
    function pendingRewardUser(address _user, uint _units) public view returns (uint) {
        uint _pendingReward = getPendingReward();  
        if (_units == 0) _units = sdPoolUtil.calcUnits(s,_user,false);

        return (_pendingReward * _units)/1e18;
    }

    ///@notice Returns pending reward baesd on user (overloaded without units)
    ///@param _user address of the user
    ///@return amount of pending reward for the user
    function pendingRewardUser(address _user) public view returns (uint) {
        return pendingRewardUser(_user,0);
    }

    ///@notice Returns pending reward baesd on user (overloaded without user being passed in)
    ///@dev uses msg.sender as user
    ///@return amount of pending reward for the user
    function pendingReward() external view returns (uint) {
        return pendingRewardUser(msg.sender,0);
    }

    ///@notice get pool LP balance
    ///@return _bal of LP tokens held by pool
    function getLPBalance() external view returns (uint _bal) {
        (_bal,) =  iMasterChef(s.exchangeInfo.chefContract).userInfo(s.iData.poolId,address(this));
        return _bal;
    }

    ///@notice Get pending total pending reward for pool
    ///@return uint256 total pending reward
    function getPendingReward() public view returns (uint) {    
        (, bytes memory data) = s.exchangeInfo.chefContract.staticcall(abi.encodeWithSignature(s.exchangeInfo.pendingCall, s.iData.poolId,address(this)));

        return data.length==0?0:abi.decode(data,(uint256)) + ERC20(s.exchangeInfo.rewardToken).balanceOf(address(this));
    }

    ///@notice Add user to allow Admin Functionality
    ///@param _address address of user to add
    ///@param _enabled true/false if user is enabled
    function addAdminUser(address _address, bool _enabled) external allowAdmin {
        if (_address == address(0)) revert sdAddressError();

        s.adminUsers[_address] = _enabled;
        emit sdAdminUserAdd(_address,_enabled);
    }

    ///@notice Add user to allow God level functionality
    ///@param _address address of user to add
    ///@param _enabled true/false if user is enabled
    function addGodUser(address _address, bool _enabled) external allowGodUser {
        if (_address == address(0)) revert sdAddressError();
        s.godUsers[_address] = _enabled;
        emit sdGodUserAdd(_address,_enabled);
    }
    
    ///@notice set the intermedate token for each token in the pair
    ///@param _token0 address of the first token in the pair
    ///@param _token1 address of the second token in the pair
    function setInterToken(address _token0, address _token1) public allowAdmin {
        s.intToken0 = _token0;
        s.intToken1 = _token1;
    }


} 