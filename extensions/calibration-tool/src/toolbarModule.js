import TOOL_NAMES from './tools/toolNames';

const TOOLBAR_BUTTON_TYPES = {
  SET_TOOL_ACTIVE: 'setToolActive',
};

const definitions = [
  {
    id: 'Calibration',
    label: 'Calibration',
    icon: 'measure-temp',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: TOOL_NAMES.CALIBRATION_TOOL },
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
