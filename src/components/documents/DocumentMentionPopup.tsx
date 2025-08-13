import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Document } from "@/src/types/core";

interface DocumentMentionPopupProps {
  documents: Document[];
  selectedIndex: number;
  onSelect: (document: Document) => void;
}

export const DocumentMentionPopup: React.FC<DocumentMentionPopupProps> = ({
  documents,
  selectedIndex,
  onSelect,
}) => {
  if (!documents || documents.length === 0) return null;

  return (
    <View className="absolute bottom-full left-0 mb-2 bg-background rounded-lg shadow-lg max-h-40 w-72 overflow-hidden border border-border">
      <ScrollView>
        {documents.map((doc, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={doc.id}
              onPress={() => onSelect(doc)}
              className={`p-2 border-b border-gray-200 dark:border-gray-700 ${
                isSelected ? "bg-blue-100 dark:bg-blue-900" : ""
              }`}
            >
              <Text
                className={`font-medium text-gray-800 dark:text-gray-200 ${
                  isSelected ? "text-blue-600 dark:text-blue-400" : ""
                }`}
                numberOfLines={1}
              >
                {doc.name}
              </Text>
              {doc.metadata?.size ? (
                <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                  {Math.round(doc.metadata.size / 1024)} KB
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}; 