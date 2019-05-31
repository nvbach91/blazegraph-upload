# Blazegraph upload
Use this script to bulk upload RDF files to Blazegraph

## Usage
```bash
$> node delete-namespace.js --namespaces=ns1,ns2,ns3
$> node create-namespace.js --namespaces=ns1,ns2,ns3
```
- `--namespaces` - name name of the namespaces to be deleted/created

```bash
$> node upload.js --directory=C:/path/to/rdf/files \
    [--host=http://localhost:8080] \
    [--path=/blazegraph] \
    [--namespace=kb] \
    [--username=admin] \
    [--password=admin]
```
- `--directory` - path to the folder containing RDF files, mandatory
- `--host` - where is blazegraph running at - default is `http://localhost:8080`
- `--path` - where is blazegraph running at - default is `/blazegraph`
- `--namespace` - the namespace for these data - default is `kb`
- `--username` - authorization username - default is `admin`
- `--password` - authorization password - default is `admin`
