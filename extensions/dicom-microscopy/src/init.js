import OHIF from '@ohif/core';
import { EVENTS as MicroscopyEvents } from './tools/microscopyManager';
import MicroscopyLabelDialog from './components/MicroscopyLabelDialog/MicroscopyLabelDialog';
import MicroscopyDeleteDialog from './components/MicroscopyDeleteDialog/MicroscopyDeleteDialog';

const { studyMetadataManager } = OHIF.utils;
const { setActiveViewportSpecificData } = OHIF.redux.actions;

/**
 * Initializer for the Microscopy feature
 *
 * @param {ServicesManager} servicesManager ServicesManager instance
 * @param {MicroscopyManager} microscopyManager MicroscopyManager instance
 */
export default function init({ servicesManager, microscopyManager }) {
  const { UIDialogService } = servicesManager.services;
  const commonDialogOptions = {
    centralize: true,
    isDraggable: false,
    useLastPosition: false,
    showOverlay: true,
  };

  /**
   * Subscribes to the RELABEL event and displays a dialog with an input that
   * will be used to relabel the RoiAnnotation instance in question
   */
  microscopyManager.subscribe(
    MicroscopyEvents.RELABEL,
    ({ roiAnnotation, deleteCallback, successCallback, newAnnotation = false }) => {
      if (!UIDialogService) {
        return;
      }

      const initialRoiLabel = roiAnnotation.label || '';

      const dialogId = UIDialogService.create({
        ...commonDialogOptions,
        content: MicroscopyLabelDialog,
        contentProps: {
          title: 'ROI Label',
          label: 'Label',
          defaultValue: initialRoiLabel,
          onClose: () => {
            if (newAnnotation) {
              // Delete new annotation if cancelled.
              deleteCallback();
            }

            UIDialogService.dismiss({ id: dialogId });
          },
          onSubmit: value => {
            if (!value) {
              deleteCallback();
            } else {
              roiAnnotation.setLabel(value);
              if (successCallback) successCallback(value);
            }

            UIDialogService.dismiss({ id: dialogId });
          },
        },
      });
    }
  );

  /**
   * Subscribes to the DELETE event and displays a confirmation dialog that
   * will be used to remove the RoiAnnotation instance in question
   */
  microscopyManager.subscribe(MicroscopyEvents.DELETE, roiAnnotation => {
    if (!UIDialogService) {
      return;
    }

    const dialogId = UIDialogService.create({
      ...commonDialogOptions,
      content: MicroscopyDeleteDialog,
      contentProps: {
        title: 'Delete ROI',
        onClose: () => {
          UIDialogService.dismiss({ id: dialogId });
        },
        onSubmit: () => {
          microscopyManager.removeAnnotation(roiAnnotation);
          UIDialogService.dismiss({ id: dialogId });
        },
      },
    });
  });

  /**
   * Subscribes to the ANNOTATION_SELECTED event and focus the RoiAnnotation
   * instance in question on the active viewport
   */
  microscopyManager.subscribe(
    MicroscopyEvents.ANNOTATION_SELECTED,
    roiAnnotation => {
      const { studyInstanceUID, seriesInstanceUID } = roiAnnotation;
      let displaySet;
      studyMetadataManager.all().every(studyMetadata => {
        const filter = displaySet =>
          displaySet.StudyInstanceUID === studyInstanceUID &&
          displaySet.SeriesInstanceUID === seriesInstanceUID;
        displaySet = studyMetadata.findDisplaySet(filter);
        return !displaySet;
      });

      if (displaySet) {
        const { store } = window;
        const { activeViewportIndex } = store.getState().viewports;
        store.dispatch(setActiveViewportSpecificData(displaySet));
        microscopyManager.focusAnnotation(roiAnnotation, activeViewportIndex);
      }
    }
  );
}
