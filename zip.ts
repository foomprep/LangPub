import { unzip } from 'react-native-zip-archive';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

interface UnzipResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Unzips a file from a content URI to the app's cache directory
 * @param contentUri - The content URI of the zip file (e.g., content://com.android.providers.media.documents/document/document%3A1000015205)
 * @returns Promise resolving to an UnzipResult object containing the operation status and output path
 */
export const unzipFromContentUri = async (contentUri: string): Promise<UnzipResult> => {
  try {
    // Validate input
    if (!contentUri.startsWith('content://')) {
      throw new Error('Invalid content URI format');
    }

    // Get the app's cache directory
    const cacheDir = Platform.select({
      android: RNFS.CachesDirectoryPath,
      ios: RNFS.TemporaryDirectoryPath,
    });

    if (!cacheDir) {
      throw new Error('Could not determine cache directory');
    }

    // Create a unique output directory name using timestamp
    const timestamp = new Date().getTime();
    const outputPath = `${cacheDir}/unzipped_${timestamp}`;

    // Create the output directory if it doesn't exist
    await RNFS.mkdir(outputPath);

    // Copy the content URI to a temporary file (needed for Android content URIs)
    const tempZipPath = `${cacheDir}/temp_${timestamp}.zip`;
    await RNFS.copyFile(contentUri, tempZipPath);

    // Unzip the file
    const unzippedPath = await unzip(tempZipPath, outputPath);

    // Clean up the temporary zip file
    await RNFS.unlink(tempZipPath);

    return {
      success: true,
      outputPath: unzippedPath,
    };

  } catch (error) {
    // Clean up any partial output if there was an error
    try {
      const outputPath = `${Platform.select({
        android: RNFS.CachesDirectoryPath,
        ios: RNFS.TemporaryDirectoryPath,
      })}/unzipped_${new Date().getTime()}`;
      
      if (await RNFS.exists(outputPath)) {
        await RNFS.unlink(outputPath);
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

