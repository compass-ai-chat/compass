import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { z } from 'zod';
import { useTools } from '../hooks/useTools';

export const ToolEditor: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const { createTool } = useTools();

  const handleCreate = async () => {
    try {
      await createTool({
        id: name,
        name: name,
        type: 'dynamic',
        description,
        enabled: true,
        code,
        paramsSchema: z.object({}), // This should be customizable
        configSchema: z.object({}), // This should be customizable
        configValues: {}, // Initial config values
      });
    } catch (error) {
      console.error('Failed to create tool:', error);
    }
  };

  return (
    <View className="p-4">
      <TextInput
        className="mb-4 p-2 border rounded"
        placeholder="Tool Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="mb-4 p-2 border rounded"
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        className="mb-4 p-2 border rounded h-40"
        multiline
        placeholder="Tool Code"
        value={code}
        onChangeText={setCode}
      />
      <Button title="Create Tool" onPress={handleCreate} />
    </View>
  );
}; 