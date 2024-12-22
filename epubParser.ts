import RNFS from 'react-native-fs';
import { DOMParser } from '@xmldom/xmldom';
import Chapter from './types/Chapter';

interface ProcessResult {
  success: boolean;
  content?: string;
  chapters?: Chapter[];
  error?: string;
}

/**
 * Processes EPUB content and concatenates body content from referenced files
 * @param htmlContent - The HTML string containing the EPUB table of contents
 * @param epubPath - The base path where the EPUB files are located
 * @returns Promise resolving to ProcessResult containing the concatenated content or error
 */
export const processEpubContent = async (
  htmlContent: string,
  epubPath: string
): Promise<ProcessResult> => {
  try {
    // Create an XML parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Find all chapter links in the table of contents
    const tocNav = doc.getElementsByTagName('nav')[0];
    const chapterLinks = tocNav.getElementsByTagName('a');
    
    if (!chapterLinks.length) {
      throw new Error('No chapters found in the table of contents');
    }

    const chapters: Chapter[] = [];
    let concatenatedContent = '';

    // Process each chapter
    for (let i = 0; i < chapterLinks.length; i++) {
      const link = chapterLinks[i];
      const href = link.getAttribute('href');
      const title = link.textContent || '';

      if (!href) {
        console.warn(`Skipping chapter "${title}" - no href found`);
        continue;
      }

      const chapterPath = `${epubPath}/${href}`;
      
      try {
        // Read the chapter file
        const chapterContent = await RNFS.readFile(chapterPath, 'utf8');
        
        // Store chapter information
        chapters.push({
          title,
          content: chapterContent,
          href
        });
        
        // Add to concatenated content with chapter title as separator
        concatenatedContent += `

<!-- Chapter: ${title} -->
${chapterContent}`;
        
      } catch (chapterError) {
        console.warn(`Error processing chapter "${title}": ${chapterError}`);
        // Continue with other chapters even if one fails
      }
    }

    if (!chapters.length) {
      throw new Error('No chapters were successfully processed');
    }

    return {
      success: true,
      content: concatenatedContent.trim(),
      chapters
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to extract text content from HTML string
export const stripHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.getElementsByTagName('body')[0]?.textContent || '';
};

