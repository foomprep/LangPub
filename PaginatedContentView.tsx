import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Page from './types/Page';

interface PaginatedContentViewProps {
  page: Page;
  style?: ViewStyle;
}

const PaginatedContentView: React.FC<PaginatedContentViewProps> = ({
  page,
  style
}) => {
  // The view is already a container with children
  return React.cloneElement(page.view as React.ReactElement, {
    style: [style, (page.view as React.ReactElement).props.style]
  });
};

export default PaginatedContentView;
