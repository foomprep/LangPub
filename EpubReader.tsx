import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  PanResponder,
  Dimensions,
} from 'react-native';
import RNFS from 'react-native-fs';
import { loadBook } from './epub_parser';
import Book from './types/Book';
import { parseHTML } from './htmlParser';
import paginateContent from './paginate';
import { getScreenPixels } from './screen';
import Page from './types/Page';
import PaginatedContentView from './PaginatedContentView';

const EpubReader = ({ epubPath }: { epubPath: string }) => {
  const [content, setContent] = useState<any>(null);
  const [css, setCss] = useState<string | undefined>(undefined);
  const [chapterIndex, setChapterIndex] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [paginatedSpine, setPaginatedSpine] = useState<Page[][]>([]);

  useEffect(() => {
    loadBookData();

  }, [epubPath]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > Dimensions.get('window').width / 2) {
        handleSwipeRight();
      } else if (gestureState.dx < -Dimensions.get('window').width / 2) {
        handleSwipeLeft();
      }
    },
  });

  const handleSwipeLeft = () => {
    console.log('pageIndex', pageIndex);
    console.log('chapterIndex', chapterIndex);
    console.log('chapterLength', paginatedSpine[chapterIndex].length);
    if ((pageIndex+1) >= paginatedSpine[chapterIndex].length) {
      setChapterIndex(prev => prev + 1);
      setPageIndex(0);
    } else {
      setPageIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
  };

  const loadBookData = async () => {
    try {

      async function readDirRecursive(dirPath: string) {
        let entries: any = [];
        const dirEntries = await RNFS.readDir(dirPath);
        await Promise.all(
          dirEntries.map(async (entry) => {
            const entryPath = `${dirPath}/${entry.name}`;
            if (entry.isDirectory()) {
              const subdirEntries = await readDirRecursive(entryPath);
              entries = entries.concat(subdirEntries);
            } else {
              entries.push(entryPath);
            }
          })
        );
        return entries;
      }
      const files: string[] = await readDirRecursive(epubPath);
      const cssFiles = files.filter(file => file.includes('.css'));
      const cssContent = await Promise.all(cssFiles.map(async file => await RNFS.readFile(file, 'utf8')));
      setCss(cssContent.join(''));

      const loadedBook: Book = await loadBook(epubPath);
      const itemContent = await RNFS.readFile(epubPath + '/OPS/' + loadedBook.spine[0].idref + '.xhtml');
      const parsedContent = parseHTML(itemContent);
      const screen = getScreenPixels();
      const pages: Page[] = paginateContent(parsedContent, screen);
      //Promise.all(
      //  loadedBook.spine.map(async (spineItem) => {
      //    const itemContent = await RNFS.readFile(epubPath + '/OPS/' + spineItem.idref + '.xhtml');
      //    const parsedContent = parseHTML(itemContent);
      //    const screen = getScreenPixels();
      //    return paginateContent(parsedContent, screen);
      //  })
      //).then(result => {
      //  setPaginatedSpine(result);
      //  setChapterIndex(0);
      //  setPageIndex(0);
      //});

    } catch (error) {
      console.error('Failed to load book:', error);
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      { paginatedSpine.length > 0 && <PaginatedContentView page={paginatedSpine[chapterIndex][pageIndex]} /> }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default EpubReader;

