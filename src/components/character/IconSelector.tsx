// src/components/character/IconSelector.tsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/src/components/ui/Modal';
import { useState } from 'react';

// Common Ionicon names that would make sense for character avatars
const ICON_NAMES = [
  'person', 'bulb', 'happy', 'sad', 'heart', 'star', 'planet',
  'rocket', 'paw', 'game-controller', 'musical-notes',
  'book', 'library', 'school', 'glasses', 'baseball', 'football',
  'basketball', 'bicycle', 'airplane', 'boat', 'pulse', 'magnet',
  'cafe', 'restaurant', 'pizza', 'ice-cream', 'build', 'wine',
  'fish', 'cart', 'leaf', 'rose', 'flower', 'sunny', 'rainy',
  'skull', 'moon', 'flash', 'umbrella', 'compass', 'map',
  'camera', 'film', 'tv', 'radio', 'headset', 'mic', 'beer',
  'brush', 'color-palette', 'pencil', 'desktop', 'ear', 'megaphone',
  'bug', 'watch', 'gift', 'ribbon', 'trophy', 'medal'
];

interface IconSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
  className?: string;
  modalClassName?: string;
}

export function IconSelector({ isVisible, onClose, onSelect, currentIcon, className, modalClassName }: IconSelectorProps) {
  return (
    <Modal isVisible={isVisible} onClose={onClose} className={modalClassName}>
      <View className={`bg-background p-4 rounded-lg ${className}`}>
        <Text className="text-xl font-bold mb-4 text-text">Select Icon</Text>
        <ScrollView className="max-h-[400px]">
          <View className="flex-row flex-wrap justify-between">
            {ICON_NAMES.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                onPress={() => {
                  onSelect(iconName);
                  onClose();
                }}
                className={`w-[60px] h-[60px] m-1 items-center justify-center rounded-lg 
                  ${currentIcon === iconName ? 'bg-primary' : 'bg-surface'}`}
              >
                <Ionicons
                  name={iconName as any}
                  size={32}
                  color={currentIcon === iconName ? 'white' : '#666'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity
                onPress={() => onClose()}
                className="p-4 border-t border-gray-200 dark:border-gray-700 bg-surface"
              >
                <Text className="text-center text-text">
                  Cancel
                </Text>
              </TouchableOpacity>
      </View>
    </Modal>
  );
}