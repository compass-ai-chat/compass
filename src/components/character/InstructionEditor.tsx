import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';

interface PersonalityTrait {
  name: string;
  options: string[];
  current: number;
}

interface InstructionEditorProps {
  content: string;
  onChangeText: (text: string) => void;
  onInsertVariable?: () => void;
}

export function InstructionEditor({ content, onChangeText, onInsertVariable }: InstructionEditorProps) {
  const contentInputRef = useRef<TextInput>(null);
  
  const [traits, setTraits] = useState<PersonalityTrait[]>([
    {
      name: "Emotional Style",
      options: ["Very Calm", "Balanced", "Passionate", "Intense"],
      current: 1
    },
    {
      name: "Social Energy",
      options: ["Reserved", "Adaptable", "Outgoing", "Highly Social"],
      current: 1
    },
    {
      name: "Creativity",
      options: ["Practical", "Balanced", "Imaginative", "Highly Creative"],
      current: 1
    },
    {
      name: "Friendliness",
      options: ["Professional", "Friendly", "Warm", "Very Caring"],
      current: 1
    },
    {
      name: "Work Style",
      options: ["Flexible", "Organized", "Detailed", "Perfectionist"],
      current: 1
    }
  ]);

  const cycleTrait = (traitIndex: number, direction: 'left' | 'right') => {
    setTraits(currentTraits => {
      const newTraits = [...currentTraits];
      const trait = newTraits[traitIndex];
      if (direction === 'left') {
        trait.current = (trait.current - 1 + trait.options.length) % trait.options.length;
      } else {
        trait.current = (trait.current + 1) % trait.options.length;
      }
      return newTraits;
    });
  };

  const shuffleTraits = () => {
    cycleTrait(0, Math.random() > 0.5 ? 'right' : 'left');
    cycleTrait(1, Math.random() > 0.5 ? 'right' : 'left');
    cycleTrait(2, Math.random() > 0.5 ? 'right' : 'left');
    cycleTrait(3, Math.random() > 0.5 ? 'right' : 'left');
    cycleTrait(4, Math.random() > 0.5 ? 'right' : 'left');
  };

  const generatePrompt = () => {
    // This is a placeholder - you'll implement the actual generation logic
    const generatedPrompt = "Generated prompt based on selected traits...";
    onChangeText(generatedPrompt);
  };

  return (
    <View className="flex-1 flex-row space-x-4">
      {/* Left side - Personality Traits */}
      <View className="w-[300px] bg-surface rounded-lg border-2 border-border p-4">
        <Text className="text-text font-medium text-lg mb-4">Personality Traits</Text>
        
        <View className="space-y-6">
          {traits.map((trait, index) => (
            <View key={trait.name} className="space-y-2">
              <Text className="text-text font-medium">{trait.name}</Text>
              <View className="flex-row items-center justify-between bg-background rounded-lg p-2">
                <TouchableOpacity 
                  onPress={() => cycleTrait(index, 'left')}
                  className="w-8 h-8 items-center justify-center hover:bg-primary/10 rounded-full"
                >
                  <Ionicons name="chevron-back" size={20} className="text-primary" />
                </TouchableOpacity>
                
                <Text className="text-text flex-1 text-center font-medium">
                  {trait.options[trait.current]}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => cycleTrait(index, 'right')}
                  className="w-8 h-8 items-center justify-center hover:bg-primary/10 rounded-full"
                >
                  <Ionicons name="chevron-forward" size={20} className="text-primary" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View className='flex-row flex'>
          <TouchableOpacity 
            onPress={shuffleTraits}
            className="mt-6 bg-primary p-4 rounded-lg flex-row items-center justify-center hover:opacity-80 mr-2"
          >
            <FontAwesome6 name="dice" size={16} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={generatePrompt}
            className="mt-6 flex-1 bg-primary p-4 rounded-lg flex-row items-center justify-center hover:opacity-80"
          >
            <FontAwesome6 name="wand-magic-sparkles" size={16} color="white" className="mr-2" />
            <Text className="text-white font-medium">Generate Instructions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Right side - Text Input */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <FontAwesome6 name="pen-fancy" size={22} className="!text-primary mr-2" />
            <Text className="text-base font-medium text-text">Instructions</Text>
          </View>
          
          {onInsertVariable && (
            <TouchableOpacity 
              onPress={onInsertVariable}
              className="bg-primary/10 px-3 py-1 rounded-lg flex-row items-center"
            >
              <Ionicons name="code-outline" size={16} color="#6366F1" className="mr-1" />
              <Text className="text-primary text-sm font-medium">Insert Variable</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          ref={contentInputRef}
          value={content}
          onChangeText={onChangeText}
          placeholder="Enter character instructions..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          className="bg-surface p-4 rounded-lg text-text border-2 border-border flex-1 outline-none"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </View>
  );
} 