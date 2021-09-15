import OHIF from '@ohif/core';
import dcmjs from 'dcmjs';
const FileType = require('newer-file-type');

const { DicomMessage, DicomMetaDictionary } = dcmjs.data;

const requestVideoFile = ({ url, triggerDownload = false }) =>
  new Promise((resolve, reject) => {
    try {
      var xhr = new XMLHttpRequest();
      const TransferSyntaxUIDTag = '00020010';
      xhr.open('GET', `${url}&includefield=${TransferSyntaxUIDTag}`, true);
      xhr.responseType = 'arraybuffer';
      xhr.withCredentials = true;
      const token = OHIF.user.getAccessToken();
      if (token) {
        xhr.setRequestHeader('Authorization', token);
      }
      xhr.onload = async function(e) {
        if (this.status == 200) {
          const dicomData = DicomMessage.readFile(this.response);
          const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
          const TransferSyntaxUID = dicomData.meta['00020010'].Value[0];
          const type = await FileType.fromBuffer(dataset.PixelData);

          const videoBlob = new Blob([dataset.PixelData], {
            type: type ? type.mime : 'video/mp4',
          });
          const videoObjectURL = (
            window.webkitURL || window.URL
          ).createObjectURL(videoBlob);

          resolve({
            src: videoObjectURL,
            type,
            dicomData,
            dataset,
            TransferSyntaxUID,
          });

          if (triggerDownload) {
            const a = document.createElement('a');
            a.href = videoObjectURL;
            a.download = `file.${type.ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      };
      xhr.onerror = error => reject(error);
      xhr.send();
    } catch (error) {
      reject(error);
    }
  });

export default requestVideoFile;
