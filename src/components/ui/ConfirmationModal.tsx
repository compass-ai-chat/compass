import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { modalService } from '@/src/services/modalService';
import { useLocalization } from '@/src/hooks/useLocalization';

interface ModalState {
  isVisible: boolean;
  title: string;
  message: string;
  defaultValue?: string;
  type: 'confirm' | 'prompt';
}

export const ConfirmationModal = () => {
  const { t } = useLocalization();

  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    title: '',
    message: '',
    type: 'confirm'
  });
  const [inputText, setInputText] = useState('');
  const confirmButtonRef = useRef<View>(null);
  
  useEffect(() => {
    modalService.setUpdateCallback(setModalState);
    return () => modalService.setUpdateCallback(() => {});
  }, []);

  useEffect(() => {
    if (modalState.isVisible && Platform.OS === 'web') {
      if (modalState.type === 'prompt') {
        setInputText(modalState.defaultValue || '');
      } else {
        // For web platform, use DOM focus
        const element = confirmButtonRef.current as unknown as HTMLElement;
        setTimeout(() => element?.focus(), 0);
      }
    }
  }, [modalState.isVisible]);

  const Content = () => (
    <View className="bg-background rounded-lg p-6 m-4 max-w-sm w-full">
      <Text className="text-xl font-bold mb-2 text-text">
        {modalState.title}
      </Text>
      <Text className="text-text mb-4">
        {modalState.message}
      </Text>

      {modalState.type === 'prompt' && (
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-4 text-black dark:text-white"
          autoFocus={true}
          blurOnSubmit={false}
          multiline={false}
          returnKeyType="done"
          onSubmitEditing={() => modalService.handleResponse(inputText)}
        />
      )}

      <View className="flex-row justify-around">
        <TouchableOpacity
          onPress={() => modalService.handleResponse(null)}
          className="px-4 py-2 rounded-lg bg-surface text-text w-1/2 mr-2"
        >
          <Text className="text-text text-center">{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          ref={confirmButtonRef}
          onPress={() => modalService.handleResponse(
            modalState.type === 'prompt' ? inputText : true
          )}
          className="px-4 py-2 rounded-lg bg-primary w-1/2"
        >
          <Text className="text-white text-center">
            {modalState.type === 'prompt' ? t('common.save') : t('common.confirm')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    if (!modalState.isVisible) return null;
    return (
      <View className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Content />
      </View>
    );
  }

  return (
    <Modal
      visible={modalState.isVisible}
      transparent={true}
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center">
        <Content />
      </View>
    </Modal>
  );
}; 