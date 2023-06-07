//SPDX-License-Identifier: MIT-open-group
pragma solidity ^0.8.7;
import "../lib/solidity-stringutils/strings.sol";
import "forge-std/Test.sol";

import "../script/deployDiamond.s.sol";

import "../tmp/iSimpleDefiDiamond.sol";

interface tProxyFactory {
    function initialize(uint64  _pid, string memory _exchange, uint poolType, uint _salt) external returns (address);
}

interface tBeacon {
    function setExchangeInfo(string memory _name, address _chefContract, address _routerContract, bool _psV2, address _rewardToken, string memory _pendingCall,address _intermediateToken, address _baseToken, string memory _contractType_solo, string memory _contractType_pooled) external;
}

interface tMasterchef {
    struct PoolInfo {
        uint256 accCakePerShare;
        uint256 lastRewardBlock;
        uint256 allocPoint;
        uint256 totalBoostedShare;
        bool isRegular;
    }    
    function updatePool(uint _pid) external returns (PoolInfo memory);
    function userInfo(uint _pid, address _user) external returns (uint, uint, uint);
}

contract simpleDefiDiamondTest is Test, deployDiamondScript {
    address _f;
    address appAddr;

    address masterchef = 0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652;

    address user = makeAddr("user");
    address invalidUser = makeAddr("invaliduser");
    string constant EXCHANGE = "BISWAP";
    uint64 constant PID = 7;

    constructor() {        
        addBabySwapV2();
        address _d = deployDiamond(false);
        _f = deployFactory(_d,false);
        console.log(EXCHANGE,PID);
        // console.log("Diamond Factory is at:" , _f);
        vm.prank(_godUser);
        vm.deal(user,10 ether);

        appAddr = tProxyFactory(_f).initialize(PID,EXCHANGE,1,12345);        
        // console.log("Deployed at:", appAddr);
    }

    function deposit(uint _amount) private {
        deposit(user,_amount,true);
    }
    function deposit(address _user, uint _amount, bool _advance) private {
        vm.prank(_user);
        SimpleDefiDiamond(payable(appAddr)).deposit{value:_amount}();     
        if (_advance) {
            vm.roll(block.number + 10000);
            vm.warp(block.timestamp + (10000*5));
            tMasterchef(masterchef).updatePool(2);
        }
    }

    function checkUnits() private {
        uint _total;
        for (uint i = 1;i<11;i++) {
            (,uint _tmp,,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(vm.addr(i));
            _total += _tmp;
        }
        assertGt(1 ether,_total);
        console.log(1 ether-_total);
        assertLt(1 ether-_total, 100);
    }

    function test000_Deposit() public {        
        (,,uint bal1,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        deposit(.5 ether);
        (,,uint bal2,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        console.log("Deposit Balance  :",bal2);
        assertGt(bal2,bal1);
    }

    function test001_reInit() public {
        vm.prank(_godUser);
        vm.expectRevert(SimpleDefiDiamond.sdAlreadyInitialized.selector);
        
        SimpleDefiDiamond(payable(appAddr)).initialize(3,_beacon,EXCHANGE);
    }

    function test002_LockedFunctions() public {
        vm.startPrank(invalidUser);

        vm.expectRevert(bytes("LibDiamond: Must be contract owner"));
        SimpleDefiDiamond(payable(appAddr)).harvest();

        vm.stopPrank();
    }

    function test003_harvest() public {
        deposit(.5 ether);

        (,,uint bal1,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        uint pc1 = SimpleDefiDiamond(payable(appAddr)).pendingRewardUser(user);        
        vm.prank(_adminUser);
        SimpleDefiDiamond(payable(appAddr)).harvest();        
	console.log("After");
        (,,uint bal2,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        console.log(bal2,bal1);
        assertGt(bal2,bal1);

        console.log(4);
        uint pc2 = SimpleDefiDiamond(payable(appAddr)).pendingRewardUser(user);        

        console.log("Pending Reward:", pc1,pc2);
    }

    function test004_ClearCakeAfterDeposit() public {
        deposit(1 ether);

        vm.prank(user);
        SimpleDefiDiamond(payable(appAddr)).deposit{value:.75 ether}();     
        
        uint pc = SimpleDefiDiamond(payable(appAddr)).pendingReward();        
        assertEq(pc,0);
    }

    function test005_LiquidateFromOwnerOrAdmin() public {
        deposit(5 ether);
        vm.prank(_adminUser);
        SimpleDefiDiamond(payable(appAddr)).harvest();        


        uint bal0 = address(user).balance;
        vm.prank(user);
        SimpleDefiDiamond(payable(appAddr)).liquidate();
        uint bal1 = address(user).balance;
        assertGt(bal1,bal0);
        console.log(bal1,bal0, bal1-bal0);
    }
   
    function test006_poolSwap() public {
        deposit(5 ether);
        vm.prank(_godUser);
        address p2 = tProxyFactory(_f).initialize(3,EXCHANGE,1,123456);        
        (,,uint bal0,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        (,,uint bal1,,) = SimpleDefiDiamond(payable(p2)).userInfo(user);
        
        console.log("before:",bal0,bal1);

        vm.startPrank(user);
        SimpleDefiDiamond(payable(appAddr)).swapPool(p2);

        (,,bal0,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        (,,bal1,,) = SimpleDefiDiamond(payable(p2)).userInfo(user);
        
        console.log("after: ", bal0,bal1);
        assertEq(bal0,0);
        assertGt(bal1,0);
        
    }

    function test007_disallowRescueToken() public {
        vm.prank(invalidUser);
        vm.expectRevert(bytes('LibDiamond: Must be contract owner'));
        SimpleDefiDiamond(payable(appAddr)).rescueToken(WBNB_ADDR, 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82, 1 ether);
    }

    function test008_setHoldback() public {
        deposit(5 ether);

        uint bal0 = address(user).balance;
        vm.prank(_adminUser);
        SimpleDefiDiamond(payable(appAddr)).harvest();        
        uint bal1 = address(user).balance;
        console.log(bal1,bal0);
        assertEq(bal1,bal0);

        vm.prank(_adminUser);
        SimpleDefiDiamond(appAddr).resetGas();

        vm.prank(user);
        SimpleDefiDiamond(payable(appAddr)).setHoldback(10 ether);        

        vm.roll(block.number + 10000);
        vm.warp(block.timestamp + (10000*5));
        tMasterchef(masterchef).updatePool(2);

        uint pr = SimpleDefiDiamond(appAddr).pendingRewardUser(user);
        console.log(pr);

        bal0 = address(user).balance;
        vm.prank(_adminUser);
        SimpleDefiDiamond(payable(appAddr)).harvest();        
        bal1 = address(user).balance;

        console.log(bal1,bal0);
        assertGt(bal1,bal0);
    }


    function test009_checkInvalidBalance() public {
        deposit(5 ether);
        uint bal0 = SimpleDefiDiamond(payable(appAddr)).pendingRewardUser(user);
        console.log(user,bal0);
        assertGt(bal0,0);


        uint bal1 = SimpleDefiDiamond(payable(appAddr)).pendingRewardUser(invalidUser);
        console.log(invalidUser,bal1);
        assertEq(bal1,0);
    }
    function test010_addHarvester() public {
        vm.prank(invalidUser);
        vm.expectRevert("LibDiamond: Must be contract owner");
        SimpleDefiDiamond(appAddr).addAdminUser(invalidUser,true);

        vm.prank(_adminUser);
        SimpleDefiDiamond(appAddr).addAdminUser(invalidUser,true);

        vm.prank(invalidUser);
        SimpleDefiDiamond(appAddr).addAdminUser(invalidUser,true);

    }

    function test011_depositMultipleUsers() public  {
        (,,uint bal0,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(invalidUser);
        assertEq(bal0,0);
        (,,uint bal1,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        assertEq(bal1,0);

        vm.deal(invalidUser, 5 ether);
        deposit(invalidUser, 1 ether, false);
        deposit(5 ether);

        (,,bal0,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(invalidUser);
        assertGt(bal0,0);
        (,,bal1,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(user);
        assertGt(bal1,0);
    }

    function test012_testMultipleUserHarvest() public {
        test011_depositMultipleUsers();
        vm.prank(_adminUser);
        SimpleDefiDiamond(payable(appAddr)).harvest();        
    }

    function test013_testMultipleLiquidation() public {
        test012_testMultipleUserHarvest();
        uint bal0 = address(invalidUser).balance;
        uint bal1 = address(user).balance;
        console.log("Balance:",bal0,bal1);

        vm.prank(invalidUser);
        SimpleDefiDiamond(payable(appAddr)).liquidate();

        vm.prank(user);
        SimpleDefiDiamond(payable(appAddr)).liquidate();

        uint bal0_a = address(invalidUser).balance;
        uint bal1_a = address(user).balance;

        console.log(bal0, bal0_a);
        console.log(bal1, bal1_a);

        assertGt(address(invalidUser).balance,bal0);
        assertGt(address(user).balance,bal1);        
    }

    function test014_testMultipleDeposit() public {
        for (uint i=1;i<11;i++) {
            (,,uint bal0,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(vm.addr(i));
            assertEq(bal0,0);
        }


        for (uint i=1;i<11;i++) {
            vm.deal(vm.addr(i), 5 ether);
            uint amt = 1 ether / (i*10);
            console.log(vm.addr(i),amt);
            deposit(vm.addr(i), amt, false);
        }
        vm.roll(block.number + 10000);
        vm.warp(block.timestamp + (10000*5));
        tMasterchef(masterchef).updatePool(2);

        for (uint i=1;i<11;i++) {
            (,,uint bal0,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(vm.addr(i));
            assertGt(bal0,0);
        }
    }   

    function test015_harvestAllUsers() public {
        uint[] memory bal = new uint[](11);

        test014_testMultipleDeposit();
        for (uint i = 1;i<11;i++) {
            (,,bal[i],,) = SimpleDefiDiamond(payable(appAddr)).userInfo(vm.addr(i));
        }
        vm.prank(_adminUser);
        SimpleDefiDiamond(payable(appAddr)).harvest();        

        for (uint i = 1;i<11;i++) {
            (,,uint _tmp,,) = SimpleDefiDiamond(payable(appAddr)).userInfo(vm.addr(i));
            assertGt(_tmp,bal[i]);
            console.log(vm.addr(i),_tmp,bal[i],_tmp-bal[i]);
        }
    }

    function test016_testUnitsAddUp() public {
        test014_testMultipleDeposit();
        checkUnits();
    }

    function test017_noLiquidity() public {
        vm.prank(user);
        vm.expectRevert(SimpleDefiDiamond.sdInsufficentFunds.selector);
        SimpleDefiDiamond(appAddr).liquidate();
    }

    function test018_testOwner() public {
        address _owner = SimpleDefiDiamond(appAddr).owner();
        console.log("Owner:",_owner,_godUser);
        assertEq(_owner, _godUser);
    }

    function test019_setInterToken() public {
        vm.prank(_godUser);
        SimpleDefiDiamond(appAddr).setInterToken(0x55d398326f99059fF775485246999027B3197955,address(0));    
    }


    function addBabySwapV2() public {
        vm.prank(_godUser);
        tBeacon(_beacon).setExchangeInfo(
            "BABYSWAPV2",
            0xCb59468d06b812F457C1763738217FB0430842bB,
            0x325E343f1dE602396E256B67eFd1F61C3A6B38Bd,
            false,0x53E562b9B7E5E94b81f10e96Ee70Ad06df3D2657,
            "pendingReward(uint256,address)",
            0x55d398326f99059fF775485246999027B3197955, 
            0x0000000000000000000000000000000000000000,
            'MULTIEXCHANGE',
            'MULTIEXCHANGEPOOLED');
    }


}

