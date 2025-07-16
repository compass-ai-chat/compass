import React, { useCallback, useEffect, useRef } from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Switch } from "@/src/components/ui/Switch";
import {
  currentThreadAtom,
  hotToolsAtom,
  thinkingActiveAtom,
} from "@/src/hooks/atoms";
import { useAtom } from "jotai";
import { FontAwesome6 } from "@expo/vector-icons";

interface DocumentUploadProps {
  className?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({className}) => {
  const [currentThread, setCurrentThread] = useAtom(currentThreadAtom);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const handleUploadDocument = () => {
    console.log("Uploading document");
  }

  return (
    <Pressable
      onPress={() => handleUploadDocument()}
      className={`flex-row items-center p-2 rounded-md border border-border ${className}`}
            >
              <Ionicons name="document-text-outline" size={20} className="!text-text" />
              <Text className="ml-2 text-text text-2xl">+</Text>
      </Pressable>
  );
};
