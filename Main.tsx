import * as React from 'react';
import { AppRegistry } from 'react-native';
import { ReaderProvider } from '@epubjs-react-native/core';
import { name as appName } from './app.json';
import App from './App';

export default function Main() {
  return (
    <ReaderProvider>
      <App />
    </ReaderProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
