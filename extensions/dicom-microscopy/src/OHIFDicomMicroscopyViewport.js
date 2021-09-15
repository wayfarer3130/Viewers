import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConnectedDicomMicroscopyViewport from './ConnectedDicomMicroscopyViewport';

class OHIFDicomMicroscopyViewport extends Component {
  static propTypes = {
    viewportIndex: PropTypes.number,
    viewportData: PropTypes.object,
    activeViewportIndex: PropTypes.number,
  };

  state = {
    error: null,
  };

  render() {
    return (
      <>
        <ConnectedDicomMicroscopyViewport
          viewportIndex={this.props.viewportIndex}
          activeViewportIndex={this.props.activeViewportIndex}
          viewportData={this.props.viewportData}
        />
        {this.state.error && <h2>{JSON.stringify(this.state.error)}</h2>}
      </>
    );
  }
}

export default OHIFDicomMicroscopyViewport;
