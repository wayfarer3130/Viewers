import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import DicomMicroscopyViewport from './DicomMicroscopyViewport';

const { setViewportActive } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const { viewportIndex } = ownProps;
  const { activeViewportIndex } = state.viewports;

  return {
    viewportIndex,
    activeViewportIndex,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex } = ownProps;

  return {
    setViewportActive: () => {
      dispatch(setViewportActive(viewportIndex));
    },
  };
};

const ConnectedDicomMicroscopyViewport = connect(
  mapStateToProps,
  mapDispatchToProps
)(DicomMicroscopyViewport);

export default ConnectedDicomMicroscopyViewport;
