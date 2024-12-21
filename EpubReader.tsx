import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import RNFS from 'react-native-fs';
import { loadBook } from './epub_parser';
import Book from './types/Book';
import HTMLRenderer from './HTMLRenderer';

const EpubReader = ({ epubPath }: { epubPath: string }) => {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    loadBookData();
  }, [epubPath]);

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

      const loadedBook = await loadBook(epubPath);
      for (const item of loadedBook.spine) {
        const itemContent = await RNFS.readFile(epubPath + '/OPS/' + item.idref + '.xhtml');
        setContent(itemContent);
        break;
      }

    } catch (error) {
      console.error('Failed to load book:', error);
    }
  };

  return (
    <View style={styles.container}>
      { content && <HTMLRenderer html={content} containerStyle={{padding:16}} /> }
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

