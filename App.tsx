
import {
  View,
  Button,
} from 'react-native';
import { pick } from 'react-native-document-picker';
import { styles } from './styles';

import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';

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
    console.log('EPUB unzipped to:', unzipResult);

    // List contents recursively
    const contents = await listDirRecursive(targetPath);
    console.log(JSON.stringify(contents, null, 2));


    return {
      basePath: targetPath,
      contents
    };

  } catch (error) {
    console.error('Error processing EPUB:', error);
    throw error;
  }
}

const listDirRecursive = async (path) => {
  const contents = [];
  const files = await RNFS.readDir(path);
  for (const file of files) {
    const filePath = `${path}/${file.name}`;
    if (file.isFile()) {
      contents.push(filePath);
    } else {
      const subDirContents = await listDirRecursive(filePath);
      contents.push(...subDirContents);
    }
  }
  return contents;
};

const App = () => {
  const handleEpubPicker = async () => {
    try {
      const result = pickAndProcessEpub();
      console.log(result);
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
      <Button
        title="open epub file"
        onPress={handleEpubPicker}
      />
    </View>
  );
}

export default App;

