import {
  Button, View, Text
} from 'react-native';
import { pick } from 'react-native-document-picker';

import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { useState } from 'react';
import EpubReader from './EpubReader';
import { SafeAreaView } from 'react-native-safe-area-context';

async function pickAndProcessEpub() {
  try {
    // Pick the file
    const result = await pick({
      mode: 'open',
      copyTo: 'cachesDirectory',
    });

    const pickedFile = result[0];
    
    // The fileCopyUri from copyTo will give us a usable file path
    if (!pickedFile.fileCopyUri) {
      throw new Error('Failed to get local file path');
    }

    // Use the local file path for unzipping
    const targetPath = `${RNFS.CachesDirectoryPath}/unzipped_epub`;
    
    // Ensure target directory is empty
    if (await RNFS.exists(targetPath)) {
      await RNFS.unlink(targetPath);
    }
    await RNFS.mkdir(targetPath);

    // Unzip using the local file path
    const unzipResult = await unzip(pickedFile.fileCopyUri, targetPath);

    return unzipResult;
  } catch (error) {
    console.error('Error processing EPUB:', error);
    throw error;
  }
}

const App = () => {
  const [epubPath, setEpubPath] = useState<string | null>(null);

  const handleEpubPicker = async () => {
    try {
      const unzippedDir = await pickAndProcessEpub();
      setEpubPath(unzippedDir);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView
      style={{
        ...styles.container,
      }}
    >
      { epubPath ? 
        <EpubReader epubPath={epubPath} /> :
        <Button
          title="open epub file"
          onPress={handleEpubPicker}
        />
      }
    </SafeAreaView>
  );
}

export default App;

import { Dimensions, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
  options: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  currentFormat: {
    textAlign: 'center',
  },
});
