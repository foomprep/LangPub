import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
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
import Icon from '@react-native-vector-icons/material-design-icons';

const ReaderComponent = () => {
  const [chapters, setChapters] = useState<Chapter[] | undefined>(undefined);
  const [chapterIndex, setChapterIndex] = useState<number>(0);
  const [lastX, setLastX] = useState<number | null>(null);
  const [hasChangedChapter, setHasChangedChapter] = useState(false);

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    if (Math.abs(event.nativeEvent.velocityY) > Math.abs(event.nativeEvent.velocityX)) {
      return;
    }

    const VELOCITY_THRESHOLD = 500;
    const TRANSLATION_THRESHOLD = 150;
    const NEW_GESTURE_THRESHOLD = 75;

    if (lastX === null || Math.abs(event.nativeEvent.absoluteX - lastX) > NEW_GESTURE_THRESHOLD) {
      setHasChangedChapter(false);
      setLastX(event.nativeEvent.absoluteX);
    }
    
    if (!hasChangedChapter) {
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

  const handleSelectBook = async (_e: any) => {
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
      console.error('Error opening file:', err);
    }
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleSelectBook} style={styles.openIconContainer}>
            <Icon name="book-open-variant" size={30} color="#000" />
          </Pressable>
        </View>
        <PanGestureHandler 
          onGestureEvent={handleGesture}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-20, 20]}
        >
          <View style={styles.bookContainer}>
            {chapters && <HtmlToRNConverter html={chapters[chapterIndex].content} />}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bookContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 50, // Adjust for button height
    padding: 10,
  },
  openIconContainer: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f5f5f5',
    paddingRight: 10,
  },
});

export default App;

