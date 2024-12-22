import React, { ReactElement, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { DOMParser } from '@xmldom/xmldom';
import { translateText } from './translation';
import WordWrapper from './WordWrapper';

interface ConversionStyles {
  text?: object;
  heading?: object;
  paragraph?: object;
  container?: object;
  image?: object;
}

interface ConversionResult {
  success: boolean;
  component?: React.ReactNode;
  error?: string;
}

const getTextFromElement = (element: any): string => {
  if (!element) return '';
  
  // If it's a text element
  if (typeof element === 'string') return element;
  
  // If it's a React element
  if (element.props) {
    if (typeof element.props.children === 'string') {
      return element.props.children;
    }
    if (Array.isArray(element.props.children)) {
      return element.props.children
        .map((child: any) => getTextFromElement(child))
        .join('');
    }
    return getTextFromElement(element.props.children);
  }
  
  return '';
};

/**
 * Converts HTML string to React Native components
 */
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
  }

  const parseNode = (node: any): React.ReactNode => {
    if (!node) return null;

    // Handle text nodes
    if (node.nodeType === 3) { // Text node
      return node.nodeValue?.trim() ? (
        <Text style={defaultStyles.text}>{node.nodeValue}</Text>
      ) : null;
    }

    if (node.nodeType !== 1) { // Not an element node
      return null;
    }

    const children = Array.from(node.childNodes || []).map((child: any, index: number) => (
      <React.Fragment key={index}>{parseNode(child)}</React.Fragment>
    ));

    switch (node.nodeName.toLowerCase()) {
      case 'div':
      case 'article':
      case 'section':
        return <View style={defaultStyles.container}>{children}</View>;

      case 'p':
        const paragraphText = Array.from(node.childNodes)
          .map((child: any) => child.nodeValue || '')
          .join('')
          .trim();
        
        return (
          <View 
            style={defaultStyles.paragraph}
            pointerEvents="box-none"
          >
            <WordWrapper
              text={paragraphText}
              textStyle={defaultStyles.text}
              onWordPress={(word) => handleTranslation(word)}
              preserveWhitespace={true}
            />
          </View>
        );

      case 'h1':
        return <Text style={defaultStyles.heading1}>{children}</Text>;

      case 'h2':
        return (
          <TouchableOpacity onPress={() => {
            const extractedText = Array.from(node.childNodes)
              .map((child: any) => child.nodeValue || '')
              .join('')
              .trim();
            handleTranslation(extractedText);
          }}>
            <Text style={defaultStyles.heading2}>
              {children}
            </Text>
          </TouchableOpacity>
        );

      case 'h3':
        return <Text style={defaultStyles.heading3}>{children}</Text>;

      case 'strong':
      case 'b':
        return <Text style={defaultStyles.bold}>{children}</Text>;

      case 'em':
      case 'i':
        return <Text style={defaultStyles.italic}>{children}</Text>;

      case 'u':
        return <Text style={defaultStyles.underline}>{children}</Text>;

      case 'br':
        return <Text>{'\n'}</Text>;

      case 'img':
        return (
          <Image
            source={{ uri: node.getAttribute('src') }}
            style={defaultStyles.image}
            accessible={true}
            accessibilityLabel={node.getAttribute('alt') || 'Image'}
          />
        );

      case 'ul':
      case 'ol':
        return <View style={defaultStyles.list}>{children}</View>;

      case 'li':
        return (
          <View style={defaultStyles.listItem}>
            <Text style={defaultStyles.text}>• </Text>
            <Text style={defaultStyles.text}>{children}</Text>
          </View>
        );

      default:
        // For unknown elements, wrap in Text component
        return <Text style={defaultStyles.text}>{children}</Text>;
    }
  };

  const convertHtmlToRN = (htmlContent: string): ConversionResult => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const body = doc.getElementsByTagName('body')[0];

      if (!body) {
        throw new Error('No body tag found in HTML content');
      }

      const component = parseNode(body);

      return {
        success: true,
        component,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  };

  const result = convertHtmlToRN(html);

  if (!result.success) {
    console.error('Error converting HTML:', result.error);
    return <Text>Error converting HTML content</Text>;
  }

  return (
    <>
      {result.component as ReactElement}
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

