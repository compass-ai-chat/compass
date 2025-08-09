import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  Platform,
  Keyboard,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  charactersAtom,
  editingMessageIndexAtom,
  fontPreferencesAtom,
  userDocumentsAtom,
} from "@/src/hooks/atoms";
import { useAtom, useAtomValue } from "jotai";
import { CharacterMentionPopup } from "@/src/components/character/CharacterMentionPopup";
import { Character } from "@/src/types/core";
import { useLocalization } from "@/src/hooks/useLocalization";
import { scanForSensitiveInfo } from "@/src/utils/privacyScanner";
import { modalService } from "@/src/services/modalService";
import { ToolsMenu } from "./ToolsMenu";
import { DocumentUpload } from "./DocumentUpload";
import { Document } from '@/src/types/core';
import { UploadedDocument } from "./UploadedDocument";
import { DocumentMentionPopup } from "@/src/components/documents/DocumentMentionPopup";
import { MicButton } from "./MicButton";

interface Tool {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

interface ChatInputProps {
  onSend: (message: string, mentionedCharacters: MentionedCharacter[], mentionedDocuments: Document[]) => void;
  isGenerating?: boolean;
  onInterrupt?: () => void;
  className?: string;
  initialInputRows?: number;
}

export interface ChatInputRef {
  focus: () => void;
  setEditMessage: (message: string) => void;
}

export interface MentionedCharacter {
  character: Character;
  startIndex: number;
  endIndex: number;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  (
    { onSend, isGenerating, onInterrupt, className = "", initialInputRows = 1 },
    ref,
  ) => {
    const [message, setMessage] = useState("");
    const [mentionSearch, setMentionSearch] = useState("");
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionedCharacters, setMentionedCharacters] = useState<
      MentionedCharacter[]
    >([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<TextInput>(null);
    const allCharacters = useAtomValue(charactersAtom);
    const fontPreferences = useAtomValue(fontPreferencesAtom);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editingMessageIndex, setEditingMessageIndex] = useAtom(
      editingMessageIndexAtom,
    );
    const lineHeight = fontPreferences.lineHeight || 20; // Default line height if not specified
    const [inputHeight, setInputHeight] = useState<number>(
      initialInputRows * lineHeight,
    ); // Initial height
    const { t } = useLocalization();
    const [urls, setUrls] = useState<string[]>([]);

    const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([]);
    const userDocuments = useAtomValue(userDocumentsAtom);
    const [showDocumentPopup, setShowDocumentPopup] = useState(false);
    const [documentSelectedIndex, setDocumentSelectedIndex] = useState(0);

    //const [activeTools, setActiveTools] = useState<Set<string>>(new Set());

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      setEditMessage: (message: string) => {
        setMessage(message);
        setIsEditing(true);
        inputRef.current?.focus();
      },
    }));

    const handleChangeText = (text: string) => {
      setMessage(text);

      // get number of lines in text
      const lines = text.split("\n").length;
      if (lines == 1) setInputHeight(lineHeight * initialInputRows);
      else
        setInputHeight(
          lineHeight * Math.min(Math.max(lines, initialInputRows), 6),
        );

      const lastAtSymbol = text.lastIndexOf("@");

      if (lastAtSymbol !== -1) {
        const searchText = text.slice(lastAtSymbol + 1);
        setMentionSearch(searchText);
        setShowMentionPopup(true);
        setSelectedIndex(0);
      } else {
        setShowMentionPopup(false);
      }

      // Simple URL detection (can improve with more robust regex)
      const urlRegex = /https?:\/\/[^\s]+/g;
      const matches = text.match(urlRegex);
      if (matches) {
        console.log(matches);
        setUrls(matches);
      } else {
        setUrls([]);
      }

      // Hide document popup when typing resumes
      if (showDocumentPopup) setShowDocumentPopup(false);
    };

    const handleSelectCharacter = (character: Character) => {
      const lastAtSymbol = message.lastIndexOf("@");
      const beforeMention = message.slice(0, lastAtSymbol);
      const afterMention = message.slice(cursorPosition);
      const newMessage = `${beforeMention}@${character.name}${afterMention}`;

      setMentionedCharacters([
        ...mentionedCharacters,
        {
          character,
          startIndex: lastAtSymbol,
          endIndex: lastAtSymbol + character.name.length + 1,
        },
      ]);

      setMessage(newMessage);
      setShowMentionPopup(false);
    };

    const handleSend = async () => {
      if (!message.trim() || isGenerating) return;

      const result = scanForSensitiveInfo(message.trim());

      if (result.hasSensitiveInfo) {
        let confirmed = await modalService.confirm({
          title: t("chats.sensitive_info_warning_title"),
          message: t("chats.sensitive_info_warning_message"),
        });

        if (!confirmed) return;
      }
      onSend(message.trim(), mentionedCharacters, uploadedDocuments);
      setMentionedCharacters([]);
      setIsEditing(false);

      // Also close document popup if open
      setShowDocumentPopup(false);

      // Clear the message and reset input height
      handleChangeText("");

      // Dismiss keyboard on mobile platforms
      if (Platform.OS !== "web") {
        Keyboard.dismiss();
      }

      // Force blur and then focus to reset cursor position
      if (inputRef.current) {
        inputRef.current?.blur();

        // Small delay to ensure state updates have processed
        setTimeout(() => {
          // Only refocus on web platform
          if (Platform.OS === "web") {
            inputRef.current?.focus();

            // For web, we can try to directly manipulate the DOM element
            // const inputElement = inputRef.current as any;
            // if (inputElement._inputElement) {
            //   inputElement._inputElement.selectionStart = 0;
            //   inputElement._inputElement.selectionEnd = 0;
            // }
          }
        }, 50);
      }
    };

    const handleKeyPress = ({
      nativeEvent,
    }: {
      nativeEvent: { key: string; shiftKey?: boolean; ctrlKey?: boolean };
    }) => {
      // Ctrl+/ opens documents popup (web only)
      if (Platform.OS === "web" && nativeEvent.ctrlKey && nativeEvent.key === "/") {
        setShowDocumentPopup(true);
        setDocumentSelectedIndex(0);
        return;
      }

      // If document popup is open, handle navigation/selection
      if (Platform.OS === "web" && showDocumentPopup) {
        const docs = userDocuments;
        if (!docs || docs.length === 0) return;
        switch (nativeEvent.key) {
          case "ArrowUp":
            setDocumentSelectedIndex((prev) => (prev > 0 ? prev - 1 : docs.length - 1));
            return;
          case "ArrowDown":
            setDocumentSelectedIndex((prev) => (prev < docs.length - 1 ? prev + 1 : 0));
            return;
          case "Enter": {
            const selected = docs[documentSelectedIndex];
            if (selected) {
              const exists = uploadedDocuments.some((d) => d.id === selected.id);
              if (!exists) {
                setUploadedDocuments([...uploadedDocuments, selected]);
              }
              setShowDocumentPopup(false);
            }
            return;
          }
          case "Escape":
            setShowDocumentPopup(false);
            return;
        }
      }

      // Only handle Enter for sending on desktop/web platforms
      if (Platform.OS === "web" && nativeEvent.key === "Enter") {
        if (!nativeEvent.shiftKey) {
          handleSend();
          return;
        }
      }

      const filteredCharacters = allCharacters.filter(
        (char) =>
          mentionSearch != "" &&
          char.name.toLowerCase().includes(mentionSearch.toLowerCase()),
      );

      if (filteredCharacters.length === 0) {
        return;
      }

      switch (nativeEvent.key) {
        case "ArrowUp":
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCharacters.length - 1,
          );
          break;
        case "ArrowDown":
          setSelectedIndex((prev) =>
            prev < filteredCharacters.length - 1 ? prev + 1 : 0,
          );
          break;
        case "Enter":
          if (filteredCharacters.length > 0) {
            handleSelectCharacter(filteredCharacters[selectedIndex]);
          }
          break;
      }
    };

    const handleBlur = () => {
      setIsEditing(false);
      setMentionedCharacters([]);
      setShowMentionPopup(false);
      setEditingMessageIndex(-1);
      setShowDocumentPopup(false);
    };

    const handleDocumentUpload = (document: Document) => {
      console.log("Document uploaded", document);
      setUploadedDocuments([...uploadedDocuments, document]);
    };

    const handleDocumentRemove = (document: Document) => {
      console.log("Document removed", document);
      setUploadedDocuments(uploadedDocuments.filter((d) => d.id !== document.id));
    };

    return (
      <View
        className={`border border-primary relative flex-row items-center p-2 bg-surface rounded-t-xl mx-2 shadow-lg shadow-primary ${className}`}
      >
        <View className="flex-row absolute -top-14">
          {urls.map((url) => (
            <Text
              onPress={() => {
                Linking.openURL(url);
              }}
              className="p-2 border border-blue-500 rounded-lg text-blue-500 w-fit mx-4 bg-surface"
            >
              {url}
            </Text>
          ))}

          {uploadedDocuments.map((document) => (
            <UploadedDocument document={document} onRemove={handleDocumentRemove} />
          ))}
        </View>
        {showMentionPopup && (
          <CharacterMentionPopup
            characters={allCharacters}
            onSelect={handleSelectCharacter}
            searchText={mentionSearch}
            selectedIndex={selectedIndex}
          />
        )}
        {showDocumentPopup && (
          <DocumentMentionPopup
            documents={userDocuments}
            selectedIndex={documentSelectedIndex}
            onSelect={(doc) => {
              const exists = uploadedDocuments.some((d) => d.id === doc.id);
              if (!exists) {
                setUploadedDocuments([...uploadedDocuments, doc]);
              }
              setShowDocumentPopup(false);
            }}
          />
        )}

        <View className="flex-col items-center flex-1">
          <TextInput
            onBlur={handleBlur}
            ref={inputRef}
            className={`flex-1 m-2 py-1 outline-none w-full px-4 bg-surface rounded-lg text-text ${isEditing ? "border-2 border-yellow-500" : ""}`}
            placeholder={t("chats.type_a_message")}
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={handleChangeText}
            onKeyPress={handleKeyPress}
            onSelectionChange={(event) => {
              setCursorPosition(event.nativeEvent.selection.start);
            }}
            multiline
            textAlignVertical="top"
            style={{
              fontFamily: fontPreferences.fontFamily,
              fontSize: fontPreferences.fontSize,
              lineHeight: fontPreferences.lineHeight - 4,
              letterSpacing: fontPreferences.letterSpacing,
              height: inputHeight,
            }}
          />
          <View className="flex-row items-center mr-auto">
            <DocumentUpload className="mr-1 h-10" onDocumentUpload={handleDocumentUpload} />
            <ToolsMenu />
            <MicButton
              className="ml-2"
              onPartial={(text) => {
                // show interim in the input without sending
                const base = message.endsWith(' ') || message.length === 0 ? message : message + ' ';
                setMessage(base + text);
              }}
              onFinal={(text) => {
                // commit final text to the input
                const base = message.endsWith(' ') || message.length === 0 ? message : message + ' ';
                const newMsg = base + text.trim();
                handleChangeText(newMsg);
              }}
            />
          </View>
        </View>


        {isGenerating ? (
          <Pressable
            onPress={onInterrupt}
            className="w-10 h-10 rounded-full bg-red-500 items-center justify-center"
          >
            <Ionicons name="stop" size={26} color="white" />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            className="w-12 h-12 rounded-full bg-primary items-center justify-center"
          >
            <Ionicons name="send" size={26} color="white" />
          </Pressable>
        )}
        {isEditing && (
          <Text className="absolute -top-6 right-14 text-yellow-500 text-sm">
            Editing message...
          </Text>
        )}
      </View>
    );
  },
);
