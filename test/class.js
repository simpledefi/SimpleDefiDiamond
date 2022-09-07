const { NONAME } = require("dns");
const fs = require("fs");

class App {        
    constructor (tx, owner="",w3) {
        console.log("CONSTURCTOR");
        this.web3 = w3;
        let abi = JSON.parse(fs.readFileSync("/tmp/simpleDefiDiamond.json","utf-8"))
        let proxy = this.getProxy(tx);
        console.log("proxy:",proxy);
        this.app = new this.web3.eth.Contract(abi,proxy);
        if (owner) this.owner = owner;
        return proxy
    }

    async iData() {
        let data = await this.app.methods.iData().call();
        return data;
    }

    async updatePool(pid) {
        let update_abi = JSON.parse('[{"inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"} ], "name":"updatePool", "outputs":[{"components":[{"internalType":"uint256","name":"accCakePerShare","type":"uint256"},{"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},{"internalType":"uint256","name":"allocPoint","type":"uint256"},{"internalType":"uint256","name":"totalBoostedShare","type":"uint256"},{"internalType":"bool","name":"isRegular","type":"bool"}],"internalType":"struct MasterChefV2.PoolInfo","name":"pool","type":"tuple"} ], "stateMutability":"nonpayable", "type":"function"}]');
        let up =  new web3.eth.Contract(update_abi,"0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652");
        up.methods.updatePool(pid).send({from:'0x2320738301305c892B01f44E4E9854a2D19AE19e'});
    }

    async deposit(_user, _amount) {
        console.log("deposit:",_user,_amount)
        let _amt = _amount.toString();
        let gas = await this.app.methods.deposit().estimateGas({from: _user, value: web3.utils.toWei(_amt, "ether")});    
        let tx = await this.app.methods.deposit().send({from: _user, value: web3.utils.toWei(_amt, "ether"), gas: parseInt(gas * 1.2)});
        return tx;
    }

    async harvest(_user = accounts[0]) {
        console.log("harvesting:")
        _user = web3.utils.toChecksumAddress(_user);
        // gas = await this.app.methods.harvest().estimateGas({from: _user});    
        let gas = 9000000;
        let tx = await this.app.methods.harvest().send({from: _user, gas: parseInt(gas * 1.2)});
        return tx
    }

    async liquidate(_user = accounts[1], force = false) {
        console.log("Liquidating:" + _user);
        let gas = 9000000;
        try {
            tx = await this.app.methods.liquidate().send({from: _user, gas: parseInt(gas * 1.2)});
            return tx;      
        }
        catch(e) {
            return false;
        }
    }

    st(obj) {
        console.log(JSON.stringify(obj));
    }

    async audit(tag="") {
        let a = await this.app.methods.audit().call();
        if (tag) tag = tag + ": ";
    
        console.log(tag + JSON.stringify(a));
    }

    async dumpLogs(receipt) {
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
    }

    getProxy(receipt) {
        return receipt.logs[0].args.proxy;
    }

    amt(val,precision=18) {
        return  parseFloat(val).toFixed(precision).replace(".","").toString();
    }

    check_revert(e,fSignature) {
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
    }

    errorSig(e,sig,hexStr="") {
        let functionSig = hexStr?hexStr:web3.eth.abi.encodeFunctionSignature(sig);
    
        let rv = e.data[Object.keys(e.data)[0]].return;
        console.log(functionSig,rv.substring(0,functionSig.length),rv);
        return functionSig == rv.substring(0,functionSig.length);
    }

    async initialize(_pid, _beacon,_exchangeName,_account) {
        await this.app.methods.initialize(_pid,_beacon, _exchangeName).send({value: this.amt(0), from: _account});
    }

    async addHarvester(address, owner="") {
        if(!owner) owner = this.owner;
        console.log("Sending:" + owner);
        await this.app.methods.addHarvester(address,true).send({from: owner});
    }

    async userInfo(address,debug=0) {
        let data;
        if (debug==1)
            data = await this.app.methods.userInfo(address).send({from:"0xD0153B7c79473eA931DaA5FDb25751d7534c4c3B"});
        else
            data = await this.app.methods.userInfo(address).call();

        return data;
    }

    async pendingReward() {
        let data = await this.app.methods.pendingReward().call()
        return data;
    }    

    async getPendingReward() {
        let data = await this.app.methods.getPendingReward().call();
        return data;
    }   

    async findLog(receipt, eventName, _user = "", userVar="_user") {
        let events = receipt.events;
        if (events[eventName]) {
            if (events[eventName][0] == undefined){
                if (_user) {
                    try {
                        if (events[eventName].returnValues[userVar] == _user)
                            return events[eventName].returnValues;
                    }
                    catch(e) {
                        return None;
                    }
                }
                else {
                    return events[eventName].returnValues;
                }
            }
            else {
                let rv = [];
                for (let evt in events[eventName]){
                    let eventItem = events[eventName][evt];
                    if (_user) {
                        try {
                            if (eventItem.returnValues[userVar] == _user)
                                rv.push(eventItem.returnValues);
                        }
                        catch(e) {
                            //None
                        }
                    }
                    else {
                        rv.push(eventItem.returnValues);
                    }    
                }
                return rv;
            }
        }
    }

    dumpLogs(tx) {
        for (let evt in Object.keys(tx.events)) {
            let _tag = Object.keys(tx.events)[evt];
            if(_tag && isNaN(_tag)) {
                console.log("Event:",_tag);
                if (tx.events[_tag][0] == undefined){
                    let retVals = tx.events[_tag].returnValues;
                    for (let el in retVals){
                        if (isNaN(el)) 
                            console.log("\t",el ,":",  retVals[el]);
                    }
                    console.log();
                }
                else {
                    for (let i =0;i<tx.events[_tag].length;i++) {
                        let retVals = tx.events[_tag][i].returnValues;
                        for (let el in retVals){
                            if (isNaN(el)) 
                            console.log("\t",el ,":",  retVals[el]);
                        }
                        console.log();                
                    }
                }
            }   
        }        
    }
    async resetGas(user) {
        await this.app.methods.resetGas().send({from: user});
    }

    async setHoldback(_user, amount) {
        console.log("setHoldback:",_user,amount)
        
        let gas = await this.app.methods.setHoldback(this.amt(amount)).estimateGas({from: _user});    
        let tx = await this.app.methods.setHoldback(this.amt(amount)).send({from: _user, gas: parseInt(gas * 1.2)});
        return tx;

    }
    async address() {
        let addr = await this.app._address;
        return addr;
    }

    async swapPool(_user, dest) {
        
        // let gas = await this.app.methods.swapPool(dest).estimateGas({from: _user});    
        let gas = 9000000;
        let tx = await this.app.methods.swapPool(dest).send({from: _user, gas: parseInt(gas * 1.2)});
        return tx;
    }

    async addAdmin(_user, _from) {
        
        let gas = await this.app.methods.addAdminUser(_user,true).estimateGas({from: _from});    
        let tx = await this.app.methods.addAdminUser(_user,true).send({from: _from, gas: parseInt(gas * 1.2)});
        return tx;
    }
}

module.exports = App;

