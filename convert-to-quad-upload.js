/**
 * This tool is used to bulk upload LARGE ontology files to blazegraph in N-Quads mode.
 * It converts the source files to a quad stream, automatically detects inserts the ontology IRI as
 * the 4th value to the quads and uploads the content to Blazegraph via its HTTP REST API in chunks
 * 
 * How to use: see README.md
 */

const fs = require('fs');
const Promise = require('bluebird');
const axios = require('axios');
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, defaultGraph } = DataFactory;
const spawn = require('child_process').spawn;
const stream = require('stream');

const nQuadsToUploadPerHttpPost = 45000;

const uploadConfig = require('./config/upload-config.json');
// Example:
// {
//   host: 'http://localhost:8080',
//   path: '/blazegraph',
//   namespace: '',
//   username: '',
//   password: '',
// }

const files = require('./config/files.js');
// Example:
// [
//   './files/cheminf.owl',    // http://semanticchemistry.github.io/semanticchemistry/ontology/cheminf.owl
//   './files/iao.owl',        // http://purl.obolibrary.org/obo/iao.owl
//   './files/bao.owl',        // http://www.bioassayontology.org/bao/bao_complete.owl
//   './files/sio.owl',        // http://semanticscience.org/ontology/sio.owl
//   './files/obi.owl',        // http://purl.obolibrary.org/obo/obi.owl
//   './files/clo.owl',        // http://purl.obolibrary.org/obo/clo.owl
//   './files/go.owl',         // http://purl.obolibrary.org/obo/go.owl
//   './files/rxnorm.ttl',     // http://purl.bioontology.org/ontology/RXNORM/
//   './files/chebi.owl',      // http://purl.obolibrary.org/obo/chebi.owl
//   './files/ncit.owl',       // http://purl.obolibrary.org/obo/ncit.owl
//   './files/ncbitaxon.ttl',  // http://purl.bioontology.org/ontology/NCBITAXON/
//   './files/pr.owl',         // http://purl.obolibrary.org/obo/pr.owl
// ]

const mimeTypes = require('./config/mime-types.json');

const upload = ({ data, extension, host, path, namespace, username, password }) => {
  const options = {
    headers: {
      'Content-Type': mimeTypes[extension],
      'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
  };
  const url = `${host}${path}/namespace/${namespace}/sparql`;
  // return Promise.delay(1000);
  return axios.post(url, data, options);
};

console.log('Checking upload config', uploadConfig);
upload({ data: '', extension: 'nq', ...uploadConfig }).then((resp) => {
  console.log('upload-config OK');
  // return Promise.delay(1000);
  return Promise.each(files, (file) => {
    if (file.endsWith('/')) {
      return Promise.each(fs.readdirSync(file).map((f) => `${file}${f}`), (f) => {
        return operate(f);
      });
    }
    return operate(file);
  });
}).then(() => {
  console.log('All files were uploaded');
}).catch((err) => {
  console.error('Promise chain has been rejected');
  console.error(err.toString());
});


const operate = (file) => {
  console.log('Started processing and uploading', file);
  // let the defaultGraph be the 4th value in the graph, this will be changed 
  // to owl:Ontology instance of the file later when parsing the triples
  let graph = defaultGraph();
  let nProcessedQuads = 0;
  let nUploadedQuads = 0;
  const log = (...msg) => {
    console.log('    ', [file, graph.value || '_defaultGraph_'].join('\t'), '\t', ...msg);
  };
  return new Promise((resolve, reject) => {
    // a placeholder-bucket to keep quads to a certain amount at which the quads will be flushed and uploaded to the triple store
    let tmpQuads = [];
    const streamParser = new N3.StreamParser({ blankNodePrefix: '' });

    log('converting triples to quad stream, if this failes, please check README regarding the Apache Jena Riot');
    // run Jena Riot to convert the source files to nt format
    const cmd = spawn(`riot${process.platform.includes('win') ? '.bat' : ''}`, [file]);
    cmd.stdout.pipe(streamParser);
    streamParser.pipe(new SlowConsumer());

    function SlowConsumer() {
      const writeableStream = new stream.Writable({ objectMode: true });
      writeableStream._write = (quad, encoding, done) => {
        if (quad) {
          // determine the 4th value in the quad
          if (namedNode('http://www.w3.org/2002/07/owl#Ontology').equals(quad.object)) {
            graph = quad.subject;
            // rewrite the quads' 4th value,
            // WARNING! the triple with <http://www.w3.org/2002/07/owl#Ontology> must be detected within the first load of triples, see variable `nQuadsToUploadPerHttpPost`
            // we assume that owl:Ontologies will always have this triple as the first one
            tmpQuads.forEach((q) => q.graph = graph);
          }
          quad.graph = graph;
          tmpQuads.push(quad);
        }
        // when the bucket is full, upload the its content and when it's done, empty the bucket (to save memory) and continue the stream for more quads
        if (tmpQuads.length >= nQuadsToUploadPerHttpPost) {
          uploadQuads(() => {
            nUploadedQuads += tmpQuads.length;
            log('uploaded', tmpQuads.length, 'quads,', 'total processed:', nProcessedQuads, 'quads,', 'total uploaded:', nUploadedQuads, 'quads');
            tmpQuads = [];
            done();
          });
        } else {
          // done() is the function that will resume the incoming stream of data to this writeable stream
          // if the bucket is not full yet, continue with the stream to throw more quads to the bucket
          done();
        }
      };
      // when there's no more quads incoming, do one last upload and finish the promise chain
      writeableStream.on('finish', () => {
        log('stream parser has finished, uploading last', tmpQuads.length, 'quads');
        if (tmpQuads.length) {
          uploadQuads(() => {
            nUploadedQuads += tmpQuads.length;
            log('uploaded last', tmpQuads.length, 'quads,', 'total processed:', nProcessedQuads, 'quads,', 'total uploaded:', nUploadedQuads, 'quads');
            tmpQuads = [];
            resolve();
          });
        }
      });
      return writeableStream;
    };

    cmd.stderr.on('data', (data) => {
      console.error(file, 'there was an error/warning while converting triples to quad stream');
      console.error(file, data.toString());
      // reject(data);
    });

    cmd.on('exit', (code) => {
      log('Jena Riot has finished converting triples to quad stream', 'cmd has exited with code', code);
    });

    // convert the temporary quads to string data and upload it
    const uploadQuads = (cb) => {
      const writer = new N3.Writer({ format: 'N-Quads' });
      writer.addQuads(tmpQuads);
      writer.end((error, result) => {
        nProcessedQuads += tmpQuads.length;
        upload({ data: result, extension: 'nq', ...uploadConfig }).then(cb).catch((err) => {
          console.error(err.response ? err.response.data : err.toString());
          // reject(err.response ? err.response.data : err.toString());
        });
      });
    };

  }).then(() => {
    log('Finished uploading, total:', nUploadedQuads, 'quads');
  });
};
