
import {
  View,
  Button,
} from 'react-native';
import { pick } from 'react-native-document-picker';
import { styles } from './styles';

import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';
import { useState } from 'react';
import EpubReader from './EpubReader';

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
    <View
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
    </View>
  );
}

export default App;

