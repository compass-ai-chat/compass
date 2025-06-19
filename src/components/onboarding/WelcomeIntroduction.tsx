import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Modal } from '@/src/components/ui/Modal';
import { Ionicons } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { hasSeenOnboardingAtom } from '@/src/hooks/atoms';
import { useProviders } from "@/src/hooks/useProviders";
import { PREDEFINED_PROVIDERS } from "@/src/constants/providers";
import { useTranslation } from 'react-i18next';
import * as Crypto from 'expo-crypto';

export function WelcomeIntroduction() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [, setHasSeenOnboarding] = useAtom(hasSeenOnboardingAtom);
  const {
    addUpdateProvider,
  } = useProviders();

  const ONBOARDING_PAGES = [
    {
      title: t('onboarding.pages.welcome.title'),
      description: t('onboarding.pages.welcome.description'),
      icon: 'compass'
    },
    {
      title: t('onboarding.pages.add_provider.title'),
      description: t('onboarding.pages.add_provider.description'),
      icon: 'server'
    },
    {
      title: t('onboarding.pages.choose_character.title'),
      description: t('onboarding.pages.choose_character.description'),
      icon: 'people'
    },
    {
      title: t('onboarding.pages.start_chatting.title'),
      description: t('onboarding.pages.start_chatting.description'),
      icon: 'chatbubbles'
    }
  ];

  const handleClose = () => {
    setIsVisible(false);
    setHasSeenOnboarding(true);
    // get the polaris provider
    addUpdateProvider({
      ...PREDEFINED_PROVIDERS.compass,
      id: Crypto.randomUUID(),
      apiKey: "user_api_key_here"
    });
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_PAGES.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      className={Platform.OS === 'web' ? "w-[70%] mx-auto" : "m-4"}
      position={Platform.OS === 'web' ? 'center' : 'bottom'}
    >
      <View className={`p-6 ${Platform.OS === 'web' ? 'max-h-[70vh]' : ''}`}>
        <TouchableOpacity 
          onPress={handleClose}
          className="absolute right-4 top-4"
        >
          <Text className="!text-primary">{t('onboarding.skip')}</Text>
        </TouchableOpacity>

        <View className="items-center mb-8">
          <Ionicons 
            name={ONBOARDING_PAGES[currentPage].icon as any} 
            size={64} 
            className={`!text-primary mb-4 ${
              Platform.OS === 'web' && currentPage === 0
                ? 'hover:rotate-180 transition-transform duration-[2000ms] ease-in-out animate-spin-once'
                : Platform.OS === 'web' && currentPage === ONBOARDING_PAGES.length - 1
                ? 'animate-[hover_2000ms_ease-in-out_1_forwards] motion-reduce:animate-none'
                : ''
            }`}
          />
          <Text className="text-2xl font-bold text-text mb-2">
            {ONBOARDING_PAGES[currentPage].title}
          </Text>
          <Text className="text-center text-secondary">
            {ONBOARDING_PAGES[currentPage].description}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row gap-2">
            {ONBOARDING_PAGES.map((_, index) => (
              <View 
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentPage ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
          
          <View className="flex-row gap-2">
            {currentPage > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                className="border border-primary px-6 py-3 rounded-lg flex-row items-center"
              >
                <Ionicons name="arrow-back" size={20} className="!text-primary" />
                <Text className="text-primary font-medium ml-2">
                  {t('onboarding.back')}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleNext}
              className="bg-primary px-6 py-3 rounded-lg flex-row items-center outline-none"
            >
              <Text className="text-white font-medium mr-2">
                {currentPage === ONBOARDING_PAGES.length - 1 ? t('onboarding.get_started') : t('onboarding.next')}
              </Text>
              <Ionicons name="arrow-forward" size={20} className='!text-white' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 