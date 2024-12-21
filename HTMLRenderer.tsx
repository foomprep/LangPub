import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { parseHTML } from './htmlParser'; // Adjust the import path as needed

type ParsedElement = {
  type: string;
  attributes: Record<string, string>;
  style?: object;
  children: (ParsedElement | string)[];
};

const RenderElement = ({ element }: { element: ParsedElement | string }) => {
  if (typeof element === 'string') {
    return <Text>{element}</Text>;
  }

  const { type, style, children } = element;

  const renderChildren = () => {
    return children.map((child, index) => (
      <RenderElement key={index} element={child} />
    ));
  };

  switch (type.toLowerCase()) {
    case 'html':
    case 'body':
    case 'div':
      return (
        <View style={style}>
          {renderChildren()}
        </View>
      );

    case 'p':
      return (
        <Text style={style}>
          {renderChildren()}
        </Text>
      );

    case 'h2':
    case 'h3':
      return (
        <Text style={style}>
          {renderChildren()}
        </Text>
      );

    case 'em':
      return (
        <Text style={style}>
          {renderChildren()}
        </Text>
      );

    case 'br':
      return <Text>{'\n'}</Text>;

    default:
      return <Text>{renderChildren()}</Text>;
  }
};

type HTMLRendererProps = {
  html: string;
  containerStyle?: object;
};

const HTMLRenderer = ({ html, containerStyle }: HTMLRendererProps) => {
  const parsedContent = parseHTML(html);

  return (
    <ScrollView style={containerStyle}>
      <RenderElement element={parsedContent} />
    </ScrollView>
  );
};

export default HTMLRenderer;
