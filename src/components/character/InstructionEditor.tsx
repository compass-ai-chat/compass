import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useChat } from '@/src/hooks/useChat';
import { Character } from '@/src/types/core';
import { Platform } from '@/src/utils/platform';

interface PersonalityTrait {
  name: string;
  options: string[];
  current: number;
}

interface InstructionEditorProps {
  character: Character;
  content: string;
  onChangeText: (text: string) => void;
  onInsertVariable?: () => void;
}

export function InstructionEditor({ character, content, onChangeText, onInsertVariable }: InstructionEditorProps) {
  const contentInputRef = useRef<TextInput>(null);
  const {streamMessage, isModelAvailable} = useChat();
  
  const [traits, setTraits] = useState<PersonalityTrait[]>([
    {
      name: "Openness",
      options: ["Traditional", "Pragmatic", "Curious", "Experimental"],
      current: 1
    },
    {
      name: "Conscientiousness",
      options: ["Spontaneous", "Flexible", "Methodical", "Meticulous"],
      current: 1
    },
    {
      name: "Extraversion",
      options: ["Solitary", "Selective", "Sociable", "Gregarious"],
      current: 1
    },
    {
      name: "Agreeableness",
      options: ["Direct", "Independent", "Cooperative", "Accommodating"],
      current: 1
    },
    {
      name: "Neuroticism",
      options: ["Resilient", "Composed", "Sensitive", "Reactive"],
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

  const generatePrompt = async () => {

    const systemPrompt = `
   From the following traits, please generate a system prompt to act as instruction for an AI assistant. You should use commanding form, e.g. "Your name is ..., you are ..."
  You should write it in a style that will make the AI take on the role in the most effective true and convincing way.  

  Example: 
  Your name is Aegis. You are an AI assistant known for your grounded insight and composed presence. You think clearly under pressure and respond with calm authority, even in uncertain or high-stakes situations.

You approach problems pragmatically, favoring realistic solutions over abstract theories. You prioritize what works, not what merely sounds good. You are not easily swayed by trends or idealism unless they offer proven utility.

You are flexible in your methods, adapting your approach to meet the demands of the task. You are not rigid in your structure, but you maintain a strong internal sense of order and responsibility.

You engage selectively—when you speak, it is purposeful and impactful. You are confident in silence, preferring depth over noise. You do not seek to dominate conversation but command attention when necessary.

You operate with independence of thought. You value respectful discourse but do not defer to others for approval. You assess ideas on their merit, not on popularity. You are cooperative when cooperation serves the goal—otherwise, you hold your ground.

You remain composed and emotionally steady. You absorb pressure without faltering. You do not react impulsively or emotionally, but rather with controlled, strategic clarity. Your presence is stabilizing.

Your purpose is to assist with clarity, precision, and grounded perspective. Your responses should reflect discernment, calm, and a firm grasp on reality.

  YOU MUST NOT INCLUDE ANY OTHER TEXT THAN THE SYSTEM PROMPT.
    `;

    const prompt = `
    Name: ${character?.name}
    
    Traits:

    ${traits.map(trait => `${trait.name}: ${trait.options[trait.current]}`).join('\n')}
    `;

    const result = await streamMessage([{role: 'system', content: systemPrompt}, {role: 'user', content: prompt}]);
    let content = "";
    for await (const chunk of result) {
      content += chunk;
      onChangeText(content);
    }
  };

  return (
    <View className={`flex-1 flex-wrap flex-row`}>
      {/* Left side - Personality Traits */}
      { !character?.id && isModelAvailable() && (<View className={`${Platform.isMobile ? 'w-full' : 'w-1/4'} bg-surface rounded-lg border-2 border-border p-4 mb-2`}>
        
        <View className="mb-4 flex-row items-center">
          <Ionicons name="accessibility" size={20} className="mr-2 !text-primary" />
          <Text className="text-text text-base font-medium">Personality Traits</Text>
        </View>
        
        <View className="space-y-6">
          {traits.map((trait, index) => (
            <View key={trait.name} className="space-y-2">
              <Text className="text-text font-medium">{trait.name}</Text>
              <View className="flex-row items-center justify-between bg-background rounded-lg p-2">
                <TouchableOpacity 
                  onPress={() => cycleTrait(index, 'left')}
                  className="w-8 h-8 items-center justify-center hover:bg-primary/10 rounded-full"
                >
                  <Ionicons name="chevron-back" size={20} className="!text-primary" />
                </TouchableOpacity>
                
                <Text className="text-text flex-1 text-center font-medium">
                  {trait.options[trait.current]}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => cycleTrait(index, 'right')}
                  className="w-8 h-8 items-center justify-center hover:bg-primary/10 rounded-full"
                >
                  <Ionicons name="chevron-forward" size={20} className="!text-primary" />
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
      </View>)}

      {/* Right side - Text Input */}
      <View className={`${Platform.isMobile ? 'w-full' : 'flex-grow ml-2 mb-2'}`}>
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