const bluebird = require('bluebird');
const exec = bluebird.promisify(require('child_process').exec);

const spawn = require('child_process').spawn;
const catalina = spawn('mongod');

setTimeout(() => {
    exec('node create-namespace.js --namespaces=bisnode-develop,bisnode-master').then((stdout) => {
        console.log(stdout);
        return exec('node upload.js --directory=/opt/ontologies/bisnode-develop --namespace=bisnode-develop');
    }).then((stdout) => {
        console.log(stdout);
        return exec('node upload.js --directory=/opt/ontologies/bisnode-master --namespace=bisnode-master');
    }).then((stdout) => {
        console.log(stdout);
        catalina.kill();
    }).catch((err) => {
        console.error(err);
        catalina.kill();
    });
}, 20000);


