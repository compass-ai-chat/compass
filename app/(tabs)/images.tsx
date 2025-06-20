import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useAtomValue } from 'jotai';
import { generatedImagesAtom } from '@/src/hooks/atoms';
import { ImageGenerator } from '@/src/components/image/ImageGenerator';
import { Gallery } from '@/src/components/image/Gallery';
import { useLocalization } from '@/src/hooks/useLocalization';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useResponsiveStyles } from '@/src/hooks/useResponsiveStyles';

type Tab = 'generator' | 'gallery';

export default function ImageGenerationScreen() {
  const [activeTab, setActiveTab] = React.useState<Tab>('generator');
  const images = useAtomValue(generatedImagesAtom);
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth < 768 ? screenWidth / 2 - 24 : screenWidth / 4 - 32;
  const { t } = useLocalization();
  const { getResponsiveValue } = useResponsiveStyles();

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

  const tabButtons = (
    <View className="flex-row border-border">
      <TabButton tab="generator" label={t('images.generate')} />
      <TabButton tab="gallery" label={t('images.gallery')} />
    </View>
  );

  return (
    <View className="flex-1 bg-background p-4">
      <SectionHeader
        title={t('images.images')}
        icon="image"
        rightContent={getResponsiveValue({
          desktop: <View className="ms-4 flex-row">{tabButtons}</View>,
          mobile: null
        })}
      />
      
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
      {getResponsiveValue({
        mobile: (
          <View className="ms-4 flex-row border-border">
            <View className="flex-row mx-auto">{tabButtons}</View>
          </View>
        ),
        desktop: null
      })}
    </View>
  );
}