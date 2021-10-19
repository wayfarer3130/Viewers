import ConfigPoint from 'config-point';
import { allTools } from './toolGroups/allTools';
import {
  retrieveMeasurements,
  storeMeasurements,
  retrieveTimepoints,
  storeTimepoints,
  removeTimepoint,
  updateTimepoint,
  disassociateStudy,
} from './dataExchange';

const { MeasurementToolsConfigPoint } = ConfigPoint.register({
  MeasurementToolsConfigPoint: {
    measurementTools: [allTools],
    newLesions: [
      {
        id: 'newTargets',
        name: 'New Targets',
        toolGroupId: 'targets',
      },
      {
        id: 'newNonTargets',
        name: 'New Non-Targets',
        toolGroupId: 'nonTargets',
      },
    ],
  },
});

const measurementApiDefaultConfig = {
  dataExchange: {
    retrieve: retrieveMeasurements,
    store: storeMeasurements,
  },
};

const timepointApiDefaultConfig = {
  dataExchange: {
    retrieve: retrieveTimepoints,
    store: storeTimepoints,
    remove: removeTimepoint,
    update: updateTimepoint,
    disassociate: disassociateStudy,
  },
};

export {
  measurementApiDefaultConfig, timepointApiDefaultConfig,
  MeasurementToolsConfigPoint,
};
