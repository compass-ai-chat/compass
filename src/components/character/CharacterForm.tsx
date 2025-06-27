import React, { useEffect, useState } from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import { Character, Document, Model, AllowedModel, ModelRouting } from "@/src/types/core";
import { InstructionEditor } from "./InstructionEditor";
import { ModelPreferenceSelector } from "./ModelPreferenceSelector";
import { DocumentSelector } from "./DocumentSelector";
import { ToolSelector } from "./ToolSelector";
import { Switch } from "@/src/components/ui/Switch";
import { MySlider } from "@/src/components/ui/Slider";
import { useLocalization } from "@/src/hooks/useLocalization";
import { Tool } from "@/src/types/tools";
import { Ionicons } from "@expo/vector-icons";

interface ModelRoutingSelectorProps {
  availableModels: Model[];
  selectedRouting: ModelRouting[];
  onRoutingChange: (routing: ModelRouting[]) => void;
}

function ModelRoutingSelector({ availableModels, selectedRouting, onRoutingChange }: ModelRoutingSelectorProps) {
  const { t } = useLocalization();
  const [showSecondModel, setShowSecondModel] = useState(selectedRouting.length === 2);

  useEffect(()=>{
    setShowSecondModel(selectedRouting.length === 2);
  },[selectedRouting]);

  const handleSliderChange = (value: number) => {
    if (selectedRouting.length !== 2) return;
    
    const newRouting = [...selectedRouting];
    newRouting[1].percentage = value;
    newRouting[0].percentage = 100 - value;
    onRoutingChange(newRouting);
  };

  const handleModelSelect = (model: AllowedModel, index: number) => {
    let newRouting: ModelRouting[];
    
    if (index === 0) {
      // For the first model, keep or initialize routing
      newRouting = [{
        modelId: model.id,
        providerId: model.providerId,
        percentage: selectedRouting[0]?.percentage || 100
      }];
      
      // If we have a second model, preserve it
      if (selectedRouting[1]) {
        newRouting.push({
          ...selectedRouting[1],
          percentage: 100 - newRouting[0].percentage
        });
      }
    } else {
      // For the second model, ensure we have both models
      newRouting = [
        selectedRouting[0] || { modelId: '', providerId: '', percentage: 50 },
        {
          modelId: model.id,
          providerId: model.providerId,
          percentage: 50
        }
      ];
      newRouting[0].percentage = 50;
    }
    
    onRoutingChange(newRouting);
  };

  const handleRemoveSecondModel = () => {
    setShowSecondModel(false);
    onRoutingChange([{
      ...selectedRouting[0],
      percentage: 100
    }]);
  };

  const handleAddSecondModel = () => {
    setShowSecondModel(true);
    if (selectedRouting.length === 1) {
      onRoutingChange([
        { ...selectedRouting[0], percentage: 50 },
        { modelId: '', providerId: '', percentage: 50 }
      ]);
    }
  };

  return (
    <View className="space-y-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-medium text-text">
          {t('characters.edit_character.model_routing')}
        </Text>
        {!showSecondModel && (
          <TouchableOpacity 
            onPress={handleAddSecondModel}
            className="flex-row items-center bg-surface px-3 py-1.5 rounded-full border border-border"
          >
            <Ionicons name="add" size={16} className="!text-primary mr-1" />
            <Text className="text-text text-sm">Add Fallback Model</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View className="space-y-4">
        <View className="flex-row space-x-4">
          {/* First Model */}
          <View className="flex-1">
            <ModelPreferenceSelector
              availableModels={availableModels}
              selectedPreferences={selectedRouting[0] ? [{
                id: selectedRouting[0].modelId,
                providerId: selectedRouting[0].providerId,
                priority: 0
              }] : []}
              onAddPreference={(model) => handleModelSelect(model, 0)}
              onRemovePreference={() => {}}
              compact
            />
            {showSecondModel && (
              <Text className="text-sm text-center mt-2 text-text font-medium">
                {selectedRouting[0]?.percentage || 0}%
              </Text>
            )}
          </View>

          {/* Second Model (Optional) */}
          {showSecondModel && (
            <>
              <View className="flex-1">
                <ModelPreferenceSelector
                  availableModels={availableModels}
                  selectedPreferences={selectedRouting[1] ? [{
                    id: selectedRouting[1].modelId,
                    providerId: selectedRouting[1].providerId,
                    priority: 1
                  }] : []}
                  onAddPreference={(model) => handleModelSelect(model, 1)}
                  onRemovePreference={handleRemoveSecondModel}
                  compact
                />
                <Text className="text-sm text-center mt-2 text-text font-medium">
                  {selectedRouting[1]?.percentage || 0}%
                </Text>
              </View>
            </>
          )}
        </View>
        
        {/* Slider (only shown when both models are selected) */}
        {showSecondModel && selectedRouting.length === 2 && 
         selectedRouting.every(r => r.modelId && r.providerId) && (
          <View className="bg-surface p-4 rounded-lg border border-border">
            <MySlider
              value={selectedRouting[1].percentage}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </View>
        )}
      </View>
    </View>
  );
}

interface CharacterFormProps {
  character: Character | null;
  availableModels: Model[];
  availableDocuments: Document[];
  availableTools: Tool[];
  showCharacterExposeAsModel?: boolean;
  onCharacterChange: (character: Character) => void;
}

export function CharacterForm({
  character,
  availableModels,
  availableDocuments,
  availableTools,
  showCharacterExposeAsModel = false,
  onCharacterChange,
}: CharacterFormProps) {
  const { t } = useLocalization();

  const handleDocumentToggle = (docId: string) => {
    if (character?.documentIds?.includes(docId)) {
      onCharacterChange({
        ...character,
        documentIds: character.documentIds.filter((id) => id !== docId),
      });
    } else {
      onCharacterChange({
        ...character!,
        documentIds: [...(character?.documentIds || []), docId],
      });
    }
  };

  const handleRoutingChange = (routing: ModelRouting[]) => {

    onCharacterChange({
      ...character!,
      modelRouting: routing
    });
  };

  const handleToolToggle = (toolId: string) => {
    if (character?.toolIds?.includes(toolId)) {
      onCharacterChange({
        ...character,
        toolIds: character.toolIds.filter((id) => id !== toolId),
      });
    } else {
      onCharacterChange({
        ...character!,
        toolIds: [...(character?.toolIds || []), toolId],
      });
    }
  };

  const initialRouting = character?.modelRouting || [];

  return (
    <ScrollView
      className="flex-1 p-4"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="space-y-6 flex-1">
        <View className="flex-1">
          <View className="flex-row flex-1 mb-2">
            <InstructionEditor 
              character={character as Character}
              content={character?.content || ""}
              onChangeText={(text) => onCharacterChange({ ...character!, content: text })}
            />
          </View>
        </View>

        <ModelRoutingSelector
          availableModels={availableModels}
          selectedRouting={initialRouting}
          onRoutingChange={handleRoutingChange}
        />

        {showCharacterExposeAsModel && (
          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-base font-medium mb-2 text-text">
              {t('characters.edit_character.expose_as_model')}
            </Text>
            <Switch
              className="mx-auto"
              value={character?.exposeAsModel ?? false}
              onValueChange={(value) =>
                onCharacterChange({ ...character!, exposeAsModel: value })
              }
            />
          </View>
        )}

        <DocumentSelector
          documents={availableDocuments}
          selectedDocIds={character?.documentIds || []}
          onSelectDoc={handleDocumentToggle}
          onRemoveDoc={handleDocumentToggle}
          className="mb-2"
        />

        <ToolSelector
          tools={availableTools}
          selectedToolIds={character?.toolIds || []}
          onSelectTool={handleToolToggle}
          onRemoveTool={handleToolToggle}
        />
      </View>
    </ScrollView>
  );
} 