import UICustomizationService from './UICustomizationService';
import log from '../../log';

jest.mock('../../log.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const extensionManager = {
  registeredExtensionIds: [],
  moduleEntries: {},

  getModuleEntry: function (id) {
    return this.moduleEntries[id];
  },
};

const commandsManager = {};

const ohifOverlayItem = {
  id: 'ohif.overlayItem',
  content: function (props) {
    return {
      label: this.label,
      value: props[this.attribute],
      ver: 'default',
    };
  },
};

const testItem = {
  id: 'testItem',
  uiType: 'ohif.overlayItem',
  attribute: 'testAttribute',
  label: 'testItemLabel',
};

describe('UICustomizationService.ts', () => {
  let uiCustomizationService;

  let configuration;

  beforeEach(() => {
    log.warn.mockClear();
    jest.clearAllMocks();
    configuration = {
      whiteLabeling: {},
    };
    uiCustomizationService = new UICustomizationService({
      configuration,
      commandsManager,
    });
  });

  describe('init', () => {
    it('init succeeds', () => {
      uiCustomizationService.init(extensionManager);
    });

    it('whiteLabellingRegistered', () => {
      configuration.whiteLabeling.testItem = testItem;
      uiCustomizationService.init(extensionManager);
      expect(uiCustomizationService.getGlobalCustomization('testItem')).toBe(
        testItem
      );
    });

    it('defaultRegistered', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries[
        '@testExtension.customizationModule.default'
      ] = { name: 'default', value: [testItem] };
      uiCustomizationService.init(extensionManager);
      expect(uiCustomizationService.getGlobalCustomization('testItem')).toBe(
        testItem
      );
    });
  });

  describe('uiType', () => {
    it('inherits type', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries[
        '@testExtension.customizationModule.default'
      ] = { name: 'default', value: [ohifOverlayItem] };
      configuration.whiteLabeling.testItem = testItem;
      uiCustomizationService.init(extensionManager);

      const item = uiCustomizationService.getGlobalCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('inline default inherits type', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries[
        '@testExtension.customizationModule.default'
      ] = { name: 'default', value: [ohifOverlayItem] };
      configuration.whiteLabeling.testItem = testItem;
      uiCustomizationService.init(extensionManager);

      const item = uiCustomizationService.getGlobalCustomization('testItem2', {
        id: 'testItem2',
        uiType: 'ohif.overlayItem',
        label: 'otherLabel',
        attribute: 'otherAttr',
      });

      // Customizes the default value, as this is testItem2
      const props = { otherAttr: 'other attribute value' };
      const result = item.content(props);
      expect(result.label).toBe('otherLabel');
      expect(result.value).toBe(props.otherAttr);
      expect(result.ver).toBe('default');
    });
  });

  describe('mode customization', () => {
    it('onModeEnter can add extensions', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries[
        '@testExtension.customizationModule.default'
      ] = { name: 'default', value: [ohifOverlayItem] };
      uiCustomizationService.init(extensionManager);

      expect(
        uiCustomizationService.getModeCustomization('testItem')
      ).toBeUndefined();

      uiCustomizationService.addModeCustomizations([testItem]);

      expect(
        uiCustomizationService.getGlobalCustomization('testItem')
      ).toBeUndefined();

      const item = uiCustomizationService.getModeCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
      expect(result.ver).toBe('default');
    });

    it('global customizations override modes', () => {
      extensionManager.registeredExtensionIds.push('@testExtension');
      extensionManager.moduleEntries[
        '@testExtension.customizationModule.default'
      ] = { name: 'default', value: [ohifOverlayItem] };
      configuration.whiteLabeling.testItem = testItem;
      uiCustomizationService.init(extensionManager);

      // Add a mode customization that would otherwise fail below
      uiCustomizationService.addModeCustomizations([
        { ...testItem, label: 'other' },
      ]);

      const item = uiCustomizationService.getModeCustomization('testItem');

      const props = { testAttribute: 'testAttrValue' };
      const result = item.content(props);
      expect(result.label).toBe(testItem.label);
      expect(result.value).toBe(props.testAttribute);
    });
  });
});
