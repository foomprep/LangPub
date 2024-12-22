import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import { DOMParser } from '@xmldom/xmldom';

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
  const defaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
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
      marginLeft: 20,
      marginVertical: 10,
    },
    listItem: {
      flexDirection: 'row',
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
        return <Text style={defaultStyles.paragraph}>{children}</Text>;

      case 'h1':
        return <Text style={defaultStyles.heading1}>{children}</Text>;

      case 'h2':
        return <Text style={defaultStyles.heading2}>{children}</Text>;

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

  return result.component as React.ReactElement;
};

export default HtmlToRNConverter;

// Usage example:
/*
const MyComponent = () => {
  const htmlContent = `
    <div>
      <h1>Title</h1>
      <p>This is a <strong>bold</strong> paragraph with <em>italic</em> text.</p>
      <img src="path/to/image.jpg" alt="Sample image" />
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    </div>
  `;

  const customStyles = {
    text: {
      color: '#333',
      fontSize: 18,
    },
    heading1: {
      color: '#000',
      fontSize: 28,
    },
  };

  return (
    <ScrollView>
      <HtmlToRNConverter 
        html={htmlContent} 
        customStyles={customStyles} 
      />
    </ScrollView>
  );
};
*/
