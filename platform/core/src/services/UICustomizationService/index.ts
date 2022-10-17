import UICustomizationService from './UICustomizationService';

const UICustomizationServiceRegistration = {
  name: 'uiCustomizationService',
  create: ({ configuration = {}, commandsManager }) => {
    return new UICustomizationService({ configuration, commandsManager });
  },
};

export default UICustomizationServiceRegistration;
export { UICustomizationService, UICustomizationServiceRegistration };
