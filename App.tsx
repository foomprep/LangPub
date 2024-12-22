import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { pick } from 'react-native-document-picker';
import { unzipFromContentUri } from './zip';
import RNFS from 'react-native-fs';
import { processEpubContent } from './epubParser';
import { useState } from 'react';
import HtmlToRNConverter from './HTMLToRNConverter';
import Chapter from './types/Chapter';
import { 
  GestureHandlerRootView, 
  PanGestureHandler, 
  PanGestureHandlerGestureEvent 
} from 'react-native-gesture-handler';

const ReaderComponent = () => {
  const [chapters, setChapters] = useState<Chapter[] | undefined>(undefined);
  const [chapterIndex, setChapterIndex] = useState<number>(0);
  const [lastX, setLastX] = useState<number | null>(null);
  const [hasChangedChapter, setHasChangedChapter] = useState(false);

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    // Only handle horizontal gestures
    if (Math.abs(event.nativeEvent.velocityY) > Math.abs(event.nativeEvent.velocityX)) {
      return;
    }

    const VELOCITY_THRESHOLD = 500;
    const TRANSLATION_THRESHOLD = 150;
    const NEW_GESTURE_THRESHOLD = 75;

    // Only consider it a new gesture if there's a larger position difference
    if (lastX === null || Math.abs(event.nativeEvent.absoluteX - lastX) > NEW_GESTURE_THRESHOLD) {
      setHasChangedChapter(false);
      setLastX(event.nativeEvent.absoluteX);
    }
    
    if (!hasChangedChapter) {
      // Require both velocity AND translation thresholds for faster swipes
      const meetsThreshold = 
        Math.abs(event.nativeEvent.velocityX) > VELOCITY_THRESHOLD && 
        Math.abs(event.nativeEvent.translationX) > TRANSLATION_THRESHOLD;
        
      if (meetsThreshold) {
        if (event.nativeEvent.translationX > 0 && chapterIndex > 0) {
          setChapterIndex(chapterIndex - 1);
          setHasChangedChapter(true);
        } else if (event.nativeEvent.translationX < 0 && chapterIndex < (chapters?.length ?? 0) - 1) {
          setChapterIndex(chapterIndex + 1);
          setHasChangedChapter(true);
        }
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
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
        <PanGestureHandler 
          onGestureEvent={handleGesture}
          activeOffsetX={[-20, 20]} // Only activate for horizontal movements
          failOffsetY={[-20, 20]} // Fail the gesture if vertical movement occurs first
        >
          <View style={styles.bookContainer}>
            <ScrollView>
              {chapters && 
                <HtmlToRNConverter html={chapters[chapterIndex].content} />
              }
            </ScrollView>
          </View>
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
  container: {
    flex: 1,
  },
  bookContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    padding: 10,
  }
})
