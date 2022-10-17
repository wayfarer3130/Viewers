import {
  getEnabledElement,
  StackViewport,
  volumeLoader,
  cache,
  utilities as csUtils,
} from '@cornerstonejs/core';
import {
  ToolGroupManager,
  Enums,
  segmentation,
  utilities as csToolsUtils,
} from '@cornerstonejs/tools';
import { ContextMenu } from '@ohif/ui';

import CornerstoneViewportDownloadForm from './utils/CornerstoneViewportDownloadForm';
import { connectToolsToMeasurementService } from './initMeasurementService';
import { getEnabledElement as OHIFgetEnabledElement } from './state';
import callInputDialog from './utils/callInputDialog';
import { setColormap } from './utils/colormap/transferFunctionHelpers';
import { getFirstAnnotationSelected } from './utils/measurementServiceMappings/utils/selection';
import defaultContextMenu from './defaultContextMenu';

const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    ViewportGridService,
    ToolGroupService,
    CineService,
    ToolBarService,
    uiCustomizationService,
    UIDialogService,
    MeasurementService,
    DisplaySetService,
    CornerstoneViewportService,
    SegmentationService,
    HangingProtocolService,
  } = servicesManager.services;

  const contextMenuController = new ContextMenu.Controller(
    servicesManager,
    commandsManager
  );

  /* Measurement Service */
  const measurementServiceSource = connectToolsToMeasurementService(
    MeasurementService,
    DisplaySetService,
    CornerstoneViewportService
  );

  function _getActiveEnabledElement() {
    const { activeViewportIndex } = ViewportGridService.getState();
    const { element } = OHIFgetEnabledElement(activeViewportIndex) || {};

    return element;
  }

  function _getActiveViewportEnabledElement() {
    const element = _getActiveEnabledElement();
    const enabledElement = getEnabledElement(element);
    return enabledElement;
  }

  function _getToolGroup(toolGroupId) {
    let toolGroupIdToUse = toolGroupId;

    if (!toolGroupIdToUse) {
      // Use the active viewport's tool group if no tool group id is provided
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { renderingEngineId, viewportId } = enabledElement;
      const toolGroup = ToolGroupManager.getToolGroupForViewport(
        viewportId,
        renderingEngineId
      );

      if (!toolGroup) {
        console.warn(
          'No tool group found for viewportId:',
          viewportId,
          'and renderingEngineId:',
          renderingEngineId
        );
        return;
      }

      toolGroupIdToUse = toolGroup.id;
    }

    const toolGroup = ToolGroupService.getToolGroup(toolGroupIdToUse);
    return toolGroup;
  }

  function _showViewerContextMenu(viewerElement, options) {
    let defaultPointsPosition = [];
    if (options.nearbyToolData) {
      defaultPointsPosition = commandsManager.runCommand(
        'getToolDataActiveCanvasPoints',
        { toolData: options.nearbyToolData }
      );
    }

    contextMenuController.showContextMenu(
      options,
      viewerElement,
      defaultPointsPosition
    );
  }

  const actions = {
    /** Show the specified context menu */
    showViewerContextMenu: providedOptions => {
      const viewerElement = _getActiveEnabledElement();

      const options = { ...providedOptions };
      const { event: evt } = options;
      const { useSelectedAnnotation, nearbyToolData, menuName } = options;

      if (menuName) {
        Object.assign(
          options,
          uiCustomizationService.getModeCustomization(
            menuName,
            defaultContextMenu
          )
        );
      }

      if (useSelectedAnnotation && !nearbyToolData) {
        const firstAnnotationSelected = getFirstAnnotationSelected(
          viewerElement
        );
        // filter by allowed selected tools from config property (if there is any)
        if (
          !options.allowedSelectedTools ||
          options.allowedSelectedTools.includes(
            firstAnnotationSelected?.metadata?.toolName
          )
        ) {
          options.nearbyToolData = firstAnnotationSelected;
        } else {
          return;
        }
      }

      // TODO - make the checkProps richer by including the study metadata and display set.
      options.checkProps = {
        toolName: options.nearbyToolData?.metadata?.toolName,
        value: options.nearbyToolData,
        uid: options.nearbyToolData?.annotationUID,
        nearbyToolData: options.nearbyToolData,
      };

      _showViewerContextMenu(viewerElement, options);
    },

    /** Close any viewer context menus currently displayed */
    closeViewerContextMenu: () => {
      contextMenuController.closeViewerContextMenu();
    },

    getNearbyToolData({ nearbyToolData, element, canvasCoordinates }) {
      return (
        nearbyToolData ??
        csToolsUtils.getAnnotationNearPoint(element, canvasCoordinates)
      );
    },

    // Measurement tool commands:
    deleteMeasurement: ({ uid }) => {
      if (uid) {
        measurementServiceSource.remove(uid);
      }
    },
    setLabel: ({ uid }) => {
      const measurement = MeasurementService.getMeasurement(uid);

      callInputDialog(
        UIDialogService,
        measurement,
        (label, actionId) => {
          if (actionId === 'cancel') {
            return;
          }

          const updatedMeasurement = Object.assign({}, measurement, {
            label,
          });

          MeasurementService.update(
            updatedMeasurement.uid,
            updatedMeasurement,
            true
          );
        },
        false
      );
    },

    updateMeasurement: props => {
      const { code, uid, measurementKey = 'finding' } = props;
      const measurement = MeasurementService.getMeasurement(uid);
      const updatedMeasurement = {
        ...measurement,
        [measurementKey]: code,
        label: code.text,
      };
      MeasurementService.update(
        updatedMeasurement.uid,
        updatedMeasurement,
        true
      );
    },

    // Retrieve value commands
    getActiveEnabledElement: _getActiveEnabledElement,
    getActiveViewportEnabledElement: () => {
      return _getActiveViewportEnabledElement();
    },
    setViewportActive: ({ viewportId }) => {
      const viewportInfo = CornerstoneViewportService.getViewportInfo(
        viewportId
      );
      if (!viewportInfo) {
        console.warn('No viewport found for viewportId:', viewportId);
        return;
      }

      const viewportIndex = viewportInfo.getViewportIndex();
      ViewportGridService.setActiveViewportIndex(viewportIndex);
    },
    arrowTextCallback: ({ callback, data }) => {
      callInputDialog(UIDialogService, data, callback);
    },
    toggleCine: () => {
      const { viewports } = ViewportGridService.getState();
      const { isCineEnabled } = CineService.getState();
      CineService.setIsCineEnabled(!isCineEnabled);
      ToolBarService.setButton('Cine', { props: { isActive: !isCineEnabled } });
      viewports.forEach((_, index) =>
        CineService.setCine({ id: index, isPlaying: false })
      );
    },
    setWindowLevel({ window, level, toolGroupId }) {
      // convert to numbers
      const windowWidthNum = Number(window);
      const windowCenterNum = Number(level);

      const { viewportId } = _getActiveViewportEnabledElement();
      const viewportToolGroupId = ToolGroupService.getToolGroupForViewport(
        viewportId
      );

      if (toolGroupId && toolGroupId !== viewportToolGroupId) {
        return;
      }

      // get actor from the viewport
      const renderingEngine = CornerstoneViewportService.getRenderingEngine();
      const viewport = renderingEngine.getViewport(viewportId);

      const { lower, upper } = csUtils.windowLevel.toLowHighRange(
        windowWidthNum,
        windowCenterNum
      );

      viewport.setProperties({
        voiRange: {
          upper,
          lower,
        },
      });
      viewport.render();
    },
    toggleCrosshairs({ toolGroupId, toggledState }) {
      const toolName = 'Crosshairs';
      // If it is Enabled
      if (toggledState) {
        actions.setToolActive({ toolName, toolGroupId });
        return;
      }
      const toolGroup = _getToolGroup(toolGroupId);

      if (!toolGroup) {
        return;
      }

      toolGroup.setToolDisabled(toolName);

      // Get the primary toolId from the ToolBarService and set it to active
      // Since it was set to passive if not already active
      const primaryActiveTool = ToolBarService.state.primaryToolId;
      if (
        toolGroup?.toolOptions[primaryActiveTool]?.mode ===
        Enums.ToolModes.Passive
      ) {
        toolGroup.setToolActive(primaryActiveTool, {
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        });
      }
    },
    setToolActive: ({ toolName, toolGroupId = null }) => {
      const toolGroup = _getToolGroup(toolGroupId);

      if (!toolGroup) {
        console.warn('No tool group found for toolGroupId:', toolGroupId);
        return;
      }
      // Todo: we need to check if the viewports of the toolGroup is actually
      // parts of the ViewportGrid's viewports, if not we return

      const { viewports } = ViewportGridService.getState() || {
        viewports: [],
      };

      // iterate over all viewports and set the tool active for the
      // viewports that belong to the toolGroup
      for (let index = 0; index < viewports.length; index++) {
        const ohifEnabledElement = OHIFgetEnabledElement(index);

        if (!ohifEnabledElement) {
          continue;
        }

        const viewport = getEnabledElement(ohifEnabledElement.element);

        if (!viewport) {
          continue;
        }

        // Find the current active tool and set it to be passive
        const activeTool = toolGroup.getActivePrimaryMouseButtonTool();

        if (activeTool) {
          toolGroup.setToolPassive(activeTool);
        }

        // Set the new toolName to be active
        toolGroup.setToolActive(toolName, {
          bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
        });

        return;
      }
    },
    showDownloadViewportModal: () => {
      const { activeViewportIndex } = ViewportGridService.getState();
      const { UIModalService } = servicesManager.services;

      if (UIModalService) {
        UIModalService.show({
          content: CornerstoneViewportDownloadForm,
          title: 'Download High Quality Image',
          contentProps: {
            activeViewportIndex,
            onClose: UIModalService.hide,
            CornerstoneViewportService,
          },
        });
      }
    },
    rotateViewport: ({ rotation }) => {
      const enabledElement = _getActiveViewportEnabledElement();
      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
        const { rotation: currentRotation } = viewport.getProperties();
        const newRotation = (currentRotation + rotation) % 360;
        viewport.setProperties({ rotation: newRotation });
        viewport.render();
      }
    },
    flipViewportHorizontal: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
        const { flipHorizontal } = viewport.getCamera();
        viewport.setCamera({ flipHorizontal: !flipHorizontal });
        viewport.render();
      }
    },
    flipViewportVertical: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
        const { flipVertical } = viewport.getCamera();
        viewport.setCamera({ flipVertical: !flipVertical });
        viewport.render();
      }
    },
    invertViewport: ({ element }) => {
      let enabledElement;

      if (element === undefined) {
        enabledElement = _getActiveViewportEnabledElement();
      } else {
        enabledElement = element;
      }

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
        const { invert } = viewport.getProperties();
        viewport.setProperties({ invert: !invert });
        viewport.render();
      }
    },
    resetViewport: () => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
        viewport.resetProperties();
        viewport.resetCamera();
        viewport.render();
      }
    },
    scaleViewport: ({ direction }) => {
      const enabledElement = _getActiveViewportEnabledElement();
      const scaleFactor = direction > 0 ? 0.9 : 1.1;

      if (!enabledElement) {
        return;
      }
      const { viewport } = enabledElement;

      if (viewport instanceof StackViewport) {
        if (direction) {
          const { parallelScale } = viewport.getCamera();
          viewport.setCamera({ parallelScale: parallelScale * scaleFactor });
          viewport.render();
        } else {
          viewport.resetCamera();
          viewport.render();
        }
      }
    },
    scroll: ({ direction }) => {
      const enabledElement = _getActiveViewportEnabledElement();

      if (!enabledElement) {
        return;
      }

      const { viewport } = enabledElement;
      const options = { delta: direction };

      csToolsUtils.scroll(viewport, options);
    },
    async createSegmentationForDisplaySet({ displaySetInstanceUID }) {
      const volumeId = displaySetInstanceUID;

      const segmentationUID = csUtils.uuidv4();
      const segmentationId = `${volumeId}::${segmentationUID}`;

      await volumeLoader.createAndCacheDerivedVolume(volumeId, {
        volumeId: segmentationId,
      });

      // Add the segmentations to state
      segmentation.addSegmentations([
        {
          segmentationId,
          representation: {
            // The type of segmentation
            type: Enums.SegmentationRepresentations.Labelmap,
            // The actual segmentation data, in the case of labelmap this is a
            // reference to the source volume of the segmentation.
            data: {
              volumeId: segmentationId,
            },
          },
        },
      ]);

      return segmentationId;
    },
    async addSegmentationRepresentationToToolGroup({
      segmentationId,
      toolGroupId,
      representationType,
    }) {
      // // Add the segmentation representation to the toolgroup
      await segmentation.addSegmentationRepresentations(toolGroupId, [
        {
          segmentationId,
          type: representationType,
        },
      ]);
    },
    getLabelmapVolumes: ({ segmentations }) => {
      if (!segmentations || !segmentations.length) {
        segmentations = SegmentationService.getSegmentations();
      }

      const labelmapVolumes = segmentations.map(segmentation => {
        return cache.getVolume(segmentation.id);
      });

      return labelmapVolumes;
    },
    setViewportColormap: ({
      viewportIndex,
      displaySetInstanceUID,
      colormap,
      immediate = false,
    }) => {
      const viewport = CornerstoneViewportService.getCornerstoneViewportByIndex(
        viewportIndex
      );

      const actorEntries = viewport.getActors();

      const actorEntry = actorEntries.find(actorEntry => {
        return actorEntry.uid === displaySetInstanceUID;
      });

      const { actor: volumeActor } = actorEntry;

      setColormap(volumeActor, colormap);

      if (immediate) {
        viewport.render();
      }
    },
    incrementActiveViewport: () => {
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const nextViewportIndex = (activeViewportIndex + 1) % viewports.length;
      ViewportGridService.setActiveViewportIndex(nextViewportIndex);
    },
    decrementActiveViewport: () => {
      const { activeViewportIndex, viewports } = ViewportGridService.getState();
      const nextViewportIndex =
        (activeViewportIndex - 1 + viewports.length) % viewports.length;
      ViewportGridService.setActiveViewportIndex(nextViewportIndex);
    },
    setHangingProtocol: ({ protocolId }) => {
      HangingProtocolService.setProtocol(protocolId);
    },
  };

  const definitions = {
    showViewerContextMenu: {
      commandFn: actions.showViewerContextMenu,
      storeContexts: [],
      options: {},
    },
    closeViewerContextMenu: {
      commandFn: actions.closeViewerContextMenu,
      storeContexts: [],
      options: {},
    },
    getNearbyToolData: {
      commandFn: actions.getNearbyToolData,
      storeContexts: [],
      options: {},
    },

    deleteMeasurement: {
      commandFn: actions.deleteMeasurement,
      storeContexts: [],
      options: {},
    },
    setLabel: {
      commandFn: actions.setLabel,
      storeContexts: [],
      options: {},
    },
    setFinding: {
      commandFn: actions.updateMeasurement,
      storeContexts: [],
      options: { measurementKey: 'finding' },
    },
    setSite: {
      commandFn: actions.updateMeasurement,
      storeContexts: [],
      options: { measurementKey: 'site' },
    },

    setWindowLevel: {
      commandFn: actions.setWindowLevel,
      storeContexts: [],
      options: {},
    },
    setToolActive: {
      commandFn: actions.setToolActive,
      storeContexts: [],
      options: {},
    },
    toggleCrosshairs: {
      commandFn: actions.toggleCrosshairs,
      storeContexts: [],
      options: {},
    },
    rotateViewportCW: {
      commandFn: actions.rotateViewport,
      storeContexts: [],
      options: { rotation: 90 },
    },
    rotateViewportCCW: {
      commandFn: actions.rotateViewport,
      storeContexts: [],
      options: { rotation: -90 },
    },
    incrementActiveViewport: {
      commandFn: actions.incrementActiveViewport,
      storeContexts: [],
    },
    decrementActiveViewport: {
      commandFn: actions.decrementActiveViewport,
      storeContexts: [],
    },
    flipViewportHorizontal: {
      commandFn: actions.flipViewportHorizontal,
      storeContexts: [],
      options: {},
    },
    flipViewportVertical: {
      commandFn: actions.flipViewportVertical,
      storeContexts: [],
      options: {},
    },
    invertViewport: {
      commandFn: actions.invertViewport,
      storeContexts: [],
      options: {},
    },
    resetViewport: {
      commandFn: actions.resetViewport,
      storeContexts: [],
      options: {},
    },
    scaleUpViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: [],
      options: { direction: 1 },
    },
    scaleDownViewport: {
      commandFn: actions.scaleViewport,
      storeContexts: [],
      options: { direction: -1 },
    },
    fitViewportToWindow: {
      commandFn: actions.scaleViewport,
      storeContexts: [],
      options: { direction: 0 },
    },
    nextImage: {
      commandFn: actions.scroll,
      storeContexts: [],
      options: { direction: 1 },
    },
    previousImage: {
      commandFn: actions.scroll,
      storeContexts: [],
      options: { direction: -1 },
    },
    showDownloadViewportModal: {
      commandFn: actions.showDownloadViewportModal,
      storeContexts: [],
      options: {},
    },
    toggleCine: {
      commandFn: actions.toggleCine,
      storeContexts: [],
      options: {},
    },
    arrowTextCallback: {
      commandFn: actions.arrowTextCallback,
      storeContexts: [],
      options: {},
    },
    setViewportActive: {
      commandFn: actions.setViewportActive,
      storeContexts: [],
      options: {},
    },
    createSegmentationForDisplaySet: {
      commandFn: actions.createSegmentationForDisplaySet,
      storeContexts: [],
      options: {},
    },
    addSegmentationRepresentationToToolGroup: {
      commandFn: actions.addSegmentationRepresentationToToolGroup,
      storeContexts: [],
      options: {},
    },

    getLabelmapVolumes: {
      commandFn: actions.getLabelmapVolumes,
      storeContexts: [],
      options: {},
    },
    setViewportColormap: {
      commandFn: actions.setViewportColormap,
      storeContexts: [],
      options: {},
    },
    setHangingProtocol: {
      commandFn: actions.setHangingProtocol,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE',
  };
};

export default commandsModule;
