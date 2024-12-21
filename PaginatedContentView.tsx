import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Page from './types/Page';

interface PaginatedContentViewProps {
  page: Page;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

const PaginatedContentView: React.FC<PaginatedContentViewProps> = ({
  page,
  style,
  contentContainerStyle
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {page.elements.map((element, index) => (
          <View key={`page-element-${index}`} style={styles.elementContainer}>
            {element}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%'
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16
  },
  elementContainer: {
    marginBottom: 8
  }
});

export default PaginatedContentView;
