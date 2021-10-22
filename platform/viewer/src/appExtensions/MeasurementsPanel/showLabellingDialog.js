import LabellingFlow from '../../components/Labelling/LabellingFlow';

const asArray = val => Array.isArray(val) && val || val && [val];

const _updateLabellingHandler = (commandsManager, labellingData, measurementData) => {
  const { location, locationLabel, description, response, } = labellingData;
  measurementData.findingSites = asArray(labellingData.findingSite) ||
    location && [{
      CodeValue: location,
      CodingSchemeDesignator: 'OHIF',
      CodeMeaning: !description && locationLabel || location,
    }] ||
    measurementData.findingSites;

  measurementData.finding = labellingData.finding ||
    description && {
      CodeValue: description,
      CodingSchemeDesignator: 'OHIF',
      CodeMeaning: description,
    } ||
    measurementData.finding;

  measurementData.location = location ||
    measurementData.findingSites && measurementData.findingSites[0].CodeValue ||
    measurementData.location;

  measurementData.description = description ||
    measurementData.finding && measurementData.finding.CodeValue ||
    measurementData.description;

  if (response) {
    measurementData.response = response;
  }

  commandsManager.runCommand(
    'updateTableWithNewMeasurementData',
    measurementData
  );
};

const showLabellingDialog = (commandsManager, UIDialogService, props, contentProps, measurementData) => {
  if (!UIDialogService) {
    console.warn('Unable to show dialog; no UI Dialog Service available.');
    return;
  }

  UIDialogService.create({
    id: 'labelling',
    isDraggable: false,
    showOverlay: true,
    centralize: true,
    content: LabellingFlow,
    contentProps: {
      measurementData,
      ...props.studyInfo,
      labellingDoneCallback: () =>
        UIDialogService.dismiss({ id: 'labelling' }),
      updateLabelling: labellingData =>
        _updateLabellingHandler(commandsManager, labellingData, measurementData),
      ...contentProps,
    },
    ...props,
  });
};

export default showLabellingDialog;
