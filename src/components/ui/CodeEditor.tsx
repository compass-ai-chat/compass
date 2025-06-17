import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, StyleProp, ViewStyle, TextStyle, Text } from 'react-native';
import { useColorScheme } from 'nativewind';

interface CodeEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  language?: 'json' | 'javascript' | 'typescript' | 'html' | 'css';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChangeText,
  language = 'json',
  style,
  textStyle,
  readOnly = false,
  className,
  inputClassName,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChangeText = (newText: string) => {
    setText(newText);
    onChangeText(newText);
  };

  const renderLineNumbers = () => {
    const lines = text.split('\n');
    return (
      <View className="pr-2 items-end opacity-50" style={[styles.lineNumbers, isDark ? styles.editorDark : styles.editorLight]}>
        {lines.map((_, i) => (
          <Text 
            key={i} 
            className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            style={styles.lineNumber}
          >
            {i + 1}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View className={`flex-row ${className}`} style={[styles.mainContainer, style]}>
      {renderLineNumbers()}
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        multiline
        editable={!readOnly}
        style={[
          styles.editor,
          isDark ? styles.editorDark : styles.editorLight,
          textStyle,
        ]}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textAlignVertical="top"
        className={`outline-none flex-1 ${inputClassName}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    minHeight: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  editor: {
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    lineHeight: 21,
  },
  lineNumbers: {
    padding: 12,
    paddingRight: 8,
  },
  lineNumber: {
    lineHeight: 21,
    height: 21,
  },
  editorLight: {
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  editorDark: {
    backgroundColor: '#1e1e1e',
    color: '#f5f5f5',
  },
});

export default CodeEditor; 