const state = {};
/**
 * Simple metadataProvider object to store metadata local changes
 */
const metadataProvider = {
  add: (queryName, payload, imageId) => {
    if (!state[imageId]) {
      state[imageId] = {};
    }
    state[imageId][queryName] = payload;
  },
  get: (queryName, imageId) => {
    return state[imageId] && state[imageId][queryName];
  },
};

export default metadataProvider;
