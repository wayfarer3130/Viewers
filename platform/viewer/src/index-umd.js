/**
 * Entry point index.js for UMD packaging
 */
import 'regenerator-runtime/runtime';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';
import ConfigPoint from 'config-point';

function installViewer(config, containerId = 'root', callback) {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(
      "No root element found to install viewer. Please add a <div> with the id 'root', or pass a DOM element into the installViewer function."
    );
  }

  // Load the default theme settings
  const defaultTheme = config.defaultTheme || 'theme';
  ConfigPoint.load(defaultTheme, '/theme', 'theme');

  return ReactDOM.render(<App config={config} />, container, callback);
}

export { App, installViewer };
