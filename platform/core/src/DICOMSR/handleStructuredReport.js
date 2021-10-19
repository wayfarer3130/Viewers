import dcmjs from 'dcmjs';
import { api } from 'dicomweb-client';

import DICOMWeb from '../DICOMWeb';
import parseDicomStructuredReport from './parseDicomStructuredReport';
import parseMeasurementsData from './parseMeasurementsData';
import getAllDisplaySets from './utils/getAllDisplaySets';
import errorHandler from '../errorHandler';
import getXHRRetryRequestHook from '../utils/xhrRetryRequestHook';

const VERSION_NAME = 'dcmjs-0.0';
const TRANSFER_SYNTAX_UID = '1.2.840.10008.1.2.1';

/**
 * Function to retrieve measurements from DICOM Structured Reports coming from determined server
 *
 * @param {Array} series - List of all series metaData loaded
 * @param {Array} studies - List of all studies metaData loaded
 * @param {string} serverUrl - Server URL to be used on request
 * @returns {Object} MeasurementData
 */
const retrieveMeasurementFromSR = async (series, studies, serverUrl) => {
  const config = {
    url: serverUrl,
    headers: DICOMWeb.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
    requestHooks: [getXHRRetryRequestHook()],
  };

  const dicomWeb = new api.DICOMwebClient(config);

  const instance = series.getFirstInstance();
  const options = {
    studyInstanceUID: instance.getStudyInstanceUID(),
    seriesInstanceUID: instance.getSeriesInstanceUID(),
    sopInstanceUID: instance.getSOPInstanceUID(),
  };

  const part10SRArrayBuffer = await dicomWeb.retrieveInstance(options);
  const displaySets = getAllDisplaySets(studies);
  const measurementsData = parseDicomStructuredReport(
    part10SRArrayBuffer,
    displaySets
  );

  return measurementsData;
};

const saveByteArray = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, name) {
    var blob = new Blob([data], { type: "octet/stream" }),
      url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  };
}());

/**
 * Function to store measurements to DICOM Structured Reports in determined server
 *
 * @param {Object} measurements - OHIF measurementData object
 * @param {string} serverUrl - Server URL to be used on request
 * @returns {Promise}
 */
const stowSRFromMeasurements = async (measurements, serverUrl) => {
  const { dataset } = parseMeasurementsData(measurements);
  const { DicomMetaDictionary, DicomDict } = dcmjs.data;
  const meta = {
    FileMetaInformationVersion: dataset._meta.FileMetaInformationVersion.Value,
    MediaStorageSOPClassUID: dataset.SOPClassUID,
    MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
    TransferSyntaxUID: TRANSFER_SYNTAX_UID,
    ImplementationClassUID: DicomMetaDictionary.uid(),
    ImplementationVersionName: VERSION_NAME,
  };

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(meta);
  const dicomDict = new DicomDict(denaturalized);

  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);

  const part10Buffer = dicomDict.write();

  if (serverUrl === 'saveDicom') {
    saveByteArray(part10Buffer, `sr-${dicomDict.dict["00080018"].Value[0]}.dcm`);
    return;
  }

  const config = {
    url: serverUrl,
    headers: DICOMWeb.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
    requestHooks: [getXHRRetryRequestHook()],
  };

  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    datasets: [part10Buffer],
  };

  await dicomWeb.storeInstances(options);
};

export { retrieveMeasurementFromSR, stowSRFromMeasurements };
