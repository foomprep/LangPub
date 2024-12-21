type CSSRule = {
  selector: string;
  styles: Record<string, string>;
};

// Base font size (assuming 16px as default)
const BASE_FONT_SIZE = 16;

// Convert CSS units to numbers
const convertUnitToNumber = (value: string): number | null => {
  // Remove all whitespace
  const cleanValue = value.trim();
  
  // Match number and unit
  const match = cleanValue.match(/^(-?\d*\.?\d+)(px|rem|em|%|vw|vh)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const unit = match[2] || '';

  switch (unit) {
    case 'px':
      return num;
    case 'rem':
      return num * BASE_FONT_SIZE;
    case 'em':
      return num * BASE_FONT_SIZE;
    case '%':
      return num / 100;
    // For vw/vh, we'll need to handle these at runtime
    case 'vw':
    case 'vh':
      return num / 100;
    default:
      return num;
  }
};

export const parseCSS = (cssContent: string): CSSRule[] => {
  const rules: CSSRule[] = [];
  if (!cssContent) return rules;
  
  // Remove comments and normalize whitespace
  const cleanCSS = cssContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into individual rules
  const ruleBlocks = cleanCSS.split('}');

  ruleBlocks.forEach(block => {
    const [selector, styles] = block.split('{');
    if (!selector || !styles) return;

    const cleanSelector = selector.trim();
    const styleObj: Record<string, string> = {};

    // Parse individual style declarations
    styles.split(';').forEach(style => {
      const [property, value] = style.split(':');
      if (!property || !value) return;
      
      styleObj[property.trim()] = value.trim();
    });

    if (Object.keys(styleObj).length > 0) {
      rules.push({
        selector: cleanSelector,
        styles: styleObj
      });
    }
  });

  return rules;
};

// Convert CSS property names to React Native style names
const convertPropertyName = (cssProperty: string): string => {
  // Remove vendor prefixes
  const cleanProperty = cssProperty.replace(/^-(webkit|moz|ms|o)-/, '');
  
  // Convert kebab-case to camelCase
  return cleanProperty.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert CSS values to React Native compatible values
const convertPropertyValue = (property: string, value: string): any => {
  // Handle colors
  if (property.includes('color')) {
    return value;
  }

  // Handle special values
  switch (value.toLowerCase()) {
    case 'bold':
      return 'bold';
    case 'normal':
      return 'normal';
    case 'italic':
      return 'italic';
    case 'none':
      return 'none';
  }

  // Convert numeric values with units
  const numericValue = convertUnitToNumber(value);
  if (numericValue !== null) {
    return numericValue;
  }

  // Default: return the original value
  return value;
};

export const cssToRNStyle = (cssRules: CSSRule[]): Record<string, object> => {
  const styleSheet: Record<string, object> = {};

  cssRules.forEach(rule => {
    const styles: Record<string, any> = {};
    
    Object.entries(rule.styles).forEach(([property, value]) => {
      try {
        // Skip unsupported properties
        if (property.includes('@') || property.includes('$')) return;
        
        const rnProperty = convertPropertyName(property);
        if (rnProperty) {
          styles[rnProperty] = convertPropertyValue(property, value);
        }
      } catch (error) {
        console.warn(`Error converting CSS property '${property}': ${error}`);
      }
    });

    // Extract class names from selector (basic support)
    rule.selector.split(',').forEach(selector => {
      const className = selector
        .replace(/\./g, '')  // Remove dots
        .trim()
        .split(/\s+/)[0];   // Take first part of compound selectors
      
      if (className && Object.keys(styles).length > 0) {
        styleSheet[className] = styles;
      }
    });
  });

  return styleSheet;
};

// Parse inline styles
export const parseInlineStyle = (styleString: string): object => {
  const styles: Record<string, any> = {};
  
  if (!styleString) return styles;

  styleString.split(';').forEach(declaration => {
    const [property, value] = declaration.split(':');
    if (!property || !value) return;

    try {
      const rnProperty = convertPropertyName(property.trim());
      if (rnProperty) {
        styles[rnProperty] = convertPropertyValue(property.trim(), value.trim());
      }
    } catch (error) {
      console.warn(`Error parsing inline style '${property}': ${error}`);
    }
  });

  return styles;
};
