import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import CalibrationTool from './tools/CalibrationTool';
import metadataProvider from './MetadataProvider';
import CalibrationContent from './components/CalibrationDialog/CalibrationContent';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  const { UIDialogService } = servicesManager.services;

  const postCalibrationCallback = (evt, data, value, unitValue) => {
    const eventData = evt.detail;

    const { image } = eventData;
    const { imageId } = image;

    const {
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    } = cornerstone.metaData.get('instance', imageId);

    const imagePlaneModule = cornerstone.metaData.get(
      'imagePlaneModule',
      imageId
    );

    const calibrationData = {
      start: data.handles.start, // First point in image coordinates.
      end: data.handles.end, // Second point in image coordinates.
      length: value, // Calibrated length
      units: unitValue, // Units
      RowPixelSpacing: imagePlaneModule.rowPixelSpacing, // Row pixel spacing
      ColumnPixelSpacing: imagePlaneModule.columnPixelSpacing, // Column pixel spacing
      // Instance information
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
    };

    // Insert own post to backend here.
  };

  cornerstone.metaData.addProvider(
    metadataProvider.get.bind(metadataProvider),
    10000
  );

  const callInputDialog = (
    data,
    event,
    length,
    onSuccessCallback,
    onFailureCallback
  ) => {
    if (UIDialogService) {
      let dialogId = UIDialogService.create({
        centralize: true,
        isDraggable: false,
        content: CalibrationContent,
        useLastPosition: false,
        showOverlay: true,
        contentProps: {
          title: 'Enter your calibration',
          label: '',
          onClose: () => {
            onFailureCallback();
            UIDialogService.dismiss({ id: dialogId });
          },
          onSubmit: (value, unitValue) => {
            const calibrationChanged = onSuccessCallback(value, unitValue);
            postCalibrationCallback(event, data, value, unitValue);
            UIDialogService.dismiss({ id: dialogId });
          },
        },
      });
    }
  };

  const calibrationProps = {
    configuration: {
      doneCallibrationCallback: (
        data,
        event,
        length,
        onSuccessCallback,
        onFailureCallback
      ) =>
        callInputDialog(
          data,
          event,
          length,
          onSuccessCallback,
          onFailureCallback
        ),
    },
  };

  csTools.addTool(CalibrationTool, calibrationProps);
}
