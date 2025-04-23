import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Model, AllowedModel } from "@/src/types/core";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Modal } from "@/src/components/ui/Modal";
import { Image } from "react-native";
import { useLocalization } from "@/src/hooks/useLocalization";

interface ModelPreferenceSelectorProps {
  availableModels: Model[];
  selectedPreferences: AllowedModel[];
  onAddPreference: (model: AllowedModel) => void;
  onRemovePreference: (model: AllowedModel) => void;
}

export function ModelPreferenceSelector({
  availableModels,
  selectedPreferences,
  onAddPreference,
  onRemovePreference,
}: ModelPreferenceSelectorProps) {
  const { t } = useLocalization();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const handleAddPreference = () => {
    console.log({ availableModels, selectedModelId });
    if (selectedModelId) {
      onAddPreference({
        id: selectedModelId,
        providerId:
          availableModels.find((model) => model.id === selectedModelId)
            ?.provider.id ?? "",
        priority: 0,
      });
      setIsModalVisible(false);
      setSelectedModelId(null);
    }
  };

  const getModelById = (modelId: string): Model | undefined => {
    return availableModels.find((model) => model.id === modelId);
  };

  const getPreferenceLabel = (level: "preferred" | "required"): string => {
    return level === "required" ? "Required" : "Preferred";
  };

  return (
    <View className="mb-4">
      <Text className="text-base font-medium mb-2 text-text">
        {t('characters.edit_character.available_models')}
      </Text>

      <View className="bg-surface p-4 rounded-lg border-2 border-border">
        {selectedPreferences.length === 0 ? (
          <Text className="text-secondary italic">
            {t('characters.edit_character.no_requirements')}
          </Text>
        ) : (
          <View className="space-y-2">
            {selectedPreferences.map((preference) => {
              const model = getModelById(preference.id);
              return (
                <View
                  key={preference.id}
                  className="flex-row items-center justify-between bg-background p-3 rounded-lg"
                >
                  <View className="flex-row items-center">
                    {model?.provider?.logo && (
                      <Image
                        source={{ uri: model.provider.logo }}
                        className="!w-[24px] !h-[24px] rounded-full mr-2"
                      />
                    )}
                    <View>
                      <Text className="text-text font-medium">
                        {model?.name || preference.id}
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className={`w-2 h-2 rounded-full bg-green-500 mr-1`}
                        />
                        <Text className="text-secondary text-xs">{t('characters.edit_character.allowed')}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemovePreference(preference)}
                    className="p-2 bg-red-100 dark:bg-red-900 rounded-full"
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      className="!text-red-500 dark:!text-red-300"
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          className="mt-4 p-3 bg-primary rounded-lg flex-row items-center justify-center"
        >
          <Ionicons name="add" size={20} color="white" className="mr-2" />
          <Text className="text-white font-medium">{t('characters.edit_character.add_model')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <View className="p-4 bg-surface rounded-lg">
          <Text className="text-lg font-bold text-text mb-4 text-center">
            {t('characters.edit_character.add_model_requirement')}
          </Text>

          <Text className="text-base font-medium mb-2 text-text">
            {t('characters.edit_character.select_model')}
          </Text>
          <ScrollView className="max-h-60 mb-4">
            <View className="space-y-2">
              {availableModels.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => setSelectedModelId(model.id)}
                  className={`p-3 rounded-lg flex-row items-center ${
                    selectedModelId === model.id
                      ? "bg-primary/20 border border-primary"
                      : "bg-background"
                  }`}
                >
                  {model.provider?.logo && (
                    <Image
                      source={{ uri: model.provider.logo }}
                      className="!w-[24px] !h-[24px] rounded-full mr-2"
                    />
                  )}
                  <Text className="text-text">{model.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="flex-1 p-3 bg-background border border-border rounded-lg"
            >
              <Text className="text-text text-center">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddPreference}
              className={`flex-1 p-3 rounded-lg ${
                selectedModelId ? "bg-primary" : "bg-primary/50"
              }`}
              disabled={!selectedModelId}
            >
              <Text className="text-white text-center">{t('common.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
