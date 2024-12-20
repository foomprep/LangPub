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
      <View style={styles.options}>

        <TouchableOpacity
          onPress={async () => {
            try {
              const result = await pick({
                type: ['application/epub+zip'],
                mode: 'open',
              });
              
              if (result && result.length > 0) {
                const file = result[0];
                console.log('Picked file:', file);
                
                if (file.uri) {
                  // For debugging
                  console.log('Original URI:', file.uri);
                  
                  // If on Android, make sure the URI is properly encoded
                  const finalUri = Platform.OS === 'android' 
                    ? file.uri.replace(/%/g, '%25')
                    : file.uri;
                  
                  console.log('Final URI:', finalUri);
                  setSrc(finalUri);
                }
              }
            } catch (error) {
              console.error('Error picking document:', error);
              Alert.alert('Error', 'Failed to load the selected book');
            }
          }}>
          <Text>Book (local)</Text>
        </TouchableOpacity>
      </View>

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

