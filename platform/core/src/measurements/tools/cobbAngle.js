const displayFunction = data => {
  let text = '';
  text = 'cobbAngle';
  return text;
};

export const cobbAngle = {
  id: 'CobbAngle',
  name: 'CobbAngle',
  toolGroup: 'allTools',
  cornerstoneToolType: 'CobbAngle',
  options: {
    measurementTable: {
      displayFunction,
    },
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
