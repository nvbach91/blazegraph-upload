# Blazegraph upload
Use these node.js scripts to bulk upload RDF files to Blazegraph in triples or quads mode via HTTP

How to use:
1. Clone this repo
1. Run `yarn` or `npm install`
1. Run the individual scrips as described below

## Usage for `namespaces.js`
This is used to create/delete a namespace(s) in Blazegraph

1. Provide upload information, e.g. `host`, `path`, `username`, `password` in the `upload-config.json` file
    ```js
    {
        "host": "http://localhost:8080",    // the web server that your blazegraph is running on
        "path": "/blazegraph",              // the URL path that points to the blazegraph instance
        "username": "",                     // optional basic authentication username
        "password": ""                      // optional basic authentication password
    }
    ```
2. Run in shell
    ```shell
    $> node namespaces.js --operation=create --namespaces=ns1,ns2,ns3 --mode=triples
    $> node namespaces.js --operation=delete --namespaces=ns1,ns2,ns3
    ```
    - `--operation` - either `create` or `delete`
    - `--namespaces` - the namespaces to be created/deleted
    - `--mode` - the storage mode, either `triples` or `quads`


## Usage for `convert-to-quad-upload.js`
This is used to bulk upload LARGE ontology files to blazegraph in N-Quads mode. It converts the source files to a quad stream, automatically detects and inserts the ontology IRI as the 4th value to the quads.

***IMPORTANT*** You need to have [Apache Jena](https://jena.apache.org/download/index.cgi) setup in you environment. Read this [guide](https://jena.apache.org/documentation/tools/index.html) for the setup process. Long story short: 
- download `Apache Jena` archive, extract it to a folder, 
- set the environment variable `JENA_HOME` to that folder,
- add the `bin` (unix) or `bat` (win) directory to the `PATH` environment variable
  - `export JENA_HOME=/home/nguv03/utilities/apache-jena-3.14.0/`
  - `export PATH=$PATH:$JENA_HOME/bin`

Usage:
1. Create a namespace in Blazegraph workbench or using `create-namespace.js`, make sure to choose `quads` mode
1. Provide the paths of your source files to the `files.json` file
    ```js
    [
        "/path/to/your/files/file.owl"
    ]
    ```
1. Provide upload information, e.g. `host`, `path`, `namespace`, `username`, `password` in the `upload-config.json` file
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
    $> node convert-to-quad-upload.js
    ```


## Usage for `file-upload.js`
This is used to upload RDF files one by one to a Blazegraph instance in triples mode.

1. Create a namespace in Blazegraph workbench or using `create-namespace.js`, make sure to choose `triples` mode
1. Provide the paths of your source files to the `files.json` file
    ```js
    [
        "/path/to/your/files/file.owl"
    ]
    ```
1. Provide upload information, e.g. `host`, `path`, `namespace`, `username`, `password` in the `upload-config.json` file
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
    $> node file-upload.js
    ```
