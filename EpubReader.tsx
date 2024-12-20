import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { loadBook, Book } from './epub_parser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TextNode {
  type: 'text';
  content: string;
}

interface ElementNode {
  type: 'element';
  tag: string;
  attributes: Record<string, string>;
  children: Node[];
}

type Node = TextNode | ElementNode;

interface ChapterData {
  id: string;
  content: Node[];
}

// Simple HTML parser
function parseHTML(html: string): Node[] {
  // Remove DOCTYPE, comments, scripts, and styles
  html = html.replace(/<\!DOCTYPE[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  const nodes: Node[] = [];
  let currentIndex = 0;

  while (currentIndex < html.length) {
    if (html[currentIndex] === '<') {
      // Tag
      const tagEnd = html.indexOf('>', currentIndex);
      if (tagEnd === -1) break;

      const isClosingTag = html[currentIndex + 1] === '/';
      if (isClosingTag) {
        currentIndex = tagEnd + 1;
        continue;
      }

      const tagContent = html.slice(currentIndex + 1, tagEnd);
      const [tagName, ...attributeParts] = tagContent.split(' ');

      // Parse attributes
      const attributes: Record<string, string> = {};
      attributeParts.forEach(part => {
        const [key, ...valueParts] = part.split('=');
        if (valueParts.length > 0) {
          const value = valueParts.join('=').replace(/['"]/g, '');
          attributes[key] = value;
        }
      });

      // Find closing tag
      const closingTag = `</${tagName}>`;
      const closingIndex = html.indexOf(closingTag, tagEnd);
      if (closingIndex === -1) {
        currentIndex = tagEnd + 1;
        continue;
      }

      // Parse inner content
      const innerContent = html.slice(tagEnd + 1, closingIndex);
      const children = parseHTML(innerContent);

      nodes.push({
        type: 'element',
        tag: tagName.toLowerCase(),
        attributes,
        children,
      });

      currentIndex = closingIndex + closingTag.length;
    } else {
      // Text content
      const nextTag = html.indexOf('<', currentIndex);
      const textContent = html.slice(
        currentIndex,
        nextTag === -1 ? undefined : nextTag
      ).trim();

      if (textContent) {
        // Decode HTML entities
        const decodedText = textContent
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        nodes.push({
          type: 'text',
          content: decodedText,
        });
      }

      currentIndex = nextTag === -1 ? html.length : nextTag;
    }
  }

  return nodes;
}

// Native renderer component
const NativeRenderer: React.FC<{ nodes: Node[] }> = ({ nodes }) => {
  const renderNode = (node: Node, index: number): React.ReactNode => {
    if (node.type === 'text') {
      return <Text key={index} style={styles.text}>{node.content}</Text>;
    }

    const { tag, attributes, children } = node;

    switch (tag) {
      case 'h1':
        return (
          <Text key={index} style={[styles.text, styles.h1]}>
            {children.map((child, i) => renderNode(child, i))}
          </Text>
        );
      case 'h2':
        return (
          <Text key={index} style={[styles.text, styles.h2]}>
            {children.map((child, i) => renderNode(child, i))}
          </Text>
        );
      case 'h3':
        return (
          <Text key={index} style={[styles.text, styles.h3]}>
            {children.map((child, i) => renderNode(child, i))}
          </Text>
        );
      case 'p':
        return (
          <Text key={index} style={[styles.text, styles.paragraph]}>
            {children.map((child, i) => renderNode(child, i))}
          </Text>
        );
      case 'strong':
      case 'b':
        return (
          <Text key={index} style={[styles.text, styles.bold]}>
            {children.map((child, i) => renderNode(child, i))}
          </Text>
        );
      case 'em':
      case 'i':
        return (
          <Text key={index} style={[styles.text, styles.italic]}>
            {children.map((child, i) => renderNode(child, i))}
          </Text>
        );
      case 'img':
        return (
          <Image
            key={index}
            source={{ uri: attributes.src }}
            style={styles.image}
            resizeMode="contain"
          />
        );
      case 'div':
      case 'section':
        return (
          <View key={index} style={styles.container}>
            {children.map((child, i) => renderNode(child, i))}
          </View>
        );
      default:
        return children.map((child, i) => renderNode(child, i));
    }
  };

  return <>{nodes.map((node, index) => renderNode(node, index))}</>;
};

const EpubReader = ({ epubPath }: { epubPath: string }) => {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadBookData();
  }, []);

  const loadBookData = async () => {
    try {
      const loadedBook = await loadBook(epubPath);
      setBook(loadedBook);
      
      // Parse HTML content for each chapter
      const chapterData: ChapterData[] = loadedBook.spine
        .map(spineItem => ({
          id: spineItem.idref,
          content: parseHTML(loadedBook.contents[spineItem.idref] || '')
        }))
        .filter(chapter => chapter.content.length > 0);
      
      setChapters(chapterData);
    } catch (error) {
      console.error('Failed to load book:', error);
    }
  };

  const renderChapter = ({ item }: { item: ChapterData }) => {
    return (
      <ScrollView style={styles.pageContainer}>
        <NativeRenderer nodes={item.content} />
      </ScrollView>
    );
  };

  if (!book || chapters.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading book...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(newIndex);
        }}
      />
      <View style={styles.pageInfo}>
        <Text>
          Chapter {currentIndex + 1} of {chapters.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    padding: 16,
  },
  text: {
    fontSize: 24,
    lineHeight: 32, // Increased line height for spacing between lines
    color: '#333',
  },
  paragraph: {
    marginBottom: 10,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    marginVertical: 10,
  },
  pageInfo: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
  },
});

export default EpubReader;

