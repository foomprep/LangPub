import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ParsedHtmlElement {
  type: string;
  attributes?: Record<string, any>;
  style?: Record<string, any>;
  children?: (ParsedHtmlElement | string)[];
}

interface ScreenPixels {
  widthInPixels: number;
  heightInPixels: number;
  areaInPixels: number;
}

interface Page {
  elements: ReactNode[];
  heightUsed: number;
}

// Estimated height values for different HTML elements in pixels
const elementHeights: Record<string, number> = {
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  p: 20,
  div: 0,
  nav: 0,
  li: 24,
  a: 20,
  text: 20,
};

// Helper function to calculate estimated element height
const calculateElementHeight = (element: ParsedHtmlElement | string): number => {
  if (typeof element === 'string') {
    const lines = Math.ceil(element.length / 40); // Rough estimate of 40 chars per line
    return lines * elementHeights.text;
  }
  
  const baseHeight = elementHeights[element.type.toLowerCase()] || 20;
  const childrenHeight = element.children?.reduce((acc, child) => {
    return acc + calculateElementHeight(child);
  }, 0) || 0;
  
  return baseHeight + childrenHeight;
};

// Helper function to convert HTML element to React Native component
const convertToReactNative = (element: ParsedHtmlElement | string): ReactNode => {
  if (typeof element === 'string') {
    return React.createElement(Text, {
      key: Math.random().toString()
    }, element);
  }

  const { type, attributes = {}, style = {}, children = [] } = element;
  
  // Map HTML elements to React Native components
  const Component = type === 'div' || type === 'nav' ? View : Text;
  
  return React.createElement(
    Component,
    {
      key: Math.random().toString(),
      style: {
        ...style,
        ...(attributes.class ? { className: attributes.class } : {})
      }
    },
    children.map(child => convertToReactNative(child))
  );
};

const paginateContent = (
  content: ParsedHtmlElement,
  screen: ScreenPixels
): Page[] => {
  const pages: Page[] = [];
  let currentPage = { elements: [], heightUsed: 0 };
  
  const processElement = (element: ParsedHtmlElement | string) => {
    const elementHeight = calculateElementHeight(element);
    
    // Check if element needs to start on a new page
    if (currentPage.heightUsed + elementHeight > screen.heightInPixels) {
      pages.push(currentPage);
      currentPage = { elements: [], heightUsed: 0 };
    }
    
    // Convert and add element to current page
    const reactNativeElement = convertToReactNative(element);
    currentPage.elements.push(reactNativeElement);
    currentPage.heightUsed += elementHeight;
    
    // Recursively process children if they exist
    if (typeof element !== 'string' && element.children) {
      element.children.forEach(child => processElement(child));
    }
  };
  
  // Start processing from root element
  processElement(content);
  
  if (currentPage.heightUsed > 0) {
    pages.push(currentPage);
  }
  
  return pages;
};

export default paginateContent;

