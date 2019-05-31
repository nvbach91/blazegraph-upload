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
const password = argv.password || 'admin';

console.log(host);
console.log(path);
console.log(namespaces);
console.log(username);
console.log(password);

const options = { 
    headers: { 
        'Accept': '*/*',
        'Content-Type': 'text/plain',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
};

bluebird.each(namespaces.split(','), (namespace) => {
    const ns = namespace.trim();
    if (!ns) {
        return bluebird.delay(0);
    }
    const payload = `
        com.bigdata.rdf.store.AbstractTripleStore.textIndex=false
        com.bigdata.rdf.store.AbstractTripleStore.axiomsClass=com.bigdata.rdf.axioms.NoAxioms
        com.bigdata.rdf.sail.isolatableIndices=false
        com.bigdata.rdf.sail.truthMaintenance=false
        com.bigdata.rdf.store.AbstractTripleStore.justify=false
        com.bigdata.rdf.sail.namespace=${ns}
        com.bigdata.rdf.store.AbstractTripleStore.quads=false
        com.bigdata.namespace.${ns}.spo.com.bigdata.btree.BTree.branchingFactor=1024
        com.bigdata.namespace.${ns}.lex.com.bigdata.btree.BTree.branchingFactor=400
        com.bigdata.rdf.store.AbstractTripleStore.geoSpatial=false
        com.bigdata.rdf.store.AbstractTripleStore.statementIdentifiers=false
    `;
    return axios.post(`${host}${path}/namespace`, payload, options).then((resp) => {
        console.log(resp.data);
    });
}).catch((err) => {
    //console.log(err);
    if (err.response) {
        console.log(err.response.status, err.response.statusText, err.response.data);
    }
});
