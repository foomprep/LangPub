import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { pick } from 'react-native-document-picker';
import { unzipFromContentUri } from './zip';
import RNFS from 'react-native-fs';
import { processEpubContent } from './epubParser';
import { useState } from 'react';
import HtmlToRNConverter from './HTMLToRNConverter';
import Chapter from './types/Chapter';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';

const ReaderComponent = () => {
  const [chapters, setChapters] = useState<Chapter[] | undefined>(undefined);
  const [chapterIndex, setChapterIndex] = useState<number>(0);

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.translationX > 200 && chapterIndex > 0) {
      setChapterIndex(chapterIndex - 1);
    } else if (event.nativeEvent.translationX < -200 && chapterIndex < (chapters?.length ?? 0) - 1) {
      setChapterIndex(chapterIndex + 1);
    }
  };

  return (
    <GestureHandlerRootView>
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
              const result = await processEpubContent(contents, unzipped.outputPath + '/OPS');
              if (result.success) {
                setChapters(result.chapters);
                setChapterIndex(0);
              }
            }
          } catch (err) {
            // see error handling
          }
        }}
      />
      <PanGestureHandler onGestureEvent={handleGesture}>
        <ScrollView style={styles.bookContainer}>
          {chapters && 
            <HtmlToRNConverter html={chapters[chapterIndex].content} />
          }
        </ScrollView>
      </PanGestureHandler>
    </View>
    </GestureHandlerRootView>
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

