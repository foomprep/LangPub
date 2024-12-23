import React, { ReactElement, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { DOMParser } from '@xmldom/xmldom';
import { translateText } from './translation';
import { FlashList } from '@shopify/flash-list';

interface ConversionStyles {
  text?: object;
  heading?: object;
  paragraph?: object;
  container?: object;
  image?: object;
}

interface HTMLElement {
  type: string;
  content: string | React.ReactNode | Array<{word: string, index: number}>;  // Modified to allow word arrays
  style?: any;
  onPress?: (word?: string) => void;
}

const HtmlToRNConverter = ({
  html,
  customStyles = {},
}: {
  html: string;
  customStyles?: ConversionStyles;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('');

  const defaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
    },
    paragraph: {
      marginBottom: 10,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 10,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 6,
    },
    text: {
      fontSize: 16,
      lineHeight: 24,
    },
    image: {
      width: '100%',
      height: 200,
      resizeMode: 'contain',
      marginVertical: 10,
    },
    list: {
      marginVertical: 10,
      flexDirection: 'column',
    },
    listItem: {
      marginBottom: 5,
    },
    bold: {
      fontWeight: 'bold',
    },
    italic: {
      fontStyle: 'italic',
    },
    underline: {
      textDecorationLine: 'underline',
    },
    ...customStyles,
  });

  const handleTranslation = async (text: string) => {
    const translation = await translateText("French", text);
    setModalText(translation.translated_text);
    setModalVisible(true);
  };

  const renderElement = ({ item }: { item: HTMLElement }) => {
    switch (item.type) {
      case 'text':
        return <Text style={item.style}>{item.content}</Text>;
      
      case 'paragraph':
        if (Array.isArray(item.content)) {
          return (
            <View style={[defaultStyles.paragraph, { flexDirection: 'row', flexWrap: 'wrap' }]}>
              {item.content.map(({ word, index }) => (
                <TouchableOpacity
                  key={`word-${index}`}
                  onPress={() => item.onPress?.(word)}
                  style={{ marginRight: 4, marginBottom: 4 }}
                >
                  <Text style={[defaultStyles.text, item.style]}>
                    {word}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        }
        return (
          <View style={defaultStyles.paragraph}>
            <Text style={[defaultStyles.text, item.style]}>{item.content}</Text>
          </View>
        );
      
      case 'heading1':
        return <Text style={[defaultStyles.heading1, item.style]}>{item.content}</Text>;
      
      case 'heading2':
        return (
          <TouchableOpacity onPress={item.onPress}>
            <Text style={[defaultStyles.heading2, item.style]}>{item.content}</Text>
          </TouchableOpacity>
        );
      
      case 'heading3':
        return <Text style={[defaultStyles.heading3, item.style]}>{item.content}</Text>;
      
      case 'image':
        return (
          <Image
            source={{ uri: (item.content as any).src }}
            style={[defaultStyles.image, item.style]}
            accessible={true}
            accessibilityLabel={(item.content as any).alt || 'Image'}
          />
        );
      
      default:
        return <Text style={defaultStyles.text}>{item.content}</Text>;
    }
  };

  const parseNode = (node: any): HTMLElement[] => {
    if (!node) return [];

    // Handle text nodes
    if (node.nodeType === 3) {
      return node.nodeValue?.trim() 
        ? [{ type: 'text', content: node.nodeValue, style: defaultStyles.text }]
        : [];
    }

    if (node.nodeType !== 1) return [];

    const children = Array.from(node.childNodes || [])
      .map(parseNode)
      .flat();

    const extractText = (elements: HTMLElement[]): string => {
      return elements
        .map(el => typeof el.content === 'string' ? el.content : '')
        .join('');
    };

    switch (node.nodeName.toLowerCase()) {
      case 'div':
      case 'article':
      case 'section':
        return children;

      case 'p':
        const paragraphText = Array.from(node.childNodes)
          .map((child: any) => child.nodeValue || '')
          .join('')
          .trim();
        
        // Split text into words and create word objects
        const words = paragraphText.split(/\s+/).map((word, index) => ({
          word,
          index
        }));

        return [{
          type: 'paragraph',
          content: words,
          style: defaultStyles.paragraph,
          onPress: handleTranslation
        }];

      case 'h1':
        return [{
          type: 'heading1',
          content: extractText(children),
          style: defaultStyles.heading1
        }];

      case 'h2':
        const h2Text = extractText(children);
        return [{
          type: 'heading2',
          content: h2Text,
          style: defaultStyles.heading2,
          onPress: () => handleTranslation(h2Text)
        }];

      case 'h3':
        return [{
          type: 'heading3',
          content: extractText(children),
          style: defaultStyles.heading3
        }];

      case 'img':
        return [{
          type: 'image',
          content: {
            src: node.getAttribute('src'),
            alt: node.getAttribute('alt')
          },
          style: defaultStyles.image
        }];

      case 'strong':
      case 'b':
        return [{
          type: 'text',
          content: extractText(children),
          style: defaultStyles.bold
        }];

      case 'em':
      case 'i':
        return [{
          type: 'text',
          content: extractText(children),
          style: defaultStyles.italic
        }];

      case 'br':
        return [{ type: 'text', content: '\n' }];

      default:
        return children;
    }
  };

  const convertHtmlToElements = (htmlContent: string): HTMLElement[] => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const body = doc.getElementsByTagName('body')[0];

      if (!body) {
        throw new Error('No body tag found in HTML content');
      }

      return parseNode(body);
    } catch (error) {
      console.error('Error converting HTML:', error);
      return [{ type: 'text', content: 'Error converting HTML content' }];
    }
  };

  const elements = convertHtmlToElements(html);

  return (
    <>
      <View style={{ flex: 1 }}>
        <FlashList
          data={elements}
          renderItem={renderElement}
          estimatedItemSize={50}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={{ backgroundColor: 'white', padding: 20 }}>
            <Text>{modalText}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default HtmlToRNConverter;
