---
sidebar_position: 3
sidebar_label: UI Modal Service
---
# UI Customization Service

There are a lot of places where users may want to configure certain elements
differently between different modes or for different deployments.  A mode
example might be the ability to select a different right click context menu
for the cornerstone extension.  A deployment example might be the ability to add
a selector for the data source back end to use to the study results table.

The use of this service enables these to be defined in a typed fashion by
providing an easy way to set default values for this, but to allow a non-default value to be specified by the configuration or mode.

This service is a UI service in that part of the registration allows for registering
UI components and types to deal with, but it does not directly provide an UI
displayable elements unless customized to do so.

## Registering Customizations
There are several ways to register customizations.  The `APP_CONFIG.whiteLabeling`
field is used as a per-configuration entry.  This object can list single
configurations by id, or it can list sets of customizations by referring to
the `customizationModule` in an extension.

As well, extensions can register default customizations by provided a 'default'
name key within the extension.

Mode specific customizations can be registered in the `onModeEnter` of the mode.
Note that mode specific customizations are CLEARED before this call is made
by a call to the `uiCustomizationService.onModeEnter` from the `ExtensionManager`.

The following example shows first the registration of the default values,
in this case they are base types which are inheritted later:

```js
// In the cornerstone extension  getCustomizationModule:
const getCustomizationModule = () => ([
  {
    name: 'default',
    value: [
      {
        id: 'ohif.cornerstoneContextMenu',
        commands: [... default commands for the context menu],
        content: CornerstoneOverlay,
        contentProps: ....
      },
      {
        id: 'ohif.menuItem',
        content: CornerstoneMenuItem,
      },
    ],
  },
]);
```

Then, in the configuration file one might have a custom overlay definition:

```js
// in the APP_CONFIG file set the top right area to show the patient name
// using PN: as a prefix when the study has a non-empty patient name.
whiteLabeling: {
  cornerstoneOverlayTopRight: {
    id: 'cornerstoneOverlayTopRight',
    items: [
      {
        id: 'PatientNameOverlay',
        // Note the overlayItem as a parent type - this provides the
        // rendering functionality to read the attribute and use the label.
        uiType: 'ohif.overlayItem',
        attribute: 'PatientName',
        label: 'PN:',
      },
    ],
  }
},
```

In the mode customization, the context menu is then customized:

```js
// First in ExtensionManager, the mode customizations are cleared by calling:
UICustomizationService.onModeEnter();

// Then in the mode itself, customizations can be registered:
onModeEnter() {
  ...
  uiCustomizationService.addModeCustomizations(
    {
      id: 'cornerstoneContextMenu',
      // Note the type is the previously registered ohif.cornerstoneContextMenu
      uiType: 'ohif.cornerstoneContextMenu',
      items: [
        // Custom definitions for hte context menu here.
      ],
    }
}
```

## Mode Customizations
The mode customizations are retrieved via the `getModeCustomization` function,
providing an id, and optionally a default value.  The retrieval will return,
in order:

1. Global customization with the given id.
2. Mode customization with the id.
3. The default value specified.

The return value then inherits the inheritted type value, so that the value can
be typed and have default values and functionality provided.  The object
can then be used in a way defined by the extension provided that customization
point.

```ts
   cornerstoneOverlay = uiConfigurationService.getModeCustomization("cornerstoneOverlay", {uiType: "ohif.cornerstoneOverlay", ...});
   const { component: overlayComponent, props} = uiConfigurationService.getComponent(cornerstoneOverlay);
   return (<defaultComponent {...props} overlay={cornerstoneOverlay}....></defaultComponent>);
```

This example shows fetching the default component to render this object.  The
returned object would be a sub-type of ohif.cornerstoneOverlay if defined.  This
object can be a React component or other object such as a commands list, for
example:


```ts
   cornerstoneContextMenu = uiConfigurationService.getModeCustomization("cornerstoneContextMenu", defaultMenu);
   uiConfigurationService.recordInteraction(cornerstoneContextMenu, extraProps);
```

## Global Customizations
Global customizations are retrieved in the same was as mode customizations, except
that the `getGlobalCustomization` is called instead of the mode call.

## Types
Some types for the customization service are provided by the `@ohif/ui` types
export.  Additionally, extensions can provide a Types export with custom
typing, allowing for better typing for the extension specific capabilities.
This allows for having strong typing when declaring customizations, for example:

```ts
import { Types } from '@ohif/ui';

const customContextMenu: Types.UIContextMenu =
    {
      id: 'cornerstoneContextMenu',
      uiType: 'ohif.contextMenu',
      // items will be type checked to be in accordance with UIContextMenu.items
      items: [ ... ]
    },
```

## Inheritance
JavaScript  property inheritance can be supplied by defining customizations
with id corresponding to the uiType value.  For example:

```js
getCustomizationModule = () => ([
  {
    name: 'default',
    value: [
      {
        id: 'ohif.overlayItem',
        content: function (props) {
          return (<p><b>{this.label}</b> {props.instance[this.attribute]}</p>)
        },
      },
    ],
  }
])
```

defines an overlay item which has a React content object as the render value.
This can then be used by specifying a uiType of `ohif.overlayItem`, for example:

```js
const overlayItem: Types.UIOverlayItem = {
  id: 'anOverlayItem',
  uiType: 'ohif.overlayItem',
  attribute: 'PatientName',
  label: 'PN:',
};
```

> 3rd Party implementers may be added to this table via pull requests.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[interface]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/UIModalService/index.js
[modal-provider]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/contextProviders/ModalProvider.js
[modal-consumer]: https://github.com/OHIF/Viewers/tree/master/platform/ui/src/components/ohifModal
[ux-article]: https://uxplanet.org/best-practices-for-modals-overlays-dialog-windows-c00c66cddd8c
<!-- prettier-ignore-end -->
