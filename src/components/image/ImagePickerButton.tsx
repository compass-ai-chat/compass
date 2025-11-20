import React from 'react';
import { TouchableOpacity, Image, View, Text, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerButtonProps {
  currentImage: any;
  onImageSelected: (imageUri: string) => void;
}

export function ImagePickerButton({ currentImage, onImageSelected }: ImagePickerButtonProps) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      if (Platform.OS === 'web') {
        // For web, we can use the manipulated image URI directly
        onImageSelected(manipulatedImage.uri);
      } else {
        // For native platforms, save to app's storage
        const fileName = `character_${Date.now()}.png`;
        const newPath = `${FileSystem.documentDirectory}characters/${fileName}`;
        
        try {
          // Ensure directory exists
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}characters/`, {
            intermediates: true
          });

          await FileSystem.copyAsync({
            from: manipulatedImage.uri,
            to: newPath
          });

          onImageSelected(newPath);
        } catch (error) {
          console.error('Error saving image:', error);
          // Fallback to using the manipulated image URI directly
          onImageSelected(manipulatedImage.uri);
        }
      }
    }
  };

  return (
    <TouchableOpacity onPress={pickImage} className="items-center">
      <View className="relative">
        <Image 
          source={typeof currentImage === 'string' ? { uri: currentImage } : currentImage}
          className="h-[80px]! w-[80px]! rounded-full mb-4"
        />
        <View className="absolute bottom-4 right-0 bg-primary rounded-full p-1">
          <Ionicons name="camera" size={16} color="white" />
        </View>
      </View>
      <Text className="text-sm text-text">
        Tap to change avatar
      </Text>
    </TouchableOpacity>
  );
} 