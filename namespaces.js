const axios = require('axios');
const Promise = require('bluebird');
const argv = require('yargs').argv;

const namespaces = argv.namespaces;
if (!namespaces) {
    console.log('Please specify a namespace(s). E.g.: ns1, ns2');
    process.exit();
}
const supportedOperations = ['create', 'delete'];
const operation = argv.operation;
if (!supportedOperations.includes(operation)) {
    console.log(`Please specify a operation. Either ${supportedOperations.join(', ')}`);
    process.exit();
}

const uploadConfig = require('./uploadConfig.json');
const { host, path, username, password } = uploadConfig;

if (operation === 'create') {
    const supportedStorageMods = ['triples', 'quads', 'rdr'];
    const mode = argv.mode;
    if (!supportedStorageMods.includes(mode)) {
        console.log(`Please specify a storage mode. E.g. ${supportedStorageMods.join(', ')}`);
        process.exit();
    }

    const axiosOptions = {
        headers: {
            'Accept': '*/*',
            'Content-Type': 'text/plain',
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
    };

    Promise.each(namespaces.split(','), (namespace) => {
        const ns = namespace.trim();
        if (!ns) {
            return Promise.delay(0);
        }
        const payload = `
            com.bigdata.rdf.store.AbstractTripleStore.textIndex=false
            com.bigdata.rdf.store.AbstractTripleStore.axiomsClass=com.bigdata.rdf.axioms.NoAxioms
            com.bigdata.rdf.sail.isolatableIndices=false
            com.bigdata.rdf.sail.truthMaintenance=false
            com.bigdata.rdf.store.AbstractTripleStore.justify=false
            com.bigdata.rdf.sail.namespace=${ns}
            com.bigdata.rdf.store.AbstractTripleStore.quads=${mode === 'quads' ? 'true' : 'false'}
            com.bigdata.namespace.${ns}.spo.com.bigdata.btree.BTree.branchingFactor=1024
            com.bigdata.namespace.${ns}.lex.com.bigdata.btree.BTree.branchingFactor=400
            com.bigdata.rdf.store.AbstractTripleStore.geoSpatial=false
            com.bigdata.rdf.store.AbstractTripleStore.statementIdentifiers=${mode === 'rdr' ? 'true' : 'false'}
        `;
        return axios.post(`${host}${path}/namespace`, payload, axiosOptions).then((resp) => {
            console.log(resp.data);
        });
    }).catch((err) => {
        if (err.response) {
            console.error(err.response.status, err.response.statusText, err.response.data);
        } else {
            console.error(err);
        }
    });
} else if (operation === 'delete') {
    const axiosOptions = {
        headers: {
            'Accept': '*/*',
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        }
    };
    Promise.each(namespaces.split(','), (namespace) => {
        const ns = namespace.trim();
        if (!ns) {
            return Promise.delay(0);
        }
        return axios.delete(`${host}${path}/namespace/${ns}`, axiosOptions).then((resp) => {
            console.log(resp.data);
        });
    }).catch((err) => {
        if (err.response) {
            console.log(err.response.status, err.response.statusText, err.response.data);
        } else {
            console.error(err);
        }
    });
}