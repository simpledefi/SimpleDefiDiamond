const { runMain } = require('module');
var fs = require('fs');

const delay = ms => new Promise(res => setTimeout(res, ms));

const exec = require('child_process').exec;
let fn = "/tmp/sd." + ("" + Math.random()).substring(2, 8); 
let dir = config['contracts_build_directory'];

function run(cmd) {
    console.log(cmd);
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
    });    
}

console.log(fn);

module.exports = async function (deployer, network, accounts) {    
    await run('/usr/bin/jq -s ".[].abi"  ' + dir + '/sd*.json > ' + fn);
    await delay(2000);
    f = fs.readdirSync(dir);
    console.log(JSON.stringify(f));
    // l = fs.readFileSync(fn).toString();
    // console.log(l);
    await run('/usr/bin/sed -z "s/\\n\\]\\x0a\\[/,/g" ' + fn + ' >  /tmp/simpleDefiDiamond.json');    
    await run('rm -f ' + fn);
}