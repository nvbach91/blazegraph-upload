const axios = require('axios');
const bluebird = require('bluebird');
const argv = require('yargs').argv;

const host = argv.host || 'http://localhost:8080';
const path = argv.path || '/blazegraph';
const namespaces = argv.namespaces;
if (!namespaces) {
    console.log('Please specify a namespace(s). E.g.: ns1, ns2');
    process.exit();
}
const username = argv.username || 'admin';
const password = argv.password || 'pw123';

console.log(host);
console.log(path);
console.log(namespaces);
console.log(username);
console.log(password);

const options = { 
    headers: { 
        'Accept': '*/*',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
};

bluebird.each(namespaces.split(','), (namespace) => {
    const ns = namespace.trim();
    if (!ns) {
        return bluebird.delay(0);
    }
    return axios.delete(`${host}${path}/namespace/${ns}`, options).then((resp) => {
        console.log(resp.data);
    });
}).catch((err) => {
    //console.log(err);
    if (err.response) {
        console.log(err.response.status, err.response.statusText, err.response.data);
    }
});
