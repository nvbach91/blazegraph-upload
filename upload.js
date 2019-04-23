const axios = require('axios');
const bluebird = require('bluebird');
const fs = require('fs');
const argv = require('yargs').argv;

let directory = argv.directory || '';
const host = argv.host || 'http://localhost:8080';
const path = '/boss-blazegraph-s/v1';
const namespace = argv.namespace || 'kb';
const username = argv.username || 'admin';
const password = argv.password || 'pw123';

console.log(directory);
console.log(host);
console.log(path);
console.log(namespace);
console.log(username);
console.log(password);

if (!directory) {
    console.log('Please specify a path to the folder containing the files you want to upload');
    process.exit();
}
if (!directory.endsWith('/')) {
    directory += '/';
}
let files = [];
try {
    files = fs.readdirSync(directory);
    files = files.filter((file) => /\.(rdfs?|owl)$/.test(file));
} catch (e) {
    console.log(e);
    console.log('Invalid path to directory');
    process.exit();
}
if (!files.length) {
    console.log('There are no valid files in this directory. Please specify a path to a directory containing RDF (rdfs, owl, ...) files');
    process.exit();
}
var mimes = {
    'rdf'   : 'application/rdf+xml',
    'rdfs'  : 'application/rdf+xml',
    'owl'   : 'application/rdf+xml',
    'xml'   : 'application/rdf+xml',
    'jsonld': 'application/ld+json',
    'nt'    : 'text/plain',
    'ntx'   : 'application/x-n-triples-RDR',
    'ttl'   : 'application/x-turtle',
    'ttlx'  : 'application/x-turtle-RDR',
    'n3'    : 'text/rdf+n3',
    'trix'  : 'application/trix',
    'trig'  : 'application/x-trig',
    'nq'    : 'text/x-nquads',
    'srj'   : 'application/sparql-results+json, application/json',
    'json'  : 'application/sparql-results+json, application/json',
};
var start = new Date();
bluebird.map(files, (file) => {
    var options = { 
        headers: { 
            'Content-Type': mimes[file.split('.').splice(-1).join()],
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
    };
    const data = fs.readFileSync(directory + file, 'utf8');
    return axios.post(host + path + '/namespace/' + namespace + '/sparql', data, options).then((resp) => {
        console.log('DONE: ', directory + file, resp.data);
    });
}).then(() => {
    console.log('Finished after ', new Date() - start, 'ms');
}).catch((err) => {
    console.log(err);
    if (err.response) {
        console.log(err.response.status, err.response.statusText, err.response.data);
    }
});
