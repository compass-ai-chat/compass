import { View, Text, TouchableOpacity, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Provider } from "@/src/types/core";
import { PROVIDER_LOGOS } from "@/src/constants/logos";
import LogoRenderer from "../ui/LogoRenderer";

interface ProviderCardProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onRefresh: (provider: Provider) => void;
  className?: string;
}

export function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onRefresh,
  className,
}: ProviderCardProps) {
  return (
    <View key={provider.id} className={`rounded-lg shadow-sm ${className}`}>
      <View className="flex-row items-center justify-between h-14">
        <View className="flex-row items-center p-2">
          {provider.logo && (
            <LogoRenderer logo={provider.logo} size={32} className="mr-2 !text-primary" />
          )}
          <Text className="text-lg font-semibold text-text">
            {provider.name}
          </Text>
        </View>
        <View className="flex-row h-full items-center">
          <TouchableOpacity
            onPress={() => onRefresh(provider)}
            className="p-2 hover:opacity-60 bg-background h-full justify-center items-center w-12 rounded-full mr-2"
          >
            <Ionicons name="refresh" size={20} className="!text-primary" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onEdit(provider)}
            className="p-2 hover:opacity-60 bg-background h-full justify-center items-center w-12"
          >
            <Ionicons name="pencil" size={20} className="!text-secondary" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(provider)}
            className="p-2 w-12 hover:opacity-60 rounded-lg rounded-l-none h-full justify-center items-center dark:bg-red-900 bg-red-100 "
          >
            <Ionicons
              name="trash"
              size={20}
              className="text-red-500! dark:text-red-300!"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
