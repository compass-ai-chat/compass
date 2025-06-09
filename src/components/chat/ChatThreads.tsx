import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { threadsAtom, currentThreadAtom, threadActionsAtom, previewCodeAtom, defaultThreadAtom } from '@/src/hooks/atoms';
import { modalService } from '@/src/services/modalService';
import { Thread } from '@/src/types/core';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useLocalization } from '@/src/hooks/useLocalization';
import Tooltip from '@/src/components/ui/Tooltip';
import { useChat } from '@/src/hooks/useChat';


interface Section {
  title: string;
  data: Thread[];
}

const ChatThreads: React.FC = () => {
  const [threads] = useAtom(threadsAtom);
  const [currentThread] = useAtom(currentThreadAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const setPreviewCode = useSetAtom(previewCodeAtom);
  const scrollViewRef = useRef<SectionList>(null);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { t } = useLocalization();
  const { addNewThread } = useChat();


  const groupThreadsByDate = useCallback((threads: Thread[]): Section[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sections: Section[] = [
      { title: t('chats.before'), data: [] },
      { title: t('chats.yesterday'), data: [] },
      { title: t('chats.today'), data: [] },
    ];

    threads.forEach(thread => {
      const threadDate = new Date(parseInt(thread.id));
      threadDate.setHours(0, 0, 0, 0);

      if (threadDate.getTime() === today.getTime()) {
        sections[2].data.push(thread);
      } else if (threadDate.getTime() === yesterday.getTime()) {
        sections[1].data.push(thread);
      } else {
        sections[0].data.push(thread);
      }
    });

    // Remove empty sections
    return sections.filter(section => section.data.length > 0);
  }, []);

  const toggleDark = useCallback(() => {
    toggleColorScheme();
  }, [toggleColorScheme]);

  const editThreadTitle = async (thread: Thread) => {
    const newTitle = await modalService.prompt({
      title: "Edit Thread Title",
      message: "Enter new title for this thread",
      defaultValue: thread.title
    });

    if (newTitle) {
      dispatchThread({
        type: 'update',
        payload: { ...thread, title: newTitle }
      });
    }
  };

  const deleteThread = async (threadId: string) => {
    const confirmed = await modalService.confirm({
      title: "Delete Thread",
      message: "Are you sure you want to delete this thread?"
    });

    if (confirmed) {
      dispatchThread({ type: 'delete', payload: threadId });
    }
  };

  const handleThreadSelect = (thread: Thread) => {
    setPreviewCode(null);
    if (Platform.OS === 'web' && window.innerWidth >= 768) {
      dispatchThread({ type: 'setCurrent', payload: thread });
    } else {
      dispatchThread({ type: 'setCurrent', payload: thread });
      router.push(`/thread/${thread.id}`);
    }
  };

  return (
    <View className="flex-1 flex-col">
      <SectionList
        ref={scrollViewRef}
        sections={groupThreadsByDate(threads)}
        keyExtractor={(thread) => thread.id}
        renderSectionHeader={({ section: { title } }) => (
          <View className="z-10 flex-row items-center px-4">
            <Ionicons name="time-outline" size={16} color="gray" className="mr-2" />
            <Text className="text-sm font-semibold text-text py-2 flex-1">
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item: thread }) => (
          <View className={`flex-row items-center mb-2 mx-4 rounded-lg shadow-md ${
            currentThread.id === thread.id 
              ? 'web:border-primary web:border-2' 
              : ''
          }`}>
            <TouchableOpacity 
              onPress={() => handleThreadSelect(thread)}
              onLongPress={() => editThreadTitle(thread)}
              className={`flex-row flex-1 items-center rounded-lg rounded-r-none bg-surface hover:bg-background h-12`}
            >
              <Text className="font-bold text-text p-2 text-center">
                {thread.title}
              </Text>
              
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => deleteThread(thread.id)}
              className="h-12 p-4 items-center justify-center border-red-100 dark:border-red-900 border rounded-r-lg hover:opacity-60"
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                className="!text-red-500"
              />
            </TouchableOpacity>
            
          </View>
        )}
        onScrollToIndexFailed={(info) => {
          //console.warn('Failed to scroll to index', info);
          // Fallback to scrollToEnd if scrollToLocation fails
          setTimeout(() => {
          }, 100);
        }}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
        onContentSizeChange={() => {
          const lastSectionIndex = groupThreadsByDate(threads).length - 1;
          const lastSection = groupThreadsByDate(threads)[lastSectionIndex];
          if (lastSection?.data.length > 0) {
            scrollViewRef.current?.scrollToLocation({ 
              sectionIndex: lastSectionIndex,
              itemIndex: 0,
              animated: true,
              viewOffset: 0
            });
          }
        }}
      />
      
      <Tooltip text={t('common.shortcut') + ': ' + 'Alt + N'}>
        <TouchableOpacity 
          onPress={addNewThread} 
          className="mb-2 p-2 rounded-full flex flex-row justify-center bg-background hover:bg-surface hover:border-primary hover:border-2 items-center"
        >
          <Ionicons 
            className="!text-text" 
            name="add" 
            size={24}
          />
          <Text className="text-text mt-1 ml-2 font-bold">{t('chats.new_chat')}</Text>
        </TouchableOpacity>
      </Tooltip>
      
      <View className="flex-row justify-center space-x-4 mb-2">
        <Tooltip text={t('common.shortcut') + ': ' + 'Alt + O'}>
          <TouchableOpacity 
            onPress={toggleDark}
            className="p-2 rounded-full bg-surface hover:bg-background"
          >
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={24}
              className="!text-text"
            />
          </TouchableOpacity>
        </Tooltip>
      </View>
    </View>
  );
};

export { ChatThreads }; 