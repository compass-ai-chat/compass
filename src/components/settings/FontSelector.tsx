import React from 'react';
import { View, Text } from 'react-native';
import { useAtom } from 'jotai';
import { fontPreferencesAtom } from '@/src/hooks/atoms';
import { Selector } from '@/src/components/Selector';
import { Message } from '@/src/components/chat/Message';
import { useLocalization } from '@/src/hooks/useLocalization';

const AVAILABLE_FONTS = [
  { id: 'Caveat-Medium', name: 'Caveat Medium' },
  { id: 'Caveat-Regular', name: 'Caveat Regular' },
  { id: 'Caveat-Bold', name: 'Caveat Bold' },
  { id: 'SpaceMono', name: 'Space Mono' },
  { id: 'System', name: 'System Default' },
];

const FONT_SIZES = [10, 12, 14, 16, 18];
const LINE_HEIGHTS = [14, 18, 22];
const LETTER_SPACING_VALUES = [0, 0.4, 0.8, 1.2, 1.6];

interface FontSelectorProps {
  className?: string;
}

export function FontSelector({ className }: FontSelectorProps) {
  const { t } = useLocalization();
  const [preferences, setPreferences] = useAtom(fontPreferencesAtom);

  const renderSelectors = () => {
    return <View>
    <Selector
        title={t('settings.font_settings.font_family')}
        options={AVAILABLE_FONTS.map(font => ({
          label: font.name,
          value: font.id
        }))}
        value={preferences.fontFamily}
        onChange={(value) => setPreferences(prev => ({ ...prev, fontFamily: value }))}
        horizontal
      />

      <Selector
        title={t('settings.font_settings.font_size')}
        options={FONT_SIZES.map(size => ({
          label: `${size}px`,
          value: size
        }))}
        value={preferences.fontSize}
        onChange={(value) => setPreferences(prev => ({ ...prev, fontSize: value }))}
        horizontal
      />

      <Selector
        title={t('settings.font_settings.line_height')}
        options={LINE_HEIGHTS.map(height => ({
          label: `${height}px`,
          value: height
        }))}
        value={preferences.lineHeight}
        onChange={(value) => setPreferences(prev => ({ ...prev, lineHeight: value }))}
        horizontal
      />

      <Selector
        title={t('settings.font_settings.letter_spacing')}
        options={LETTER_SPACING_VALUES.map(spacing => ({
          label: `${spacing}`,
          value: spacing
        }))}
        value={preferences.letterSpacing}
        onChange={(value) => setPreferences(prev => ({ ...prev, letterSpacing: value }))}
        horizontal
      />

    </View>
  }

  return (
    <View className={`p-4 ${className}`}>
      <Text className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
        {t('settings.font_settings.message_appearance')}
      </Text>

      {renderSelectors()}

      <View className="mt-8 border rounded-lg p-4 border-gray-200 dark:border-gray-700">
        <Text className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          {t('settings.font_settings.preview')}
        </Text>
        <Message
          message={{
            content: t('settings.font_settings.preview_message'),
            isUser: false,
          }}
          content={t('settings.font_settings.preview_message')}
          isUser={false}
          index={0}
        />
        <Message
          message={{
            content: t('settings.font_settings.preview_user_message'),
            isUser: true,
          }}
          content={t('settings.font_settings.preview_user_message')}
          isUser={true}
          index={0}
        />
      </View>
    </View>
  );
} 