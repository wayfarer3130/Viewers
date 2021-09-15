import microscopyManager from './tools/microscopyManager';

const commandsModule = () => {
  const actions = {
    toggleROIsVisibility: () => {
      microscopyManager.toggleROIsVisibility();
    },
    activateInteractions: ({ interactions }) => {
      if (!interactions) {
        console.warn(
          'No interactions provided to activateInteractions command'
        );
      }

      microscopyManager.activateInteractions(interactions);
    },
    toggleOverviewMap: ({ viewports }) => {
      microscopyManager.toggleOverviewMap(viewports.activeViewportIndex);
    },
  };

  const definitions = {
    toggleROIsVisibility: {
      commandFn: actions.toggleROIsVisibility,
      storeContexts: ['viewports'],
      options: {},
    },
    activateInteractions: {
      commandFn: actions.activateInteractions,
      storeContexts: ['viewports'],
      options: {},
    },
    toggleOverviewMap: {
      commandFn: actions.toggleOverviewMap,
      storeContexts: ['viewports'],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::MICROSCOPY',
  };
};

export default commandsModule;
