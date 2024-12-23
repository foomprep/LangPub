import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import type Chapter from './types/Chapter';

interface TableOfContentsProps {
  visible: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onChapterPress: (index: number) => void;
  currentChapter: number;
}

const TableOfContents = ({
  visible,
  onClose,
  chapters,
  onChapterPress,
  currentChapter
}: TableOfContentsProps) => {
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Table of Contents</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.chapterList}>
            {chapters.map((chapter, index) => (
              <TouchableOpacity
                key={`${chapter.href}-${index}`}
                style={[
                  styles.chapterItem,
                  currentChapter === index && styles.currentChapter
                ]}
                onPress={() => {
                  onChapterPress(index);
                  onClose();
                }}
              >
                <Text 
                  style={[
                    styles.chapterTitle,
                    currentChapter === index && styles.currentChapterText
                  ]}
                >
                  {chapter.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentContainer: {
    backgroundColor: 'white',
    width: '80%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  chapterList: {
    flexGrow: 0
  },
  chapterItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  currentChapter: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8
  },
  chapterTitle: {
    fontSize: 16,
    paddingHorizontal: 10
  },
  currentChapterText: {
    fontWeight: 'bold'
  }
});

export default TableOfContents;
