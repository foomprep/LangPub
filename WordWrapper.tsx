import React from 'react';
import { Text, TouchableOpacity, TextStyle, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface WordWrapperProps {
  text: string;
  textStyle?: TextStyle;
  onWordPress?: (word: string, index?: number) => void;
  preserveWhitespace?: boolean;
}

const WordWrapper: React.FC<WordWrapperProps> = ({
  text,
  textStyle,
  onWordPress,
  preserveWhitespace = false
}) => {
  const words = preserveWhitespace 
    ? text.split(/(\s+)/) 
    : text.split(/\s+/);

  return (
    <View 
      style={styles.container}
      pointerEvents="box-none"  // Add this
    >
      {words.map((word, index) => {
        if (!word) return null;

        if (preserveWhitespace && /^\s+$/.test(word)) {
          return <Text key={`space-${index}`}>{word}</Text>;
        }

        return (
          <TouchableOpacity
            key={`word-${index}`}
            onPress={() => onWordPress?.(word, index)}
            activeOpacity={0.6}
            delayLongPress={500}  // Add this
          >
            <Text style={[textStyle]}>
              {word}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 2,
  },
});

export default WordWrapper;
