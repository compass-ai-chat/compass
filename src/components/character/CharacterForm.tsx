import { View, ScrollView, Text } from "react-native";
import { Character, Document, Model, AllowedModel, ModelRouting } from "@/src/types/core";
import { InstructionEditor } from "./InstructionEditor";
import { ModelPreferenceSelector } from "./ModelPreferenceSelector";
import { DocumentSelector } from "./DocumentSelector";
import { ToolSelector } from "./ToolSelector";
import { Switch } from "@/src/components/ui/Switch";
import { MySlider } from "@/src/components/ui/Slider";
import { useLocalization } from "@/src/hooks/useLocalization";
import { Tool } from "@/src/types/tools";

interface ModelRoutingSelectorProps {
  availableModels: Model[];
  selectedRouting: ModelRouting[];
  onRoutingChange: (routing: ModelRouting[]) => void;
}

function ModelRoutingSelector({ availableModels, selectedRouting, onRoutingChange }: ModelRoutingSelectorProps) {
  const { t } = useLocalization();

  const handleSliderChange = (value: number) => {
    if (selectedRouting.length !== 2) return;
    
    const newRouting = [...selectedRouting];
    newRouting[0].percentage = value;
    newRouting[1].percentage = 100 - value;
    onRoutingChange(newRouting);
  };

  const handleModelSelect = (model: AllowedModel, index: number) => {
    const newRouting = [...(selectedRouting.length === 2 ? selectedRouting : [
      { modelId: '', providerId: '', percentage: 50 },
      { modelId: '', providerId: '', percentage: 50 }
    ])];
    
    newRouting[index] = {
      modelId: model.id,
      providerId: model.providerId,
      percentage: newRouting[index]?.percentage || 50
    };
    
    onRoutingChange(newRouting);
  };

  return (
    <View className="space-y-4">
      <Text className="text-base font-medium mb-2 text-text">
        {t('characters.edit_character.model_routing')}
      </Text>
      
      <View className="space-y-4">
        {[0, 1].map((index) => (
          <View key={index} className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-text mb-1">Model {index + 1}</Text>
              <ModelPreferenceSelector
                availableModels={availableModels}
                selectedPreferences={selectedRouting[index] ? [{
                  id: selectedRouting[index].modelId,
                  providerId: selectedRouting[index].providerId,
                  priority: index
                }] : []}
                onAddPreference={(model) => handleModelSelect(model, index)}
                onRemovePreference={() => {}}
                className="mb-0"
              />
            </View>
            <Text className="text-sm text-text ml-2 w-12 text-right">
              {selectedRouting[index]?.percentage || 50}%
            </Text>
          </View>
        ))}
        
        {selectedRouting.length === 2 && selectedRouting.every(r => r.modelId && r.providerId) && (
          <MySlider
            value={selectedRouting[0].percentage}
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
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

  const handleAllowedModelAdd = (model: AllowedModel) => {
    const currentAllowedModels = character?.allowedModels || [];
    const existingIndex = currentAllowedModels.findIndex(
      (p) => p.id === model.id,
    );

    if (existingIndex >= 0) {
      const updatedAllowedModelIds = [...currentAllowedModels];
      updatedAllowedModelIds[existingIndex] = model;
      onCharacterChange({ ...character!, allowedModels: updatedAllowedModelIds });
    } else {
      onCharacterChange({
        ...character!,
        allowedModels: [...currentAllowedModels, model],
      });
    }
  };

  const handleAllowedModelRemove = (model: AllowedModel) => {
    if (!character?.allowedModels) return;

    onCharacterChange({
      ...character,
      allowedModels: character.allowedModels.filter((p) => p.id !== model.id),
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

  const handleRoutingChange = (routing: ModelRouting[]) => {
    onCharacterChange({
      ...character!,
      modelRouting: routing
    });
  };

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

        <View>
          <ModelPreferenceSelector
            availableModels={availableModels}
            selectedPreferences={character?.allowedModels || []}
            onAddPreference={handleAllowedModelAdd}
            onRemovePreference={handleAllowedModelRemove}
          />
          
          <ModelRoutingSelector
            availableModels={availableModels}
            selectedRouting={character?.modelRouting || []}
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
        </View>

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