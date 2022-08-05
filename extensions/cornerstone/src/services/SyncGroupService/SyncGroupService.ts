import { synchronizers, SynchronizerManager } from '@cornerstonejs/tools';

import { pubSubServiceInterface } from '@ohif/core';

const EVENTS = {
  TOOL_GROUP_CREATED: 'event::cornerstone::syncgroupservice:toolgroupcreated',
};

export type SyncCreator = (
  type: string,
  options?: Record<string, unknown>
) => unknown;

export type SyncGroup = {
  type: string;
  id?: string;
  // Source and target default to true if not specified
  source?: boolean;
  target?: boolean;
  options?: Record<string, unknown>;
};

const POSITION = 'cameraposition';
const VOI = 'voi';
const ZOOMPAN = 'zoompan';

const asSyncGroup = (syncGroup: string | SyncGroup): SyncGroup =>
  typeof syncGroup === 'string' ? { type: syncGroup } : syncGroup;

export default class SyncGroupService {
  serviceManager: any;
  listeners: { [key: string]: (...args: any[]) => void } = {};
  EVENTS: { [key: string]: string };
  synchronizerCreators: Record<string, SyncCreator> = {
    [POSITION]: synchronizers.createCameraPositionSynchronizer,
    [VOI]: synchronizers.createVOISynchronizer,
    [ZOOMPAN]: synchronizers.createZoomPanSynchronizer,
  };

  constructor(serviceManager) {
    this.serviceManager = serviceManager;
    this.listeners = {};
    this.EVENTS = EVENTS;
    //
    Object.assign(this, pubSubServiceInterface);
  }

  private _createSynchronizer(type: string, id: string, options) {
    const syncCreator = this.synchronizerCreators[type.toLowerCase()];
    if (syncCreator) {
      return syncCreator(id, options);
    } else {
      console.warn('Unknown synchronizer type', type, id);
    }
  }

  /**
   * Creates a synchronizer type.
   * @param type is the type of the synchronizer to create
   * @param creator
   */
  public setSynchronizer(type: string, creator: SyncCreator): void {
    this.synchronizerCreators[type] = creator;
  }

  public addViewportToSyncGroup(
    viewportId: string,
    renderingEngineId: string,
    syncGroups?: (SyncGroup | string)[]
  ): void {
    if (!syncGroups || !syncGroups.length) {
      console.log('No sync groups', viewportId);
      return;
    }

    syncGroups.forEach(syncGroup => {
      console.log('syncGroup', syncGroup);
      const syncGroupObj = asSyncGroup(syncGroup);
      const { type, target = true, source = true, options } = syncGroupObj;
      const { id = type } = syncGroupObj;

      let synchronizer = SynchronizerManager.getSynchronizer(id);

      if (!synchronizer) {
        synchronizer = this._createSynchronizer(type, id, options);
      }

      if (target && source) {
        synchronizer.add({
          viewportId,
          renderingEngineId,
        });
        return;
      } else if (source) {
        synchronizer.addSource({
          viewportId,
          renderingEngineId,
        });
      } else if (target) {
        synchronizer.addTarget({
          viewportId,
          renderingEngineId,
        });
      }
    });
  }

  public destroy() {
    SynchronizerManager.destroy();
  }

  public removeViewportFromSyncGroup(
    viewportId: string,
    renderingEngineId: string
  ): void {
    const synchronizers = SynchronizerManager.getAllSynchronizers();

    synchronizers.forEach(synchronizer => {
      if (!synchronizer) {
        return;
      }

      synchronizer.remove({
        viewportId,
        renderingEngineId,
      });

      // check if any viewport is left in any of the sync groups, if not, delete that sync group
      const sourceViewports = synchronizer.getSourceViewports();
      const targetViewports = synchronizer.getTargetViewports();

      if (!sourceViewports.length && !targetViewports.length) {
        SynchronizerManager.destroySynchronizer(synchronizer.id);
      }
    });
  }
}
