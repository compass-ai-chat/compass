import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useAtom, useAtomValue } from 'jotai';
import { GeneratedImage, generatedImagesAtom } from '@/src/hooks/atoms';
import { format } from 'date-fns';
import { open, BaseDirectory, readFile } from "@tauri-apps/plugin-fs"
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ImagePreview } from './ImagePreview';
function isTauri(){
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

export async function getTauriImageUri(imagePath: string) {
  if(!isTauri()) {
    return imagePath;
  }
  const byteContents = await readFile(imagePath, { baseDir: BaseDirectory.Picture });
  // Create a Blob from the byte contents
  const blob = new Blob([byteContents], { type: 'image/webp' });
  // Create and return an object URL
  return URL.createObjectURL(blob);
}

export function Gallery() {
  const [images, setImages] = useAtom(generatedImagesAtom);
  const [loadedImages, setLoadedImages] = useState<GeneratedImage[]>([]);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth < 768 ? screenWidth / 2 - 24 : screenWidth / 4 - 32;

  useEffect(() => {
    const loadImageUris = async () => {
      const imagesWithUris = await Promise.all(
        images.map(async (image) => ({
          ...image,
          imagePath: await getTauriImageUri(image.imagePath)
        }))
      );
      setLoadedImages(imagesWithUris);
    };

    loadImageUris();
  }, [images]);

  if (images.length === 0) {
    return (
      <View className="flex-1 bg-background p-4 justify-center items-center">
        <Text className="text-text text-lg text-center mb-2">
          No images generated yet
        </Text>
        <Text className="text-gray-500 text-center">
          Generate some images and they will appear here
        </Text>
      </View>
    );
  }
  

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-text mb-4">
        Generated Images
      </Text>
      
      <View className="flex-row flex-wrap gap-4">
        {loadedImages.map((image) => (
          <View 
            key={image.id} 
            className="bg-surface rounded-lg overflow-hidden shadow-md"
            style={{ width: imageSize }}
          >
              <ImagePreview onImagePressed={()=>{
                setSelectedImage(image.imagePath);
                setIsImageViewVisible(true);
              }} image={{path: image.imagePath, title: image.prompt, date: image.createdAt}}></ImagePreview>
            
          </View>
        ))}
      </View>
      <Modal
    isVisible={isImageViewVisible}
    onBackdropPress={() => setIsImageViewVisible(false)}
    onSwipeComplete={() => setIsImageViewVisible(false)}
    coverScreen={true}
    swipeDirection={['down']}
    className="m-0 flex items-center justify-center"
  >
    <View className="flex-1 mx-auto flex items-center justify-center">
    <TouchableOpacity 
        onPress={() => setIsImageViewVisible(false)}
        className="absolute right-4 top-4 z-10 bg-black/50 rounded-full p-2"
      >
        <MaterialCommunityIcons name="close" size={24} color="white" />
      </TouchableOpacity>
      <Image
        source={{ uri: selectedImage! }}
        className="w-[70vw] flex-1 rounded-lg overflow-hidden"
        resizeMode="contain"
      />
    </View>
  </Modal>
    </ScrollView>
    
  );
} 