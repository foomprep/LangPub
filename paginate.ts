import React, { ReactElement } from 'react';
import { Text, View } from 'react-native';
import ScreenPixels from './types/ScreenPixels';
import Page from './types/Page';

interface ParsedHtmlElement {
  type: string;
  attributes?: Record<string, any>;
  style?: Record<string, any>;
  children?: (ParsedHtmlElement | string)[];
}

const paginateContent = (
  content: ParsedHtmlElement,
  screen: ScreenPixels
): Page[] => {
console.log(JSON.stringify(content, null, 2));

  const pages: Page[] = [];
  const currentView: ReactElement = React.createElement('View');

  const traverseContent = (element: ParsedHtmlElement | string) => {
    if (typeof element === 'string') {
    } else {
      const { type, attributes, style, children } = element;
      if (children) {
        children.forEach(child => traverseContent(child));
      }
    }
  };
  traverseContent(content);
  return pages;
};

export default paginateContent;

