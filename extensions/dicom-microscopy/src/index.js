import React from 'react';
import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';
import DicomMicroscopySRSopClassHandler from './DicomMicroscopySRSopClassHandler.js';
import ToolbarModule from './toolbarModule';
import commandsModule from './commandsModule';
import microscopyManager from './tools/microscopyManager';
import MicroscopyPanel from './components/MicroscopyPanel/MicroscopyPanel';
import init from './init.js';
import MicroscopyViewportOverlay from './components/CornerstoneViewport/MicroscopyViewportOverlay';
import { SimpleDialog } from '@ohif/ui';
import { version } from '../package.json';

const Component = React.lazy(() => {
  return import('./OHIFDicomMicroscopyViewport');
});

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'microscopy',
  version,

  preRegistration({ servicesManager }) {
    init({ servicesManager, microscopyManager });
  },
  getViewportOverlayModule() {
    return {
      plugin: 'cornerstone',
      component: MicroscopyViewportOverlay,
    };
  },
  getViewportModule({ servicesManager }) {
    return props => {
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component {...props} servicesManager={servicesManager} />
        </React.Suspense>
      );
    };
  },
  getSopClassHandlerModule() {
    return [DicomMicroscopySopClassHandler, DicomMicroscopySRSopClassHandler];
  },
  getToolbarModule() {
    return ToolbarModule;
  },
  getCommandsModule() {
    return commandsModule();
  },
  getPanelModule({ appConfig, servicesManager }) {
    const { UINotificationService, UIDialogService } = servicesManager.services;

    const seriesDescriptionInputDialog = callback => {
      if (UIDialogService) {
        const dialogId = UIDialogService.create({
          centralize: true,
          isDraggable: false,
          content: SimpleDialog.InputDialog,
          useLastPosition: false,
          showOverlay: true,
          contentProps: {
            title: 'Enter the Series Description',
            label: 'Series Description',
            onClose: () => UIDialogService.dismiss({ id: dialogId }),
            onSubmit: value => {
              callback(value);
              UIDialogService.dismiss({ id: dialogId });
            },
          },
        });
      }
    };

    let server;

    if (
      appConfig.servers &&
      appConfig.servers.dicomWeb &&
      appConfig.servers.dicomWeb.length
    ) {
      server = appConfig.servers.dicomWeb[0];
    }

    const ExtendedMicroscopyPanel = props => {
      return (
        <MicroscopyPanel
          {...props}
          microscopyManager={microscopyManager}
          server={server}
          onSaveComplete={message => {
            if (UINotificationService) {
              UINotificationService.show(message);
            }
          }}
          onRejectComplete={message => {
            if (UINotificationService) {
              UINotificationService.show(message);
            }
          }}
          seriesDescriptionInputDialog={seriesDescriptionInputDialog}
        />
      );
    };

    return {
      menuOptions: [
        {
          icon: 'circle-o', // TODO: define a better icon
          label: 'Microscopy',
          target: 'microscopy-panel',
          isDisabled: studies => {
            if (!studies) {
              return true;
            }

            for (let i = 0; i < studies.length; i++) {
              const study = studies[i];

              if (study && study.series) {
                for (let j = 0; j < study.series.length; j++) {
                  const series = study.series[j];
                  if (series.Modality === 'SM') {
                    return false;
                  }
                }
              }
            }

            return true;
          },
        },
      ],
      components: [
        {
          id: 'microscopy-panel',
          component: ExtendedMicroscopyPanel,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
