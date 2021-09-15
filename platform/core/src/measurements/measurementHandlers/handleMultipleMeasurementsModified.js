import cornerstone from 'cornerstone-core';
import { MeasurementApi } from '../classes';
import log from '../../log';

export default function(eventData) {
  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const { measurements } = eventData;
  const toUpdateList = []

  for(let data of measurements) {
    const { measurementData, toolType } = data;
  
    const collection = measurementApi.tools[toolType];
  
    // Stop here if the tool data shall not be persisted (e.g. temp tools)
    if (!collection) return;
  
    log.info('CornerstoneToolsMeasurementsModified');
    let measurement = collection.find(t => t._id === measurementData._id);
  
    if (!measurement) return;
    measurement = Object.assign(measurement, measurementData);
    measurement.viewport = cornerstone.getViewport(eventData.element);
    
    toUpdateList.push({
      measurementData: measurement,
      toolType
    });
  }
  

  if(toUpdateList.length) {
    measurementApi.updateMeasurements(toUpdateList);
  }
}
