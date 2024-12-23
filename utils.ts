import RNFS from 'react-native-fs';

export const uriToBase64 = async (uri) => {
  try {
    let filePath = uri;
    const base64 = await RNFS.readFile(filePath, 'base64');
    return base64;
  } catch (error) {
    console.error('Error converting URI to base64:', error);
    throw error;
  }
};

// Helper function to get MIME type from URI
export const getMimeType = (uri) => {
  const extension = uri.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    pdf: 'application/pdf',
    epub: 'application/epub+zip',
  };
  
    return mimeTypes[extension] || 'application/octet-stream';
};

export const findContentOpf = async (dirPath: string): Promise<string | null> => {
  const files = await RNFS.readDir(dirPath);
  for (const file of files) {
    const filePath = `${dirPath}/${file.name}`;
    if (file.isFile() && file.name.endsWith('.opf')) {
      return filePath;
    } else if (file.isDirectory()) {
      const nestedPath = await findContentOpf(filePath);
      if (nestedPath) {
        return nestedPath;
      }
    }
  }
  return null;
};

// Helper function to create base64 data URI
export const createBase64DataUri = async (uri: string) => {
  const base64 = await uriToBase64(uri);
  const mimeType = getMimeType(uri);
  return `data:${mimeType};base64,${base64}`;
};

export const getDirname = (filePath: string): string => {
    return filePath.substring(0, filePath.lastIndexOf('/'));
}
