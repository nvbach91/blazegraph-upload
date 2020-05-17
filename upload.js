const axios = require('axios');
const Promise = require('bluebird');
const fs = require('fs');

const mimeTypes = require('./mimeTypes.json');
const uploadConfig = require('./uploadConfig.json');
const files = require('./files.json');

const { host, path, namespace, username, password } = uploadConfig;
const url = `${host}${path}/namespace/${namespace}/sparql`;
const axiosOptions = {
  headers: {
    'Content-Type': mimeTypes['nq'],
    'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  },
};
console.log('Checking uploadConfig', uploadConfig);

const start = new Date();
axios.post(url, '', axiosOptions).then((resp) => {
  console.log('uploadConfig OK');
  return Promise.each(files, (file) => {
    axiosOptions.headers['Content-Type'] = mimeTypes[file.split('.').splice(-1).join()];
    const data = fs.readFileSync(file, 'utf8');
    // return Promise.delay(1000);
    return axios.post(url, data, axiosOptions).then((resp) => {
      console.log('DONE: ', file, resp.data);
    });
  });
}).then(() => {
  console.log('Finished after ', new Date() - start, 'ms');
}).catch((err) => {
  if (err.response) {
    console.error(err.response.status, err.response.statusText, err.response.data);
  } else {
    console.error(err);
  }
});
