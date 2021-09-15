import { metaData, updateImage } from 'cornerstone-core';
import {
  addToolState,
  getToolState,
  importInternal,
  removeToolState,
  toolColors,
} from 'cornerstone-tools';
import calculateLengthInVoxels from './calculateLengthInVoxels';
import calculateLengthInImage from './calculateLengthInImage';
import updateCalibratedPixelSpacing from './updateCalibratedPixelSpacing';

import TOOL_NAMES from './toolNames';
const BaseAnnotationTool = importInternal('base/BaseAnnotationTool');
// Drawing
const draw = importInternal('drawing/draw');
const drawHandles = importInternal('drawing/drawHandles');
const drawLine = importInternal('drawing/drawLine');
const setShadow = importInternal('drawing/setShadow');
const getNewContext = importInternal('drawing/getNewContext');
// Manipulators
const moveNewHandle = importInternal('manipulators/moveNewHandle');

/**
 * @public
 * @class Calibration
 * @memberof Tools.Custom
 *
 * @classdesc Tool for measuring distances.
 * @extends Tools.Base.BaseAnnotationTool
 */
export default class Calibration extends BaseAnnotationTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: TOOL_NAMES.CALIBRATION_TOOL,
      supportedInteractionTypes: ['Mouse', 'Touch'],
      // TODO: Set when a tool is added
      options: {
        preventHandleOutsideImage: true,
      },
      configuration: {
        shadow: true,
        shadowColor: '#000000',
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        drawHandlesOnHover: false,
        doneCallibrationCallback: () => {},
      },
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);
    super(initialConfiguration);
    this.initialConfiguration = initialConfiguration;
    this.mergeOptions(initialConfiguration.options);
  }
  createNewMeasurement(eventData) {
    const { x, y } = eventData.currentPoints.image;
    return {
      visible: true,
      active: true,
      color: undefined,
      handles: {
        start: {
          x,
          y,
          highlight: true,
          active: false,
        },
        end: {
          x,
          y,
          highlight: true,
          active: true,
        },
      },
    };
  }

  addNewMeasurement(evt, interactionType) {
    const { element, image } = evt.detail;
    const measurementData = this.createNewMeasurement(evt.detail);
    addToolState(element, this.name, measurementData);
    updateImage(element);
    const toolOptions = Object.assign(
      {},
      {
        doneMovingCallback: event => {
          const imagePlane = metaData.get('imagePlaneModule', image.imageId);
          const rowPixelSpacing =
            (imagePlane ? imagePlane.rowPixelSpacing : image.rowPixelSpacing) ||
            1;
          const colPixelSpacing =
            (imagePlane
              ? imagePlane.columnPixelSpacing
              : image.columnPixelSpacing) || 1;
          const lengthInVoxels = calculateLengthInVoxels(
            measurementData.handles
          );
          const oldLength = calculateLengthInImage(
            measurementData.handles,
            rowPixelSpacing,
            colPixelSpacing
          );

          const _doneCallibrationCallback =
            this.configuration.doneCallibrationCallback || (() => {});

          _doneCallibrationCallback(
            measurementData,
            evt,
            oldLength,
            (text, unit) => {
              updateCalibratedPixelSpacing(
                element,
                image.imageId,
                lengthInVoxels,
                text,
                unit
              );
              removeToolState(element, this.name, measurementData);
            },
            () => {
              removeToolState(element, this.name, measurementData);
              updateImage(element);
            }
          );
        },
      },
      this.options
    );
    moveNewHandle(
      evt.detail,
      this.name,
      measurementData,
      measurementData.handles.end,
      toolOptions,
      interactionType
    );
  }

  pointNearTool(element, data, coords) {
    return false;
  }
  renderToolData(evt) {
    const eventData = evt.detail;
    const toolData = getToolState(evt.currentTarget, this.name);
    if (!toolData) {
      return;
    }
    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);
    const element = eventData.element;
    const config = this.configuration;
    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];
      if (data.visible === false) {
        continue;
      }
      draw(context, context => {
        setShadow(context, config);
        const color = toolColors.getColorIfActive(data);
        // Draw the measurement line
        drawLine(context, element, data.handles.start, data.handles.end, {
          color,
        });
        // Draw the handles
        const handleOptions = {
          color,
          drawHandlesIfActive: config && config.drawHandlesOnHover,
        };
        drawHandles(context, eventData, data.handles, handleOptions);
      });
    }
  }
}
