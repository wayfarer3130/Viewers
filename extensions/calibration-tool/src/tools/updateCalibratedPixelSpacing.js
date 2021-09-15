import {
  globalImageIdSpecificToolStateManager,
  importInternal,
  EVENTS,
} from 'cornerstone-tools';
import { metaData, updateImage } from 'cornerstone-core';
import MetadataProvider from '../MetadataProvider';
import toolNames from './toolNames';
const triggerEvent = importInternal('util/triggerEvent');

/**
 * Calculates new pixel space and update all measurement tools
 *
 * @param {Object} element cornerstone enabled element
 * @param {string} imageId Image Id
 * @param {number} lengthInVoxels Length of the input line in voxels.
 * @param {string} text New length tool as string value
 * @param {string} unit Math symbol for unit of measurement
 * @return {boolean} Return true in case of success
 */
export default function updateCalibratedPixelSpacing(
  element,
  imageId,
  lengthInVoxels,
  text,
  unit
) {
  let updated = _updateMetadataProvider(imageId, lengthInVoxels, text, unit);

  if (updated) {
    // use a mapping to define which measurement to update
    const measurementsIdsToUpdate = {};
    updated = _iterateMeasurementsData(
      imageId,
      _hasMeasurementInvalidatedProp,
      measurementData => {
        measurementsIdsToUpdate[measurementData._id] = true;
        return _invalidateMeasurement(measurementData);
      }
    );

    // wait a bit until tools data is updated (it occurs only after next rendering process)
    setTimeout(() => {
      const measurements = [];
      // looks for measurements from measurementsIdsToUpdate mapping
      _iterateMeasurementsData(
        imageId,
        () => true,
        measurementData => {
          if (measurementsIdsToUpdate[measurementData._id]) {
            measurements.push({
              toolType: measurementData.toolType,
              toolName: measurementData.toolType,
              measurementData,
            });
          }
        }
      );

      _triggerModifiedBatchEvent(element, measurements);
    }, 300);
    updateImage(element);
  }

  return updated;
}

const imagePlaneModule = 'imagePlaneModule';
/**
 * Method to update local metadata provider with new pixel spacing
 *
 * @param {string} imageId Image Id
 * @param {number} lengthInVoxels Length of the input line in voxels
 * @param {string} textValue New length tool as string value
 * @param {string} unit Math symbol for unit of measurement
 * @return {boolean} Return true in case of provider successfully updated
 */
const _updateMetadataProvider = (imageId, lengthInVoxels, textValue, unit) => {
  const convertToMM = (num, unit) => {
    let scale = 1;
    switch (unit) {
      case 'um':
        scale = 0.001;
        break;
      case 'mm':
        scale = 1;
        break;
      case 'cm':
        scale = 10;
        break;
      case 'm':
        scale = 1000;
        break;
    }
    return (num *= scale);
  };
  // convert to mm base
  const newValueToMM = convertToMM(Number(textValue), unit);

  const currentMetadata = metaData.get(imagePlaneModule, imageId);
  let newPixelSpacing = newValueToMM / lengthInVoxels;

  currentMetadata.pixelSpacing = [newPixelSpacing, newPixelSpacing];
  currentMetadata.rowPixelSpacing = newPixelSpacing;
  currentMetadata.columnPixelSpacing = newPixelSpacing;

  // update local data provider for each imageIds
  MetadataProvider.add(imagePlaneModule, currentMetadata, imageId);

  return true;
};

/**
 * Check if measurement data has invalidated prop or not.
 * @param {Object} measurementData Current measurement data to be validate
 * @return {boolean} True in case measurementData has invalidated prop
 */
const _hasMeasurementInvalidatedProp = measurementData =>
  'invalidated' in measurementData;
/**
 * Invalidate given measurementData, so its length will be recalculate on next tool rendering
 *
 * @param {Object} measurementData Current measurement data to be changed
 */
const _invalidateMeasurement = measurementData => {
  // from cornerstoneTools behavior
  // to recalculate length
  measurementData.invalidated = true;
  // to ensure this calculation is done right away (i.e when rendering) and its not throttled
  measurementData.length = undefined;
};
/**
 * Process measurement function, which triggers MEASUREMENT_MODIFIED for each one
 * @param {Object} element Enabled element
 * @param {Object} measurementData Trigger event for/with current measurement data
 */
const _triggerModifiedBatchEvent = (element, measurements) => {
  const modifiedEventData = {
    element,
    batch: true,
    measurements,
  };

  triggerEvent(element, EVENTS.MEASUREMENT_MODIFIED, modifiedEventData);
};

/**
 * Run into globalToolState tools and process each measurement data with given processMeasurement method.
 * @param {string} imageId Image Id
 * @param {function} isMeasurementValid Function to check if processMeasurement must be invoked or not.
 * @param {function} processMeasurement Function to be invoked on each measurement tool data.
 * @return {boolean} True in case processMeasurement method was successfully invoked.
 */
const _iterateMeasurementsData = (
  imageId,
  isMeasurementValid = _hasMeasurementInvalidatedProp,
  processMeasurement = _invalidateMeasurement
) => {
  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();
  if (!globalToolState) {
    return;
  }
  const measurementsCb = (measurements, prop, index) => {
    nestedIteration(measurements.data, isMeasurementValid, processMeasurement);
  };
  const imageSpecificCb = (imageSpecific, prop, index) => {
    const isValid = (toolValue, toolName) =>
      toolName && toolName !== toolNames.CALIBRATION_TOOL;
    nestedIteration(imageSpecific, isValid, measurementsCb);
  };
  nestedIteration(
    globalToolState,
    (imageObject, imageIdKey) => imageId === imageIdKey,
    imageSpecificCb
  );

  /**
   * Method to iterate over object keys and invoke a callback.
   *
   * @param {objection} object Current object to iterate
   * @param {function} [isValid] Function to check if it should iterate over nested object
   * @param {function} callback Function to iterate on nested object
   */
  function nestedIteration(object, isValid, callback) {
    const keysObject = Object.keys(object);
    for (let it = 0; it < keysObject.length; it++) {
      const objectPropKey = keysObject[it];
      const objectValue = object[objectPropKey];

      if (
        typeof isValid === 'function' &&
        !isValid(objectValue, objectPropKey, it)
      ) {
        continue;
      }

      callback(objectValue, objectPropKey, it);
    }
  }

  return true;
};
