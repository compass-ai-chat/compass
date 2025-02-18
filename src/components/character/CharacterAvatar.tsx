import React from 'react';
import { View, Image } from 'react-native';
import { Character } from '@/src/types/core';
import { Ionicons } from '@expo/vector-icons';

interface CharacterAvatarProps {
  character: Character;
  size?: number;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ 
  character, 
  size = 64,
  className = ""
}) => {
  if (character.image) {
    return (
      <Image 
        source={character.image} 
        className={`!h-[64px] !w-[64px] rounded-full ${className}`}
      />
    );
  }

  return (
    <View className={`!h-[64px] !w-[64px] rounded-full bg-primary items-center justify-center ${className}`} style={{ aspectRatio: 1 }}>
      <Ionicons 
        name={character.icon || 'person' as any} 
        size={size * 0.6} 
        color="white" 
      />
    </View>
  );
}; 