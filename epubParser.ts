import RNFS from 'react-native-fs';
import { DOMParser } from '@xmldom/xmldom';
import Chapter from './types/Chapter';

export interface ProcessResult {
  success: boolean;
  content?: string;
  chapters?: Chapter[];
  error?: string;
  metadata?: {
    title: string;
    creator: string;
    publisher: string;
    language: string;
    description?: string;
  };
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

/**
 * Processes EPUB content using the content.opf file
 * @param opfContent - The XML string containing the EPUB content.opf
 * @param epubPath - The base path where the EPUB files are located
 * @returns Promise resolving to ProcessResult containing the concatenated content or error
 */
export const processEpubContent = async (
  opfContent: string,
  epubPath: string
): Promise<ProcessResult> => {
  try {
    // Create an XML parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'application/xml');

    // Extract metadata
    const metadata = {
      title: getElementText(doc, 'dc:title'),
      creator: getElementText(doc, 'dc:creator'),
      publisher: getElementText(doc, 'dc:publisher'),
      language: getElementText(doc, 'dc:language'),
      description: getElementText(doc, 'dc:description'),
    };

    // Parse manifest items
    const manifestItems = new Map<string, ManifestItem>();
    const manifestElements = doc.getElementsByTagName('item');
    
    for (let i = 0; i < manifestElements.length; i++) {
      const item = manifestElements[i];
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const mediaType = item.getAttribute('media-type');
      
      if (id && href && mediaType?.includes('html')) {
        manifestItems.set(id, {
          id,
          href,
          mediaType
        });
      }
    }

    // Get reading order from spine
    const spineElements = doc.getElementsByTagName('itemref');
    const chapters: Chapter[] = [];
    let concatenatedContent = '';

    // Process each chapter in spine order
    for (let i = 0; i < spineElements.length; i++) {
      const itemref = spineElements[i];
      const idref = itemref.getAttribute('idref');
      
      if (!idref) continue;
      
      const manifestItem = manifestItems.get(idref);
      if (!manifestItem) continue;

      const chapterPath = `${epubPath}/${manifestItem.href}`;
      
      try {
        // Read the chapter file
        const chapterContent = await RNFS.readFile(chapterPath, 'utf8');
        
        // Parse chapter content to extract title
        const chapterDoc = parser.parseFromString(chapterContent, 'text/html');
        const title = chapterDoc.getElementsByTagName('title')[0]?.textContent || 
                     chapterDoc.getElementsByTagName('h1')[0]?.textContent ||
                     `Chapter ${i + 1}`;
        
        // Store chapter information
        chapters.push({
          title,
          content: chapterContent,
          href: manifestItem.href
        });
        
        // Add to concatenated content with chapter title as separator
        concatenatedContent += `

<!-- Chapter: ${title} -->
${chapterContent}`;
        
      } catch (chapterError) {
        console.warn(`Error processing chapter "${manifestItem.href}": ${chapterError}`);
        // Continue with other chapters even if one fails
      }
    }

    if (!chapters.length) {
      throw new Error('No chapters were successfully processed');
    }

    return {
      success: true,
      content: concatenatedContent.trim(),
      chapters,
      metadata
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to extract text content from a specific element
const getElementText = (doc: Document, tagName: string): string => {
  return doc.getElementsByTagName(tagName)[0]?.textContent || '';
};

// Helper function to extract text content from HTML string
export const stripHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.getElementsByTagName('body')[0]?.textContent || '';
};
