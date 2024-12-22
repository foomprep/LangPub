import RNFS from 'react-native-fs';
import { DOMParser } from '@xmldom/xmldom';

interface ProcessResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Processes EPUB content and creates a single HTML file with concatenated body contents
 * @param htmlContent - The HTML string containing the EPUB table of contents
 * @param epubPath - The base path where the EPUB files are located
 * @returns Promise resolving to ProcessResult containing the combined HTML content
 */
export const combineEpubContent = async (
  htmlContent: string,
  epubPath: string
): Promise<ProcessResult> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Get all chapter links
    const tocNav = doc.getElementsByTagName('nav')[0];
    const chapterLinks = tocNav.getElementsByTagName('a');
    
    if (!chapterLinks.length) {
      throw new Error('No chapters found in the table of contents');
    }

    // Start building the combined HTML
    const combinedContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <meta charset="utf-8"/>
    <title>Combined Content</title>
    <link type="text/css" rel="stylesheet" href="css/stylesheet.css"/>
    <style>
        .chapter-title {
            font-size: 1.5em;
            font-weight: bold;
            margin: 2em 0 1em;
            text-align: center;
        }
        .chapter-content {
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 1px solid #eee;
        }
    </style>
</head>
<body>`;

    let chapters = '';

    // Process each chapter
    for (let i = 0; i < chapterLinks.length; i++) {
      const link = chapterLinks[i];
      const href = link.getAttribute('href');
      const title = link.textContent || `Chapter ${i + 1}`;

      if (!href) {
        console.warn(`Skipping chapter "${title}" - no href found`);
        continue;
      }

      const chapterPath = `${epubPath}/${href}`;
      
      try {
        // Read the chapter file
        const chapterContent = await RNFS.readFile(chapterPath, 'utf8');
        
        // Parse the chapter content
        const chapterDoc = parser.parseFromString(chapterContent, 'text/html');
        
        // Extract body content
        const body = chapterDoc.getElementsByTagName('body')[0];
        if (body) {
          // Get the innerHTML of the body
          const bodyContent = body.toString()
            // Remove the body tags themselves
            .replace(/<\/?body[^>]*>/g, '')
            // Clean up any empty lines
            .trim();

          chapters += `
    <div class="chapter">
        <h2 class="chapter-title" id="${href.replace('.xhtml', '')}">${title}</h2>
        <div class="chapter-content">
            ${bodyContent}
        </div>
    </div>`;
        }
        
      } catch (chapterError) {
        console.warn(`Error processing chapter "${title}": ${chapterError}`);
      }
    }

    // Complete the HTML structure
    const finalHtml = combinedContent + chapters + '\n</body>\n</html>';

    if (!chapters) {
      throw new Error('No chapters were successfully processed');
    }

    return {
      success: true,
      content: finalHtml
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Usage example:
/*
const handleEpubCombine = async (toc: string, epubPath: string) => {
  const result = await combineEpubContent(toc, epubPath);
  
  if (result.success && result.content) {
    // Save the combined HTML to a file
    const outputPath = `${epubPath}/combined.html`;
    await RNFS.writeFile(outputPath, result.content, 'utf8');
    console.log('Combined HTML saved to:', outputPath);
  } else {
    console.error('Failed to combine EPUB content:', result.error);
  }
};
*/
