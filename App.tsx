import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, View } from 'react-native';
import { pick } from 'react-native-document-picker';
import { unzipFromContentUri } from './zip';
import RNFS from 'react-native-fs';
import { combineEpubContent } from './htmlParser';

const ReaderComponent = () => {
  return (
    <View>
      <Button
        title="open file"
        onPress={async () => {
          try {
            const [result] = await pick({
              mode: 'open',
            })
            const unzipped = await unzipFromContentUri(result.uri);
            if (unzipped.outputPath) {
              const contents = await RNFS.readFile(unzipped.outputPath + '/OPS/contents.xhtml');
              const concatenatedHTMLFiles = await combineEpubContent(contents, unzipped.outputPath + '/OPS');
              console.log(concatenatedHTMLFiles);
            }
          } catch (err) {
            // see error handling
          }
        }}
      />
    </View>
  );
};

  const App = () => {
    return (
      <SafeAreaProvider>
        <ReaderComponent />
      </SafeAreaProvider>
    );
  };

  export default App;
