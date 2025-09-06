import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { toastService } from "@/src/services/toastService";

export interface ImageInfo {
  title?: string;
  path: string;
  date?: string;
}

export interface ImagePreviewProps {
  image:ImageInfo;
  className?: string;
  onImagePressed?: () => void
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({image, className="", onImagePressed}) => {
  const copyImageToClipboard = async () => {
    if (image?.path) {
      const response = await fetch(image.path);
      const blob = await response.blob();
      navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toastService.success({ title: "Copied to clipboard", description: "" });
    }
  };

  return (
    <div className={`relative border border-white rounded-lg ${className}`}>
      <TouchableOpacity onPress={onImagePressed}>
      <Image
        source={{ uri: image?.path }}
        className="aspect-square rounded-lg"
        resizeMode="cover"
      />
      </TouchableOpacity>
      <div className={`p-3 absolute bottom-0 w-full flex flex-row ${!image.title?'': 'bg-background opacity-[90%]'} rounded-lg`}>
        <View>
        <Text className="text-xs text-gray-500 mb-2">
          {image?.date??""}
        </Text>
        <Text className="text-sm text-text" numberOfLines={3}>
          {image?.title??""}
        </Text>
        </View>
        <button
          onClick={copyImageToClipboard}
          className="mt-2 px-4 py-2 bg-surface text-primary rounded ms-auto"
        >
          Copy
        </button>
      </div>
    </div>
  )
}