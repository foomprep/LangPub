type ParsedElement = {
  type: string;
  attributes: Record<string, string>;
  style?: object;
  children: (ParsedElement | string)[];
};

// List of void elements (self-closing tags)
const VOID_ELEMENTS = new Set([
  'meta', 'link', 'br', 'hr', 'img', 'input',
  'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'
]);

const stripPreamble = (content: string): string => {
  // Remove XML declaration
  let cleaned = content.replace(/<\?xml[^?]*\?>/i, '');
  // Remove DOCTYPE
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/i, '');
  return cleaned.trim();
};

const parseAttributes = (attributeString: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  // Updated regex to handle namespaced attributes and various formats
  const attributeRegex = /(?:[\w:.-]+)=(?:"[^"]*"|'[^']*')/g;
  const matches = attributeString.match(attributeRegex) || [];
  
  matches.forEach(match => {
    const [key, ...rest] = match.split('=');
    const value = rest.join('=').replace(/['"]/g, '');
    attributes[key.trim()] = value;
  });
  
  return attributes;
};

const findTagEnd = (content: string, startIndex: number): number => {
  let index = startIndex;
  let inQuotes = false;
  let quoteChar = '';
  
  while (index < content.length) {
    const char = content[index];
    
    if ((char === '"' || char === "'") && (!inQuotes || quoteChar === char)) {
      inQuotes = !inQuotes;
      quoteChar = char;
    } else if (char === '>' && !inQuotes) {
      return index;
    }
    
    index++;
  }
  
  return -1;
};

const parseTag = (content: string, startIndex: number): [string, Record<string, string>, boolean, number] => {
  const tagEnd = findTagEnd(content, startIndex);
  if (tagEnd === -1) throw new Error('Invalid tag format');
  
  const tagContent = content.slice(startIndex + 1, tagEnd);
  const isVoidElement = tagContent.endsWith('/') || tagContent.endsWith(' /');
  const cleanTagContent = tagContent.replace(/\/$/, '').trim();
  
  const spaceIndex = cleanTagContent.search(/\s/);
  const tagName = spaceIndex === -1 ? cleanTagContent : cleanTagContent.slice(0, spaceIndex);
  const attributeString = spaceIndex === -1 ? '' : cleanTagContent.slice(spaceIndex + 1);
  
  const attributes = parseAttributes(attributeString);
  
  return [tagName, attributes, isVoidElement || VOID_ELEMENTS.has(tagName.toLowerCase()), tagEnd + 1];
};

const parseElement = (content: string, startIndex: number): [ParsedElement, number] => {
  const [tagName, attributes, isVoid, contentStart] = parseTag(content, startIndex);
  
  if (isVoid) {
    return [{
      type: tagName,
      attributes,
      style: getStyleForClass(attributes.class),
      children: []
    }, contentStart];
  }
  
  const closeTag = `</${tagName}>`;
  let searchStart = contentStart;
  let nestLevel = 1;
  let contentEnd = contentStart;
  
  while (nestLevel > 0 && searchStart < content.length) {
    const nextClose = content.indexOf(closeTag, searchStart);
    const nextOpen = content.indexOf(`<${tagName}`, searchStart);
    
    if (nextClose === -1) break;
    
    if (nextOpen === -1 || nextClose < nextOpen) {
      nestLevel--;
      contentEnd = nextClose;
      searchStart = nextClose + closeTag.length;
    } else {
      nestLevel++;
      searchStart = nextOpen + tagName.length + 1;
    }
  }
  
  const innerContent = content.slice(contentStart, contentEnd);
  const children = parseContent(innerContent);
  
  return [{
    type: tagName,
    attributes,
    style: getStyleForClass(attributes.class),
    children
  }, contentEnd + closeTag.length];
};

const parseContent = (content: string): (ParsedElement | string)[] => {
  const result: (ParsedElement | string)[] = [];
  let currentIndex = 0;
  
  while (currentIndex < content.length) {
    const nextTag = content.indexOf('<', currentIndex);
    
    if (nextTag === -1) {
      const text = content.slice(currentIndex).trim();
      if (text) result.push(text);
      break;
    }
    
    // Handle text before tag
    if (nextTag > currentIndex) {
      const text = content.slice(currentIndex, nextTag).trim();
      if (text) result.push(text);
    }
    
    // Check if it's a closing tag
    if (content[nextTag + 1] === '/') {
      const closeEnd = content.indexOf('>', nextTag);
      currentIndex = closeEnd + 1;
      continue;
    }
    
    try {
      const [element, newIndex] = parseElement(content, nextTag);
      result.push(element);
      currentIndex = newIndex;
    } catch (error) {
      console.warn('Error parsing element:', error);
      currentIndex = nextTag + 1;
    }
  }
  
  return result;
};

const getStyleForClass = (className?: string): object => {
  if (!className) return {};

  const styleMap: Record<string, object> = {
    'titre-chapitre': {
      marginVertical: 20,
      paddingHorizontal: 16
    },
    'titre-chapitre-page-padding': {
      marginTop: 20,
      marginBottom: 20
    },
    'titre-avec-bordure': {
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      paddingBottom: 8,
      marginBottom: 16
    },
    'sous-titre': {
      marginBottom: 24,
      color: '#666'
    },
    'br': {
      marginVertical: 16
    }
  };

  return styleMap[className] || {};
};

const processElementType = (element: ParsedElement): ParsedElement => {
  const { type, style = {} } = element;
  
  switch (type.toLowerCase()) {
    case 'h2':
      return {
        ...element,
        style: {
          ...style,
          fontSize: 24,
          fontWeight: 'bold'
        }
      };
    case 'h3':
      return {
        ...element,
        style: {
          ...style,
          fontSize: 20,
          fontWeight: 'bold'
        }
      };
    case 'em':
      return {
        ...element,
        style: {
          ...style,
          fontStyle: 'italic'
        }
      };
    case 'br':
      return {
        ...element,
        children: ['\n']
      };
    default:
      return element;
  }
};

export const parseHTML = (htmlString: string): ParsedElement => {
  try {
    const cleanedHtml = stripPreamble(htmlString);
    const children = parseContent(cleanedHtml);
    
    // Find the body content
    const body = children.find(child => 
      typeof child !== 'string' && child.type.toLowerCase() === 'body'
    );
    
    if (body && typeof body !== 'string') {
      return processElementType(body);
    }
    
    return processElementType({
      type: 'div',
      attributes: {},
      children
    });
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return {
      type: 'text',
      attributes: {},
      children: ['Error parsing content']
    };
  }
};
