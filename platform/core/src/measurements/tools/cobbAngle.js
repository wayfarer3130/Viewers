const displayFunction = data => {
  let text = '';
  if (data.rAngle) {
    text = data.rAngle.toFixed(2) + ' °';
  }
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
