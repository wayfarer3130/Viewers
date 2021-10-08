import { SET_ACTIVE_MEASUREMENTS, SET_MEASUREMENTS } from '../constants/ActionTypes';

const defaultState = {
  timepoints: [],
  measurements: [],
  activeMeasurement: undefined,
};

const timepointManager = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_TIMEPOINTS':
      return Object.assign({}, state, { timepoints: action.state });
    case SET_MEASUREMENTS:
      return Object.assign({}, state, { measurements: action.state });
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
