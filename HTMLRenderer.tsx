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

// Helper function to create list marker
const ListMarker = ({ ordered, index }: { ordered: boolean; index: number }) => {
  return (
    <Text style={{ marginRight: 8, minWidth: 20 }}>
      {ordered ? `${index + 1}.` : '•'}
    </Text>
  );
};

const RenderElement = ({ 
  element, 
  styleSheet,
  listIndex = 0,
  listLevel = 0
}: { 
  element: ParsedElement | string;
  styleSheet: StyleSheet;
  listIndex?: number;
  listLevel?: number;
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

  switch (type.toLowerCase()) {
    case 'html':
    case 'body':
    case 'div':
      return (
        <View style={combinedStyle}>
          {children.map((child, index) => (
            <RenderElement 
              key={index} 
              element={child} 
              styleSheet={styleSheet}
            />
          ))}
        </View>
      );

    case 'ul':
    case 'ol':
      const isOrdered = type.toLowerCase() === 'ol';
      return (
        <View style={[
          combinedStyle,
          { marginLeft: listLevel * 20 }
        ]}>
          {children.map((child, index) => {
            if (typeof child === 'string') return null;
            if (child.type.toLowerCase() !== 'li') {
              return (
                <RenderElement
                  key={index}
                  element={child}
                  styleSheet={styleSheet}
                  listLevel={listLevel + 1}
                />
              );
            }
            return (
              <RenderElement
                key={index}
                element={child}
                styleSheet={styleSheet}
                listIndex={index}
                listLevel={listLevel + 1}
              />
            );
          })}
        </View>
      );

    case 'li':
      return (
        <View style={[
          combinedStyle,
          { 
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginVertical: 4,
            paddingRight: 16
          }
        ]}>
          <ListMarker ordered={listLevel > 0} index={listIndex} />
          <View style={{ flex: 1 }}>
            {children.map((child, index) => (
              <RenderElement
                key={index}
                element={child}
                styleSheet={styleSheet}
                listLevel={listLevel}
              />
            ))}
          </View>
        </View>
      );

    case 'h2':
      return (
        <Text style={[combinedStyle, { fontSize: 24, fontWeight: 'bold' }]}>
          {children.map((child, index) => (
            <React.Fragment key={index}>
              {typeof child === 'string' ? child : (
                <RenderElement 
                  element={child} 
                  styleSheet={styleSheet}
                />
              )}
            </React.Fragment>
          ))}
        </Text>
      );

    case 'h3':
      return (
        <Text style={[combinedStyle, { fontSize: 20, fontWeight: 'bold' }]}>
          {children.map((child, index) => (
            <React.Fragment key={index}>
              {typeof child === 'string' ? child : (
                <RenderElement 
                  element={child} 
                  styleSheet={styleSheet}
                />
              )}
            </React.Fragment>
          ))}
        </Text>
      );

    case 'p':
      return (
        <Text style={combinedStyle}>
          {children.map((child, index) => (
            <React.Fragment key={index}>
              {typeof child === 'string' ? child : (
                <RenderElement 
                  element={child} 
                  styleSheet={styleSheet}
                />
              )}
            </React.Fragment>
          ))}
        </Text>
      );

    case 'em':
      return (
        <Text style={[combinedStyle, { fontStyle: 'italic' }]}>
          {children.map((child, index) => (
            <React.Fragment key={index}>
              {typeof child === 'string' ? child : (
                <RenderElement 
                  element={child} 
                  styleSheet={styleSheet}
                />
              )}
            </React.Fragment>
          ))}
        </Text>
      );

    case 'br':
      return <Text>{'\n'}</Text>;

    default:
      return (
        <Text style={combinedStyle}>
          {children.map((child, index) => (
            <React.Fragment key={index}>
              {typeof child === 'string' ? child : (
                <RenderElement 
                  element={child} 
                  styleSheet={styleSheet}
                />
              )}
            </React.Fragment>
          ))}
        </Text>
      );
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
