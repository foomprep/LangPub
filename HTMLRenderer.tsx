import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { parseHTML } from './htmlParser';
import { parseCSS, cssToRNStyle, parseInlineStyle } from './cssParser';

type ParsedElement = {
  type: string;
  attributes: Record<string, string>;
  style?: object;
  children: (ParsedElement | string)[];
};

type StyleSheet = Record<string, object>;

const RenderElement = ({ 
  element, 
  styleSheet 
}: { 
  element: ParsedElement | string;
  styleSheet: StyleSheet;
}) => {
  if (typeof element === 'string') {
    return <Text>{element}</Text>;
  }

  const { type, style = {}, attributes, children } = element;

  // Combine styles from different sources
  const combinedStyle = {
    ...style,
    ...(attributes.class ? styleSheet[attributes.class] || {} : {}),
    ...(attributes.style ? parseInlineStyle(attributes.style) : {})
  };

  const renderChildren = () => {
    return children.map((child, index) => (
      <RenderElement 
        key={index} 
        element={child} 
        styleSheet={styleSheet} 
      />
    ));
  };

  switch (type.toLowerCase()) {
    case 'html':
    case 'body':
    case 'div':
      return (
        <View style={combinedStyle}>
          {renderChildren()}
        </View>
      );

    case 'p':
      return (
        <Text style={combinedStyle}>
          {renderChildren()}
        </Text>
      );

    case 'h2':
    case 'h3':
      return (
        <Text style={combinedStyle}>
          {renderChildren()}
        </Text>
      );

    case 'em':
      return (
        <Text style={[combinedStyle, { fontStyle: 'italic' }]}>
          {renderChildren()}
        </Text>
      );

    case 'br':
      return <Text>{'\n'}</Text>;

    default:
      return <Text style={combinedStyle}>{renderChildren()}</Text>;
  }
};

type HTMLRendererProps = {
  html: string;
  css?: string;
  containerStyle?: object;
};

const HTMLRenderer = ({ html, css, containerStyle }: HTMLRendererProps) => {
  if (!html) {
    return (
      <View style={[{ padding: 16 }, containerStyle]}>
        <Text>No content available</Text>
      </View>
    );
  }

  // Parse the CSS if provided
  const styles = css ? cssToRNStyle(parseCSS(css)) : {};
  
  // Parse the HTML content
  const parsedContent = parseHTML(html);

  return (
    <ScrollView style={containerStyle}>
      <RenderElement 
        element={parsedContent} 
        styleSheet={styles} 
      />
    </ScrollView>
  );
};

export default HTMLRenderer;
