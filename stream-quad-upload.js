/**
 * This tool is used to upload ontology files to blazegraph in N-Quads mode 
 * 1) Create a namespace in blazegraph workbench, choose `quads` mode
 * 2) Prepare a folder of ontology files and fill the path to these files in the items variable
 * 3) Provide upload information, e.g. host, path, namespace, username, password in the uploadConfig variable
 * 4) Run node stream-quad-upload
 */

const Promise = require('bluebird');
const axios = require('axios');
const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, defaultGraph } = DataFactory;
const spawn = require('child_process').spawn;
const stream = require('stream');

const nQuadsToUpload = 50000;

const uploadConfig = {
  host: 'http://localhost:8080',
  path: '/blazegraph',
  namespace: '',
  username: '',
  password: '',
};

const items = [
  { file: './files/cheminf.owl' },// graphIri: 'http://semanticchemistry.github.io/semanticchemistry/ontology/cheminf.owl' },
  { file: './files/iao.owl' },// graphIri: 'http://purl.obolibrary.org/obo/iao.owl' },
  { file: './files/bao.owl' },// graphIri: 'http://www.bioassayontology.org/bao/bao_complete.owl' },
  { file: './files/sio.owl' },// graphIri: 'http://semanticscience.org/ontology/sio.owl' },
  { file: './files/obi.owl' },// graphIri: 'http://purl.obolibrary.org/obo/obi.owl' },
  { file: './files/clo.owl' },// graphIri: 'http://purl.obolibrary.org/obo/clo.owl' },
  { file: './files/go.owl' },// graphIri: 'http://purl.obolibrary.org/obo/go.owl' },
  { file: './files/rxnorm.ttl' },// graphIri: 'http://purl.bioontology.org/ontology/RXNORM/' },
  { file: './files/chebi.owl' },// graphIri: 'http://purl.obolibrary.org/obo/chebi.owl' },
  { file: './files/ncit.owl' },// graphIri: 'http://purl.obolibrary.org/obo/ncit.owl' },
  { file: './files/ncbitaxon.ttl' },// graphIri: 'http://purl.bioontology.org/ontology/NCBITAXON/' },
  { file: './files/pr.owl' },// graphIri: 'http://purl.obolibrary.org/obo/pr.owl' },
];

Promise.each(items, (item) => operate(item)).then(() => {
  console.log('All files were uploaded');
}).catch((err) => {
  console.error(err.toString());
});


const operate = ({ file }) => {
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

    log('converting triples to quad stream');
    // run Jena Riot to convert the source files to nt format
    const cmd = spawn('riot.bat', [file]);
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
            // WARNING! the triple with <http://www.w3.org/2002/07/owl#Ontology> must be detected within the first load of triples, see variable `nQuadsToUpload`
            // we assume that owl:Ontologies will always have this triple as the first one
            tmpQuads.forEach((q) => q.graph = graph);
          }
          quad.graph = graph;
          tmpQuads.push(quad);
        }
        // when the bucket is full, upload the its content and when it's done, empty the bucket (to save memory) and continue the stream for more quads
        if (tmpQuads.length >= nQuadsToUpload) {
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
      console.error(file, 'there was an error/warning while converting triples to quad stream', data.toString());
      reject(data);
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
          console.error(err.response.data);
        });
      });
    };

  }).then(() => {
    log('Finished uploading, total:', nUploadedQuads, 'quads');
  });
};

const mimeTypes = {
  'rdf': 'application/rdf+xml',
  'rdfs': 'application/rdf+xml',
  'owl': 'application/rdf+xml',
  'xml': 'application/rdf+xml',
  'jsonld': 'application/ld+json',
  'nt': 'text/plain',
  'ntx': 'application/x-n-triples-RDR',
  'ttl': 'application/x-turtle',
  'ttlx': 'application/x-turtle-RDR',
  'n3': 'text/rdf+n3',
  'trix': 'application/trix',
  'trig': 'application/x-trig',
  'nq': 'text/x-nquads',
  'srj': 'application/sparql-results+json, application/json',
  'json': 'application/sparql-results+json, application/json',
};

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
