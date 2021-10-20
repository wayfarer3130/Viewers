import { Icon, SelectTree } from '@ohif/ui';
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash.clonedeep';

import LabellingTransition from './LabellingTransition.js';
import { ConfigPoint, safeFunction } from 'config-point';
import './OHIFLabellingData';
import EditDescriptionDialog from './../EditDescriptionDialog/EditDescriptionDialog.js';
import './LabellingFlow.css';

const toItems = (items, prefix = '') => {
  if (!items) return;
  if (!Array.isArray(items)) {
    throw Error(`Items ${items} isn't an array`);
  }
  return items.filter(item => item).map(item => {
    if (typeof item === 'string') {
      return { label: item, value: `${prefix}${item}` };
    }
    const ret = { ...item };
    if (!item.value) ret.value = `${prefix}${item.label} `;
    if (!item.label) ret.label = ret.value;
    if (item.items) {
      ret.items = toItems(item.items, ret.value + ">");
    }
    if (item.select) {
      ret.selectFunc = safeFunction(item.select);
    }
    return ret;
  });
};

/**
 * Allow configuring GUISettings.measurements.labellingData to point to a
 * custom ConfigPoint theme value of the given name.  The default here
 * points to 'BodyPartLabellingData' defined in OHIFLabellingData.js
 */
const { GUISettings } = ConfigPoint.register({
  GUISettings: {
    measurements: {
      labellingData: 'BodyPartLabellingData',
    },
  },
});

/** Finds the node containing the specified value, as a "tree" node, that is,
 * not the child elements, but the parent value containing it if it isn't a child element itself.
 */
const findNode = (node, location, props) => {
  if (!node) return;
  const { items } = node;
  if (!items) return;
  for (const item of items) {
    if (item.selectFunc) {
      try {
        if (item.selectFunc(props)) {

          return item.items && item || node;
        }
      } catch (e) {
        console.log('Calling selectFunc', item.select, 'on', props, 'failed');
      }
    } else if (item.value === location) {
      return item.items && item || node;
    }
    const subItem = findNode(item, location, props);
    if (subItem) {
      return subItem;
    }
  }
};

const LabellingFlow = (props) => {
  const {
    measurementData,
    editLocation,
    editDescription,
    skipAddLabelButton,
    updateLabelling,
    labellingDoneCallback,
    editDescriptionOnDialog,
    configPoint = GUISettings,
  } = props;
  const initialLocation = measurementData.location;
  const [fadeOutTimer, setFadeOutTimer] = useState();
  const [showComponent, setShowComponent] = useState(true);
  const descriptionInput = useRef();
  const [state, setState] = useState({
    measurementData,
    editLocation,
    editDescription,
    skipAddLabelButton,
  });
  const labellingItems = ConfigPoint.getConfig(configPoint.measurements.labellingData).items;
  const descriptionPoint = ConfigPoint.getConfig(configPoint.measurements.descriptionData);
  const descriptionItems = descriptionPoint && descriptionPoint.items || undefined;

  useEffect(() => {
    const newMeasurementData = cloneDeep(measurementData);

    if (editDescription) {
      newMeasurementData.description = undefined;
    }

    if (editLocation) {
      newMeasurementData.location = undefined;
    }

    let newEditLocation = editLocation;
    if (!editDescription && !editLocation) {
      newEditLocation = true;
    }

    setState(state => ({
      ...state,
      editLocation: newEditLocation,
      measurementData: newMeasurementData,
    }));
  }, [editDescription, editLocation, measurementData]);

  useEffect(() => {
    if (descriptionInput.current) {
      descriptionInput.current.focus();
    }
  }, [state]);

  const relabel = event =>
    setState(state => ({ ...state, editLocation: true }));

  const setDescriptionUpdateMode = () => {
    descriptionInput.current.focus();
    setState(state => ({ ...state, editDescription: true }));
  };

  const descriptionCancel = () => {
    const { description = '' } = cloneDeep(state);
    descriptionInput.current.value = description;
    setState(state => ({ ...state, editDescription: false }));
  };

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      descriptionSave();
    }
  };

  const descriptionSave = () => {
    const description = descriptionInput.current.value;
    updateLabelling({ description });

    setState(state => ({
      ...state,
      description,
      editDescription: false,
    }));
  };


  const selectDescriptionTreeSelectCallback = (event, itemSelected) => {
    const description = itemSelected.value;
    const descriptionLabel = itemSelected.label;
    descriptionDialogUpdate(description);
  };

  const selectTreeSelectCallback = (event, itemSelected) => {
    const location = itemSelected.value;
    const locationLabel = itemSelected.label;
    const description = itemSelected.description;
    updateLabelling({ location, description });

    setState(state => ({
      ...state,
      editLocation: false,
      measurementData: {
        ...state.measurementData,
        location,
        locationLabel,
      },
    }));
  };

  const showLabelling = () => {
    setState(state => ({
      ...state,
      skipAddLabelButton: true,
      editLocation: false,
    }));
  };

  /*
   * Waits for 1 sec to dismiss the labelling component.
   *
   */
  const fadeOutAndLeave = () =>
    setFadeOutTimer(setTimeout(fadeOutAndLeaveFast, 1000));

  const fadeOutAndLeaveFast = () => setShowComponent(false);

  const clearFadeOutTimer = () => {
    if (fadeOutTimer) {
      clearTimeout(fadeOutTimer);
      setFadeOutTimer(null);
    }
  };

  const descriptionDialogUpdate = description => {
    updateLabelling({ description });
    labellingDoneCallback();
  };

  const labellingStateFragment = () => {
    const { skipAddLabelButton, editLocation, measurementData } = state;
    const { description, locationLabel, location } = measurementData;

    if (!skipAddLabelButton) {
      return (
        <button
          type="button"
          className="addLabelButton"
          onClick={showLabelling}
        >
          {location ? 'Edit' : 'Add'} Label
        </button>
      );
    } else {
      if (editLocation) {
        const computedItems = toItems(labellingItems);
        const currentNode = findNode({ label: 'Root', value: '', items: computedItems }, initialLocation, props);

        return (
          <SelectTree
            items={computedItems}
            columns={1}
            currentNode={currentNode}
            onSelected={selectTreeSelectCallback}
            selectTreeFirstTitle="Assign Label"
          />
        );
      } else {
        return (
          <>
            <div className="checkIconWrapper" onClick={fadeOutAndLeaveFast}>
              <Icon name="check" className="checkIcon" />
            </div>
            <div className="locationDescriptionWrapper">
              <div className="location">{location}</div>
              <div className="description">
                <input
                  id="descriptionInput"
                  ref={descriptionInput}
                  defaultValue={description || ''}
                  autoComplete="off"
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
            <div className="commonButtons">
              <button
                type="button"
                className="commonButton left"
                onClick={relabel}
              >
                Relabel
              </button>
              <button
                type="button"
                className="commonButton right"
                onClick={setDescriptionUpdateMode}
              >
                {description ? 'Edit ' : 'Add '}
                Description
              </button>
            </div>
            <div className="editDescriptionButtons">
              <button
                type="button"
                className="commonButton left"
                onClick={descriptionCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="commonButton right"
                onClick={descriptionSave}
              >
                Save
              </button>
            </div>
          </>
        );
      }
    }
  };

  if (editDescriptionOnDialog) {
    const computedItems = toItems(descriptionItems);
    const currentNode = findNode({ value: '', items: computedItems }, initialLocation, props);
    return (
      <EditDescriptionDialog
        onCancel={labellingDoneCallback}
        onUpdate={descriptionDialogUpdate}
        measurementData={state.measurementData}
      >
        {computedItems && (<SelectTree
          items={computedItems}
          columns={1}
          currentNode={currentNode}
          onSelected={selectDescriptionTreeSelectCallback}
          selectTreeFirstTitle="Description"
        />)}
      </EditDescriptionDialog>
    );
  }

  return (
    <LabellingTransition
      displayComponent={showComponent}
      onTransitionExit={labellingDoneCallback}
    >
      <>
        <div
          className={`labellingComponent ${state.editDescription &&
            'editDescription'}`}
          onMouseLeave={fadeOutAndLeave}
          onMouseEnter={clearFadeOutTimer}
        >
          {labellingStateFragment()}
        </div>
      </>
    </LabellingTransition>
  );
};

LabellingFlow.propTypes = {
  measurementData: PropTypes.object.isRequired,
  labellingDoneCallback: PropTypes.func.isRequired,
  updateLabelling: PropTypes.func.isRequired,
  initialTopDistance: PropTypes.number,
  skipAddLabelButton: PropTypes.bool,
  editLocation: PropTypes.bool,
  editGroup: PropTypes.bool,
  editDescription: PropTypes.bool,
  editDescriptionOnDialog: PropTypes.bool,
};

LabellingFlow.defaultProps = {
  skipAddLabelButton: false,
  editLocation: false,
  editDescription: false,
  editDescriptionOnDialog: false,
  editGroup: false,
};

export default LabellingFlow;
