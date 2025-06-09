import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import { View } from "react-native";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onPress: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onPress
}) => {
  if (!visible) return null;

  return (
    <View className="absolute bottom-24 left-0 right-0 items-center mb-2">
      <TouchableOpacity 
        onPress={onPress}
        className="bg-primary w-10 h-10 rounded-full items-center justify-center shadow-md"
      >
        <Ionicons name="chevron-down" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}; 