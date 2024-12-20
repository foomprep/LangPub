import {
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Reader, ReaderProvider } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { styles } from './styles';
import { pick } from 'react-native-document-picker';
import { useEffect, useState } from 'react';

const epub = "https://langpub.s3.amazonaws.com/simulacra.epub";

const App = () => {
  const { width, height } = useWindowDimensions();
  const [src, setSrc] = useState(epub);

  useEffect(() => console.log(src), [src]);

  return (
    <View
      style={{
        ...styles.container,
      }}
    >
      <ReaderProvider>
        <Reader
          src={src}
          width={width}
          height={height}
          fileSystem={useFileSystem}
        />
      </ReaderProvider>

    </View>
  );
}

export default App;

