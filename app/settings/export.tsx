import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { threadsAtom } from '@/src/hooks/atoms';
import { Platform } from 'react-native';
import YAML from 'yaml';
import { useLocalization } from '@/src/hooks/useLocalization';

type ExportFormat = 'json' | 'csv' | 'yaml';

export default function ExportScreen() {
  const { t } = useLocalization();
  const threads = useAtomValue(threadsAtom);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');

  const exportData = async () => {
    let exportContent: string;
    const filename = `compass-chat-export-${new Date().toISOString().split('T')[0]}`;

    switch (selectedFormat) {
      case 'json':
        exportContent = JSON.stringify(threads, null, 2);
        downloadFile(`${filename}.json`, exportContent, 'application/json');
        break;
      case 'csv':
        const csvContent = threads.map(thread => {
          return thread.messages.map(msg => (
            `"${thread.title}","${msg.role == 'user' ? 'User' : 'Assistant'}","${msg.content.replace(/"/g, '""')}","${new Date(parseInt(thread.id)).toISOString()}"`
          )).join('\n');
        }).join('\n');
        exportContent = `Thread,Speaker,Message,Timestamp\n${csvContent}`;
        downloadFile(`${filename}.csv`, exportContent, 'text/csv');
        break;
      case 'yaml':
        exportContent = YAML.stringify(threads);
        downloadFile(`${filename}.yaml`, exportContent, 'application/yaml');
        break;
    }
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const FormatButton = ({ format }: { format: ExportFormat }) => (
    <TouchableOpacity
      onPress={() => setSelectedFormat(format)}
      className={`flex-1 p-4 m-2 rounded-lg border-2 ${
        selectedFormat === format ? 'border-primary bg-primary/10' : 'border-border bg-surface'
      }`}
    >
      <Text className={`text-lg font-semibold text-center ${
        selectedFormat === format ? 'text-primary' : 'text-text'
      }`}>
        {format.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="mb-6">
        <View className="flex-row items-center p-4">
          <Ionicons name="download" size={32} className="!text-primary mr-2 pb-2" />
          <Text className="text-2xl font-bold text-primary">
            {t('settings.export.data_export')}
          </Text>
        </View>
        
        <Text className="text-secondary mb-4">
          {t('settings.export.data_ownership')}
        </Text>

        <View className="bg-surface p-4 rounded-lg border border-border mb-6">
          <Text className="text-text font-semibold mb-2">{t('settings.export.available_formats')}</Text>
          <Text className="text-secondary mb-1">{t('settings.export.json_format')}</Text>
          <Text className="text-secondary">{t('settings.export.yaml_format')}</Text>
        </View>

        <Text className="text-lg font-semibold text-text mb-4">{t('settings.export.select_export_format')}</Text>
        <View className="flex-row mb-6">
          <FormatButton format="json" />
          <FormatButton format="yaml" />
        </View>

        <TouchableOpacity
          onPress={exportData}
          className="bg-primary p-4 rounded-lg"
        >
          <Text className="text-white text-center font-semibold text-lg">
            {t('settings.export.export_my_data')}
          </Text>
        </TouchableOpacity>

        <Text className="text-secondary mt-6 text-sm">
          {t('settings.export.export_note')}
        </Text>
      </View>
    </ScrollView>
  );
} 