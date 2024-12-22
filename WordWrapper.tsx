import React from 'react';
import { Text, TouchableOpacity, TextStyle, StyleSheet, View } from 'react-native';

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
    <View style={styles.container}>
      {words.map((word, index) => {
        if (!word) return null;

        if (preserveWhitespace && /^\s+$/.test(word)) {
          return <Text key={`space-${index}`}>{word}</Text>;
        }

        return (
          <TouchableOpacity
            key={`word-${index}`}
            onPress={() => onWordPress?.(word, index)}
          >
            <Text style={[styles.text, textStyle]}>
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
    gap: 3,
  },
  text: {
    fontSize: 16,
  }
});

export default WordWrapper;

// Example usage:
/*
const ExampleComponent = () => {
  return (
    <WordWrapper
      text="This is a sample text"
      textStyle={{ fontSize: 18, color: 'blue' }}
      onWordPress={(word, index) => console.log(`Pressed: ${word}`)}
    />
  );
};
*/
