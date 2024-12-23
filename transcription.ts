import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

Sound.setCategory('Playback');

export enum Language {
  FRENCH = "French",
  ENGLISH = "English",
  GERMAN = "German",
  SPANISH = "Spanish", 
  ITALIAN = "Italian",
  JAPANESE = "Japanese",
  PORTUGUESE = "Portuguese",
  CHINESE = "Chinese"
}

async function generateSpeech(language: Language, text: string) {
  try {
    const response = await fetch('https://tongues.directto.link/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ language, text })
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response;
  } catch (error: any) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

export const getReactNativeSound = async (language: Language, text: string) => {
  try {
    const response = await generateSpeech(language, text);
    const blob = await response.blob();

    const reader = new FileReader();
    const base64Data = await new Promise((resolve, reject) => {
      reader.onload = () => {
        // Remove the data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Create a temporary file path
    const tempFilePath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.mp3`;

    // Write the base64 data to a temporary file
    await RNFS.writeFile(tempFilePath, base64Data, 'base64');

    // Create and return a promise for sound loading
    return new Promise((resolve, reject) => {
      const sound = new Sound(tempFilePath, '', (error) => {
        if (error) {
          console.log('Failed to load sound', error);
          // Clean up the temporary file
          RNFS.unlink(tempFilePath);
          reject(error);
          return;
        }

        resolve({ sound, tempFilePath });
      });
    });
  } catch (error) {
    console.error('Error processing audio blob:', error);
    throw error;
  }
};
