import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useAtomValue } from 'jotai';
import { generatedImagesAtom } from '@/src/hooks/atoms';
import { format } from 'date-fns';
import { ImageGenerator } from '@/src/components/image/ImageGenerator';
import { Gallery } from '@/src/components/image/Gallery';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '@/src/hooks/useLocalization';
type Tab = 'generator' | 'gallery';

export default function ImageGenerationScreen() {
  const [activeTab, setActiveTab] = React.useState<Tab>('generator');
  const images = useAtomValue(generatedImagesAtom);
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth < 768 ? screenWidth / 2 - 24 : screenWidth / 4 - 32;
  const { t } = useLocalization();

  const TabButton: React.FC<{
    tab: Tab;
    label: string;
  }> = ({ tab, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`w-32 py-3 m-2 rounded-lg hover:bg-surface ${
        activeTab === tab
          ? 'border border-primary shadow-sm bg-surface'
          : 'border-b-2 border-transparent'
      }`}
    >
      <Text
        className={`text-center ${
          activeTab === tab ? 'text-primary font-semibold' : 'text-text'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background p-4">
      <View className="flex-row items-center p-4">
        <Ionicons name="image" size={32} className="!text-primary mr-2 pb-2" />
        <Text className="text-2xl font-bold text-primary">
            {t('images.images')}
        </Text>
        { Platform.OS == 'web' && <View className="ms-4 flex-row border-border">
          <TabButton tab="generator" label={t('images.generate')} />
          <TabButton tab="gallery" label={t('images.gallery')} />
        </View>}
      </View>
      
      <View className="flex-1 relative">
        <View 
          className={`absolute inset-0 flex-1 ${
            activeTab === 'generator' ? 'opacity-100' : 'opacity-0'
          }`}
          pointerEvents={activeTab === 'generator' ? 'auto' : 'none'}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <ImageGenerator />
        </View>
        <View 
          className={`absolute inset-0 flex-1 ${
            activeTab === 'gallery' ? 'opacity-100' : 'opacity-0'
          }`}
          pointerEvents={activeTab === 'gallery' ? 'auto' : 'none'}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <Gallery />
        </View>
      </View>
      { Platform.OS !== 'web' && <View className="ms-4 flex-row border-border">
        <View className="flex-row mx-auto">
          <TabButton tab="generator" label="Generate" />
          <TabButton tab="gallery" label="Gallery" />
          </View>
        </View>
      }
    </View>
  );
}