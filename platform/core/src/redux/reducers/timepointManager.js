import { SET_ACTIVE_MEASUREMENTS, SET_CURRENT_LABEL, SET_MEASUREMENTS } from '../constants/ActionTypes';

const defaultState = {
  timepoints: [],
  measurements: [],
  activeMeasurement: undefined,
  currentLabel: undefined,
};

const assignCurrentLabel = (label, measurements) => {
  if (!label) return;
  Object.keys(measurements).forEach(toolType => {
    const value = measurements[toolType];
    if (!Array.isArray(value)) return;
    value.forEach(measure => {
      if (!measure.location) {
        measure.location = label;
      }
      console.log('measure=', measure);
    });
  });
}

const timepointManager = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_TIMEPOINTS':
      return Object.assign({}, state, { timepoints: action.state });
    case SET_MEASUREMENTS:
      const { currentLabel } = state;
      assignCurrentLabel(currentLabel, action.state);
      return Object.assign({}, state, { measurements: action.state });
    case SET_CURRENT_LABEL:
      const ret = Object.assign({}, state, { currentLabel: action.label });
      return ret;
    case SET_ACTIVE_MEASUREMENTS:
      return Object.assign({}, state, {
        activeMeasurements: Array.isArray(action.state)
          ? action.state
          : [action.state]
      });
    default:
      return state;
  }
};

export default timepointManager;
