import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import microscopyManager from './tools/microscopyManager';
import ViewportOverlay from './components/ViewportOverlay/ViewportOverlay';
import './DicomMicroscopyViewport.css';

class DicomMicroscopyViewport extends Component {
  state = {
    error: null,
  };

  viewer = null;

  constructor(props) {
    super(props);

    this.container = React.createRef();
    this.overlayElement = React.createRef();

    this.debouncedResize = debounce(() => {
      if (this.viewer) this.viewer.resize();
    }, 100);
  }

  static propTypes = {
    viewportData: PropTypes.object,
    activeViewportIndex: PropTypes.number,
    setViewportActive: PropTypes.func,
    viewportIndex: PropTypes.number,
  };

  // install the microscopy renderer into the web page.
  // you should only do this once.
  installOpenLayersRenderer(container, displaySet) {
    const { dicomWebClient, StudyInstanceUID, SeriesInstanceUID } = displaySet;

    const searchInstanceOptions = {
      studyInstanceUID: StudyInstanceUID,
      seriesInstanceUID: SeriesInstanceUID,
    };

    const retrieveInstances = instances => {
      const promises = [];
      for (let i = 0; i < instances.length; i++) {
        const sopInstanceUID = instances[i]['00080018']['Value'][0];

        const retrieveInstanceOptions = {
          studyInstanceUID: StudyInstanceUID,
          seriesInstanceUID: SeriesInstanceUID,
          sopInstanceUID,
        };

        const promise = dicomWebClient
          .retrieveInstanceMetadata(retrieveInstanceOptions)
          .then(metadata => {
            const ImageType = metadata[0]['00080008']['Value'];
            if (ImageType[2] === 'VOLUME') {
              return metadata[0];
            }
          });
        promises.push(promise);
      }
      return Promise.all(promises);
    };

    const loadViewer = async metadata => {
      metadata = metadata.filter(m => m);

      const { api } = await import(
        /* webpackChunkName: "dicom-microscopy-viewer" */ 'dicom-microscopy-viewer'
      );
      const microscopyViewer = api.VLWholeSlideMicroscopyImageViewer;

      const options = {
        client: dicomWebClient,
        metadata,
        retrieveRendered: false,
        controls: ['overview'],
      };

      this.viewer = new microscopyViewer(options);

      if (this.overlayElement && this.overlayElement.current) {
        this.viewer.addViewportOverlay({
          element: this.overlayElement.current,
          className: 'OpenLayersOverlay',
        });
      }

      this.viewer.render({ container });

      const { studyInstanceUID, seriesInstanceUID } = searchInstanceOptions;
      microscopyManager.addViewer(
        this.viewer,
        this.props.viewportIndex,
        container,
        studyInstanceUID,
        seriesInstanceUID
      );
    };

    dicomWebClient
      .searchForInstances(searchInstanceOptions)
      .then(retrieveInstances)
      .then(loadViewer);
  }

  componentDidMount() {
    const { displaySet } = this.props.viewportData;
    this.installOpenLayersRenderer(this.container.current, displaySet);
  }

  componentWillUnmount() {
    microscopyManager.removeViewer(this.viewer);
  }

  setViewportActiveHandler = () => {
    const {
      setViewportActive,
      viewportIndex,
      activeViewportIndex,
    } = this.props;

    if (viewportIndex !== activeViewportIndex) {
      setViewportActive(viewportIndex);
    }
  };

  render() {
    const style = { width: '100%', height: '100%' };
    return (
      <div
        className={'DicomMicroscopyViewer'}
        style={style}
        onClick={this.setViewportActiveHandler}
      >
        <div style={{ ...style, display: 'none' }}>
          <div style={{ ...style }} ref={this.overlayElement}>
            <ViewportOverlay
              metadata={this.props.viewportData.displaySet.metadata}
            />
          </div>
        </div>
        {ReactResizeDetector && (
          <ReactResizeDetector
            handleWidth
            handleHeight
            onResize={this.onWindowResize}
          />
        )}
        {this.state.error ? (
          <h2>{JSON.stringify(this.state.error)}</h2>
        ) : (
          <div style={style} ref={this.container} />
        )}
      </div>
    );
  }

  onWindowResize = () => {
    this.debouncedResize();
  };
}

export default DicomMicroscopyViewport;
