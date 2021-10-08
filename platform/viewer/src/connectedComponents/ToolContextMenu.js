import { ContextMenu } from '@ohif/ui';
import PropTypes from 'prop-types';
import React from 'react';
import ViewportContextMenu from '../components/ViewportGrid/ViewportContextMenu.js';
import { commandsManager } from './../App.js';

const toolTypes = [
  'Angle',
  'Bidirectional',
  'Length',
  'FreehandMouse',
  'EllipticalRoi',
  'CircleRoi',
  'RectangleRoi',
];

const ToolContextMenu = (props) => {
  const {
    onSetLabel,
    onSetDescription,
    isTouchEvent,
    eventData,
    onClose,
    onDelete,
    contextMenuItems,
  } = props;
  const defaultDropdownItems = [
    {
      label: 'Delete measurement',
      actionType: 'Delete',
      action: ({ nearbyToolData, eventData }) =>
        onDelete(nearbyToolData, eventData),
    },
    {
      label: 'Relabel',
      actionType: 'setLabel',
      action: ({ nearbyToolData, eventData }) => {
        const { tool: measurementData } = nearbyToolData;
        onSetLabel(eventData, measurementData);
      },
    },
    {
      actionType: 'setDescription',
      action: ({ nearbyToolData, eventData }) => {
        const { tool: measurementData } = nearbyToolData;
        onSetDescription(eventData, measurementData);
      },
    },
  ];

  const getDropdownItems = (eventData, isTouchEvent = false) => {
    const nearbyToolData = commandsManager.runCommand('getNearbyToolData', {
      element: eventData.element,
      canvasCoordinates: eventData.currentPoints.canvas,
      availableToolTypes: toolTypes,
    });

    /*
     * Annotate tools for touch events already have a press handle to edit it,
     * has a better UX for deleting it.
     */
    if (
      isTouchEvent &&
      nearbyToolData &&
      nearbyToolData.toolType === 'arrowAnnotate'
    ) {
      return;
    }

    let dropdownItems = [];
    if (nearbyToolData) {
      defaultDropdownItems.forEach(item => {
        item.params = { eventData, nearbyToolData };

        if (item.actionType === 'setDescription') {
          item.label = `${
            nearbyToolData.tool.description ? 'Edit' : 'Add'
          } Description`;
        }

        dropdownItems.push(item);
      });
    } else if (contextMenuItems) {
      contextMenuItems.forEach(item => {
        dropdownItems.push(item);
      });
    }

    return dropdownItems;
  };

  const onClickHandler = ({ action, params }) => {
    if (action) action(params);
    if (onClose) {
      onClose();
    }
  };

  const dropdownItems = getDropdownItems(eventData, isTouchEvent);

  return (
    <div className="ToolContextMenu">
      <ContextMenu items={dropdownItems} onClick={onClickHandler} />
    </div>
  );
};

ToolContextMenu.propTypes = {
  isTouchEvent: PropTypes.bool.isRequired,
  eventData: PropTypes.object,
  onClose: PropTypes.func,
  onSetDescription: PropTypes.func,
  onSetLabel: PropTypes.func,
  onDelete: PropTypes.func,
};

ToolContextMenu.defaultProps = {
  isTouchEvent: false,
};

export default ToolContextMenu;
