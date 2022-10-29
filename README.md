# Blazegraph upload
Use these node.js scripts to bulk upload RDF files to Blazegraph in triples or quads mode via HTTP REST API

### Installation
- Node.js 18.12.0
```
$> npm install -g yarn
$> yarn
```

### Upload config
- Provide upload information, e.g. `host`, `path`, `namespace`, `username`, `password` in the `./config/upload-config.json` file
    ```js
    {
        "host": "http://localhost:8080",    // the web server that your blazegraph is running on
        "path": "/blazegraph",              // the URL path that points to the blazegraph instance
        "namespace": "kb",                  // the target namespace you created at step 1)
        "username": "",                     // optional basic authentication username
        "password": ""                      // optional basic authentication password
    }
    ```

### Usage for `namespaces.js`
This script is used to create/delete a namespace(s) in Blazegraph
- Run in shell
    ```bash
    $> node namespaces.js --operation=create --namespaces=ns1,ns2,ns3 --mode=triples
    $> node namespaces.js --operation=delete --namespaces=ns1,ns2,ns3
    ```
    - `--operation` - either `create` or `delete`
    - `--namespaces` - the namespaces to be created/deleted
    - `--mode` - the storage mode, either `triples`, `rdr` or `quads`

### Usage for `convert-to-quad-upload.js`
This is used to bulk upload LARGE ontology files to blazegraph in N-Quads mode. It converts the source files to a quad stream, automatically detects and inserts the ontology IRI as the 4th value to the quads.

***IMPORTANT!*** You need to have [Apache Jena](https://jena.apache.org/download/index.cgi) in you environment. Read this [guide](https://jena.apache.org/documentation/tools/index.html) for the setup process. Long story short: 
- download the `Apache Jena` archive, extract it to a folder,
- set the environment variable `JENA_HOME` to that folder,
- add the `bin` (unix) or `bat` (win) directory to the `PATH` environment variable
  - `export JENA_HOME=/home/nguv03/utilities/apache-jena-3.14.0/`
  - `export PATH=$PATH:$JENA_HOME/bin`

Usage:
- Create a namespace in Blazegraph workbench or using `create-namespace.js`, make sure to choose `quads` mode
- Provide the paths of your source files to the `files.json` file
    ```js
    [
        "/path/to/your/files/or/folder/file.owl"
    ]
    ```
- Run in shell: 
    ```bash
    $> node convert-to-quad-upload.js
    ```


### Usage for `file-upload.js`
This is used to upload RDF files one by one to a Blazegraph instance in triples mode.

- Create a namespace in Blazegraph workbench or using `create-namespace.js`, make sure to choose `triples` mode
- Provide the paths of your source files to the `files.json` file
    ```js
    [
        "/path/to/your/files//or/folder/file.owl"
    ]
    ```
- Run in shell: 
    ```bash
    $> node file-upload.js
    ```
