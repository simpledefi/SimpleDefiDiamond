const fs = require("fs");

const App = {
    app: null,
    owner: null,
    updatePool: async function(pid) {
        let update_abi = JSON.parse('[{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"} ], "name":"updatePool", "outputs":[{"components":[{"internalType":"uint256","name":"accCakePerShare","type":"uint256"},{"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},{"internalType":"uint256","name":"allocPoint","type":"uint256"},{"internalType":"uint256","name":"totalBoostedShare","type":"uint256"},{"internalType":"bool","name":"isRegular","type":"bool"}],"internalType":"struct MasterChefV2.PoolInfo","name":"pool","type":"tuple"} ], "stateMutability":"nonpayable", "type":"function"}]');
        let up =  new web3.eth.Contract(update_abi,"0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652");
        up.methods.updatePool(pid).send({from:'0x2320738301305c892B01f44E4E9854a2D19AE19e'});
    },
    setProxy: function(tx, owner="") {
        let abi = JSON.parse(fs.readFileSync("/tmp/simpleDefiDiamond.json","utf-8"))
        proxy = this.getProxy(tx);
        console.log("proxy:",proxy);
        this.app = new web3.eth.Contract(abi,proxy);
        if (owner) this.owner = owner;
        return proxy
    },

    deposit: async function(_user, _amount) {
        console.log("deposit:",_user,_amount)
        let _amt = _amount.toString();
        let gas = await this.app.methods.deposit().estimateGas({from: _user, value: web3.utils.toWei(_amt, "ether")});    
        let tx = await this.app.methods.deposit().send({from: _user, value: web3.utils.toWei(_amt, "ether"), gas: parseInt(gas * 1.2)});
    },
    harvest : async function(_user = accounts[0]) {
        console.log("harvesting:")
        _user = web3.utils.toChecksumAddress(_user);
        // gas = await this.app.methods.harvest().estimateGas({from: _user});    
        gas = 9000000;
        tx = await this.app.methods.harvest().send({from: _user, gas: parseInt(gas * 1.2)});
    },
    liquidate : async function(_user = accounts[1], force = false) {
        console.log("Liquidating:" + _user);
        gas = 9000000;
        try {
            tx = await this.app.methods.liquidate().send({from: _user, gas: parseInt(gas * 1.2)});
            return true;      
        }
        catch(e) {
            return false;
        }
    },
    st: function (obj) {
        console.log(JSON.stringify(obj));
    },
    audit: async function(tag="") {
        let a = await this.app.methods.audit().call();
        if (tag) tag = tag + ": ";
    
        console.log(tag + JSON.stringify(a));
    },
    dumpLogs: async function(receipt) {
        let logs = receipt.logs;
        for (log of logs) {
            let cnt = 0;
            console.log("\nLOG:",log.event,log.id);
            for (arg in log.args) {
                if (arg != cnt && arg != "__length__") 
                    console.log("\t",arg,JSON.stringify(log.args[arg]))
                cnt++;
            }
        }
    },    
    getProxy: function(receipt) {
        let logs = receipt.logs;
        for (log of logs) {
            if (log.event == "NewProxy") {
                return log.args.proxy;
            }
        }
    },
    amt: function (val) {
        return  parseFloat(val).toFixed(18).replace(".","").toString();
    },
    check_revert: function(e,fSignature) {
        if (e.data == undefined) {
            if (e.reason == 'Custom error (could not decode)') return true;
            return e.reason == fSignature;
        }
        else {
            let rv = e.data[Object.keys(e.data)[0]]['return'].substring(0,10);
            let sig = web3.eth.abi.encodeFunctionSignature(fSignature);
            console.log("RV:",rv,sig);
            return rv == sig;
        }
    },    
    errorSig: function(e,sig,hex="") {
        let functionSig = hex?hex:web3.eth.abi.encodeFunctionSignature(sig);
    
        let rv = e.data[Object.keys(e.data)[0]].return;
        console.log(functionSig,rv.substring(0,functionSig.length),rv);
        return functionSig == rv.substring(0,functionSig.length);
    },
    iData: async function() {
        let data = await this.app.methods.iData().call();
        return data;
    },
    initialize: async function(_pid, _beacon,_exchangeName,_account) {
        await this.app.methods.initialize(_pid,_beacon, _exchangeName).send({value: this.amt(0), from: _account});
    },
    addHarvester: async function(address, owner="") {
        if(!owner) owner = this.owner;
        console.log("Sending:" + owner);
        await this.app.methods.addHarvester(address,true).send({from: owner});
    },
    userInfo: async function(address) {
        let data = await this.app.methods.userInfo(address).call();
        return data;
    },
    pendingReward: async function() {
        let data = this.app.methods.pendingReward().call()
        return data;
    },

    
}
module.exports = App;
