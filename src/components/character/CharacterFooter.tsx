import { View, Text, TouchableOpacity } from "react-native";
import { Character } from "@/src/types/core";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalization } from "@/src/hooks/useLocalization";

interface CharacterFooterProps {
  character: Character | null;
  onSave: () => void;
  onDelete: () => void;
}

export function CharacterFooter({
  character,
  onSave,
  onDelete,
}: CharacterFooterProps) {
  const { t } = useLocalization();

  return (
    <View className="p-4 border-t border-border flex-row justify-between">
      {character?.id && (
        <TouchableOpacity
          onPress={onDelete}
          className="border-2 border-red-100 dark:border-red-900 p-4 rounded-lg flex-row items-center justify-center flex-1 mr-2 hover:opacity-80"
        >
          <Ionicons
            name="trash-outline"
            size={20}
            className="mr-2 !text-red-500 dark:!text-red-300"
          />
          <Text className="!text-red-500 dark:!text-red-300 font-medium">
            {t('common.delete')}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onSave}
        className="bg-primary p-4 rounded-lg flex-row items-center justify-center flex-1 hover:opacity-80"
      >
        <Ionicons
          name="save-outline"
          size={20}
          color="white"
          className="mr-2"
        />
        <Text className="text-white font-medium text-base">
          {character?.id ? t('common.save') : t('common.create')}
        </Text>
      </TouchableOpacity>
    </View>
  );
} 