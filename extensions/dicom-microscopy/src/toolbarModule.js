import styles from './utils/styles';

const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

const defaultInteractions = [
  [
    'dragZoom',
    {
      bindings: {
        mouseButtons: ['right'],
      },
    },
  ],
  [
    'dragPan',
    {
      bindings: {
        mouseButtons: ['middle'],
      },
    },
  ],
  ['modify', {}],
];

const definitions = [
  {
    id: 'Pan',
    label: 'Pan',
    icon: 'arrows',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ['dragPan', {}],
        [
          'dragZoom',
          {
            bindings: {
              mouseButtons: ['right'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'Translate',
    label: 'Translate',
    icon: 'arrows',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ['translate', {}],
        [
          'dragZoom',
          {
            bindings: {
              mouseButtons: ['right'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'Minimap',
    label: 'Minimap',
    icon: 'square-o',
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'toggleOverviewMap',
  },
  {
    id: 'Length',
    label: 'Length',
    icon: 'measure-temp',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'line',
            styleOptions: styles.default,
            markup: 'measurement',
            maxPoints: 1,
            minPoints: 1,
            vertexEnabled: false,
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'HideROIs',
    label: 'Hide ROIs',
    icon: 'eye-closed',
    type: TOOLBAR_BUTTON_TYPES.BUILT_IN,
    commandName: 'toggleROIsVisibility',
    commandOptions: {},
    options: {
      toggable: true,
    },
  },
  {
    id: 'FreeText',
    label: 'FreeText',
    icon: 'text',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'point',
            styleOptions: styles.default,
            markup: 'text',
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'Arrow',
    label: 'Arrow',
    icon: 'measure-non-target',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'point',
            styleOptions: styles.default,
            marker: 'arrow',
            markup: 'text',
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'ArrowLine',
    label: 'Arrow Line',
    icon: 'measure-non-target',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'line',
            styleOptions: styles.default,
            markup: 'text',
            marker: 'arrow',
            freehand: false,
            maxPoints: 1,
            minPoints: 1,
            vertexEnabled: false,
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  // {
  //   id: 'EllipseROI',
  //   label: 'Ellipse ROI',
  //   icon: 'ellipse-circle',
  //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
  //   commandName: 'activateInteractions',
  //   commandOptions: {
  //     interactions: [
  //       ...defaultInteractions,
  //       [
  //         'draw',
  //         {
  //           geometryType: 'ellipse',
  //           styleOptions: styles.default,
  //           markup: 'measurement',
  //           bindings: {
  //             mouseButtons: ['left'],
  //           },
  //         },
  //       ],
  //     ],
  //   },
  // },
  {
    id: 'CircleROI',
    label: 'Circle ROI',
    icon: 'circle-o',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'circle',
            styleOptions: styles.default,
            markup: 'measurement',
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'RectangleROI',
    label: 'Rectangle ROI',
    icon: 'square-o',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'box',
            styleOptions: styles.default,
            markup: 'measurement',
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'FreehandROI',
    label: 'Free Hand ROI',
    icon: 'edit',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'freehandpolygon',
            styleOptions: styles.default,
            markup: 'measurement',
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'PolygonROI',
    label: 'Polygon ROI',
    icon: 'star',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'polygon',
            styleOptions: styles.default,
            markup: 'measurement',
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
  {
    id: 'PointsROI',
    label: 'Point ROI',
    icon: 'dot-circle',
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'activateInteractions',
    commandOptions: {
      interactions: [
        ...defaultInteractions,
        [
          'draw',
          {
            geometryType: 'point',
            styleOptions: styles.default,
            bindings: {
              mouseButtons: ['left'],
            },
          },
        ],
      ],
    },
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::MICROSCOPY',
};
