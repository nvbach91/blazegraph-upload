# Blazegraph upload
Use this script to bulk upload RDF files to Blazegraph

## Usage
```bash
$> node create-namespace.js --namespaces=bisnode-develop,bisnode-master
```
- `--namespaces` - name name of the namespaces to be created

```bash
$> node upload.js --directory=C:/path/to/rdf/files \
    [--host=http://localhost:8080] \
    [--path=/boss-blazegraph-s/v1] \
    [--namespace=kb] \
    [--username=admin] \
    [--password=pw123]
```
- `--directory` - path to the folder containing RDF files, mandatory
- `--host` - where is blazegraph running at - default is `http://localhost:8080`
- `--path` - where is blazegraph running at - default is `/boss-blazegraph-s/v1`
- `--namespace` - the namespace for these data - default is `kb`
- `--username` - authorization username - default is `admin`
- `--password` - authorization password - default is `pw123`
