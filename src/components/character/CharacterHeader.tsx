import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Character } from "@/src/types/core";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ImagePickerButton } from "@/src/components/image/ImagePickerButton";
import { Platform } from "@/src/utils/platform";
import { useLocalization } from "@/src/hooks/useLocalization";

interface CharacterHeaderProps {
  character: Character | null;
  useIcon: boolean;
  onCharacterChange: (character: Character) => void;
  onImageSelected: (imageUri: string) => void;
  onShowIconSelector: () => void;
}

export function CharacterHeader({
  character,
  useIcon,
  onCharacterChange,
  onImageSelected,
  onShowIconSelector,
}: CharacterHeaderProps) {
  const { t } = useLocalization();

  return (
    <View className="items-center mb-8 pt-4 border-b border-border mx-4 flex-row py-4">
      {!Platform.isMobile && false && (
        <Text className="text-text text-sm mb-4 pl-2 border-l-4 border-border">
          A Character shapes your AI assistant's communication style and available resources. By defining specific traits, tools and documents, you can transform generic responses into meaningful interactions tailored to your needs - whether you're seeking a creative writing partner, technical expert, or thoughtful mentor.
        </Text>
      )}
      <View className="items-center justify-between border-r border-border px-4 mr-4">
        <View className="relative">
          {useIcon ? (
            <TouchableOpacity
              onPress={onShowIconSelector}
              className="w-[80px] h-[80px] rounded-full bg-primary items-center justify-center hover:opacity-80"
            >
              <Ionicons
                name={character?.icon as any || "person-outline"}
                size={48}
                color="white"
                className="text-white"
              />
            </TouchableOpacity>
          ) : (
            <ImagePickerButton
              currentImage={character?.image}
              onImageSelected={onImageSelected}
            />
          )}
        </View>
      </View>

      <View className="flex-1">
        <Text className="text-base font-medium mb-2 text-text">
          {t('characters.edit_character.name')}
        </Text>
        <TextInput
          value={character?.name || ""}
          onChangeText={(text) =>
            onCharacterChange({ ...character!, name: text })
          }
          placeholder={t('characters.edit_character.enter_character_name')}
          className="p-4 rounded-lg text-text border-2 border-border bg-surface outline-none"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
    </View>
  );
} 