# Blazegraph upload
Use these node.js scripts to bulk upload RDF files to Blazegraph

How to use:
- Clone this repo
- Run `yarn` or `npm install`
- Run the individual scrips as described below

## Usage for namespaces.js
This is used to create/delete a namespace(s) in Blazegraph

1. Provide upload information, e.g. `host`, `path`, `username`, `password` in the `uploadConfig.json` file
    ```js
    {
        "host": "http://localhost:8080",    // the web server that your blazegraph is running on
        "path": "/blazegraph",              // the URL path that points to the blazegraph instance
        "username": "",                     // optional basic authentication username
        "password": ""                      // optional basic authentication password
    }
    ```
```bash
$> node namespaces.js --operation=create --namespaces=ns1,ns2,ns3 --mode=triples
$> node namespaces.js --operation=delete --namespaces=ns1,ns2,ns3
```
- `--operation` - either `create` or `delete`
- `--namespaces` - the namespaces to be created/deleted
- `--mode` - the storage mode, either `triples` or `quads`


## Usage for stream-quad-upload.js
This is used to bulk upload LARGE ontology files to blazegraph in N-Quads mode. It converts the source files to a quad stream, automatically detects and inserts the ontology IRI as the 4th value to the quads.

***IMPORTANT*** You need to have [Apache Jena](https://jena.apache.org/download/index.cgi) setup in you environment. Read this [guide](https://jena.apache.org/documentation/tools/index.html) for the setup process. Long story short: 
- download `Apache Jena` archive, extract it, 
- set the environment variable `JENA_HOME` to that folder
- add the `bin` or `bat` directory to the `PATH` environment variable

Usage:
1. Create a namespace in Blazegraph workbench or using `create-namespace.js`, make sure to choose `quads` mode
1. Provide the paths of your source files to the `files.json` file
1. Provide upload information, e.g. `host`, `path`, `namespace`, `username`, `password` in the `uploadConfig.json` file
    ```js
    {
        "host": "http://localhost:8080",    // the web server that your blazegraph is running on
        "path": "/blazegraph",              // the URL path that points to the blazegraph instance
        "namespace": "kb",                  // the target namespace you created at step 1)
        "username": "",                     // optional basic authentication username
        "password": ""                      // optional basic authentication password
    }
    ```
1. Run in shell: 
    ```shell
    $> node stream-quad-upload.js
    ```


## Usage for upload.js
This is used to upload RDF files one by one to a Blazegraph instance in triples mode.

1. Create a namespace in Blazegraph workbench or using `create-namespace.js`, make sure to choose `triples` mode
1. Provide the paths of your source files to the `files.json` file
1. Provide upload information, e.g. `host`, `path`, `namespace`, `username`, `password` in the `uploadConfig.json` file
    ```js
    {
        "host": "http://localhost:8080",    // the web server that your blazegraph is running on
        "path": "/blazegraph",              // the URL path that points to the blazegraph instance
        "namespace": "kb",                  // the target namespace you created at step 1)
        "username": "",                     // optional basic authentication username
        "password": ""                      // optional basic authentication password
    }
    ```
1. Run in shell: 
    ```bash
    $> node upload.js
    ```
