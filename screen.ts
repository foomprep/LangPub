import { Dimensions, ScaledSize } from 'react-native';
import ScreenPixels from './types/ScreenPixels';

export const getScreenPixels = (): ScreenPixels => {
  const screen: ScaledSize = Dimensions.get('window');
  const scale = screen.scale;
  
  const widthInPixels = screen.width * scale;
  const heightInPixels = screen.height * scale;
  
  return {
    widthInPixels: Math.round(widthInPixels),
    heightInPixels: Math.round(heightInPixels),
    areaInPixels: Math.round(widthInPixels * heightInPixels)
  };
};
