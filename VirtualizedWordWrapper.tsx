import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface VirtualizedWordWrapperProps {
  text: string;
  textStyle?: any;
  onWordPress?: (word: string) => void;
}

const VirtualizedWordWrapper: React.FC<VirtualizedWordWrapperProps> = ({
  text,
  textStyle,
  onWordPress
}) => {
  // Split into paragraphs first to maintain structure
  const paragraphs = text.split(/\n+/).filter(Boolean);
  const items = paragraphs.map((paragraph, idx) => ({
    id: `p-${idx}`,
    words: paragraph.split(/\s+/).filter(Boolean)
  }));

  const renderItem = ({ item }: { item: { id: string; words: string[] } }) => (
    <View style={styles.paragraphContainer}>
      <View style={styles.wordContainer}>
        {item.words.map((word, index) => (
          <TouchableOpacity
            key={`${item.id}-word-${index}`}
            onPress={() => onWordPress?.(word)}
            style={styles.wordWrapper}
          >
            <Text style={textStyle}>
              {word}
              <Text style={textStyle}>{' '}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      estimatedItemSize={50}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  paragraphContainer: {
    marginBottom: 16,
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  wordWrapper: {
    marginRight: 2,
    marginBottom: 2,
  }
});

export default VirtualizedWordWrapper;
