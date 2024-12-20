import { DOMParser } from 'xmldom';
import RNFS from 'react-native-fs';

interface BookMetadata {
  title: string;
  creator: string;
  language: string;
  publisher?: string;
  description?: string;
  subjects: string[];
  identifiers: {
    type: string;
    value: string;
  }[];
  date?: string;
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

interface SpineItem {
  idref: string;
  linear: boolean;
}

export interface Book {
  metadata: BookMetadata;
  manifest: ManifestItem[];
  spine: SpineItem[];
  contents: {
    [key: string]: string;  // key is the ID, value is the content
  };
}

// Helper function to get text content of first matching element
function getElementText(doc: Document, selector: string): string | undefined {
  // xmldom doesn't support querySelector, so we need to implement our own selector logic
  const [tagName, ...attributes] = selector.split('[');
  let elements = Array.from(doc.getElementsByTagName(tagName));
  
  if (attributes.length > 0) {
    // Simple attribute filtering
    const [attr, value] = attributes[0].slice(0, -1).split('=');
    elements = elements.filter(el => el.getAttribute(attr) === value);
  }
  
  return elements[0]?.textContent || undefined;
}

// Helper function to get elements by tag name and convert to array
function getElementsByTagName(doc: Document, tagName: string): Element[] {
  return Array.from(doc.getElementsByTagName(tagName));
}

export async function parseEpub(basePath: string): Promise<Book> {
  const parser = new DOMParser();
  
  // Read and parse content.opf
  const contentOpfPath = `${basePath}/OPS/content.opf`;
  const contentOpfText = await RNFS.readFile(contentOpfPath, 'utf8');
  const contentOpf = parser.parseFromString(contentOpfText, 'text/xml');
  
  // Parse metadata
  const metadata: BookMetadata = {
    title: getElementText(contentOpf, 'dc:title') || '',
    creator: getElementText(contentOpf, 'dc:creator') || '',
    language: getElementText(contentOpf, 'dc:language') || '',
    publisher: getElementText(contentOpf, 'dc:publisher'),
    description: getElementText(contentOpf, 'dc:description'),
    subjects: getElementsByTagName(contentOpf, 'dc:subject').map(el => el.textContent || ''),
    identifiers: getElementsByTagName(contentOpf, 'dc:identifier').map(el => ({
      type: el.getAttribute('id') || 'unknown',
      value: el.textContent || ''
    })),
    date: getElementText(contentOpf, 'dc:date')
  };

  // Parse manifest
  const manifest: ManifestItem[] = getElementsByTagName(contentOpf, 'item').map(item => ({
    id: item.getAttribute('id') || '',
    href: item.getAttribute('href') || '',
    mediaType: item.getAttribute('media-type') || '',
    properties: item.getAttribute('properties') || undefined
  }));

  // Parse spine
  const spine: SpineItem[] = getElementsByTagName(contentOpf, 'itemref').map(item => ({
    idref: item.getAttribute('idref') || '',
    linear: item.getAttribute('linear') !== 'no'
  }));

  // Read content files
  const contents: { [key: string]: string } = {};
  for (const item of manifest) {
    if (item.mediaType === 'application/xhtml+xml') {
      const filePath = `${basePath}/OPS/${item.href}`;
      try {
        const content = await RNFS.readFile(filePath, 'utf8');
        contents[item.id] = content;
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        contents[item.id] = '';
      }
    }
  }

  return {
    metadata,
    manifest,
    spine,
    contents
  };
}

export async function loadBook(epubPath: string): Promise<Book> {
  try {
    const book = await parseEpub(epubPath);
    return book;
  } catch (error) {
    console.error('Error parsing EPUB:', error);
    throw error;
  }
}
