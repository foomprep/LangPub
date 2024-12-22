import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { pick } from 'react-native-document-picker';
import { unzipFromContentUri } from './zip';
import RNFS from 'react-native-fs';
import { combineEpubContent } from './htmlParser';
import { useState } from 'react';
import HtmlToRNConverter from './HTMLToRNConverter';

const ReaderComponent = () => {
  const [HTMLContent, setHTMLContent] = useState<string | undefined>(undefined);

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
              const result = await combineEpubContent(contents, unzipped.outputPath + '/OPS');
              if (result.success) {
      console.log(result.content ? result.content.slice(1000) : '');
                setHTMLContent(result.content);
              }
            }
          } catch (err) {
            // see error handling
          }
        }}
      />
      <ScrollView style={styles.bookContainer}>
        { HTMLContent && 
          <HtmlToRNConverter
            html={HTMLContent}
          />
        }
      </ScrollView>
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

  const styles = StyleSheet.create({
    bookContainer: {
      width: Dimensions.get("window").width,
      height: Dimensions.get("window").height,
    }
  })
