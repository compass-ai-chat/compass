import React, { useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, SectionList } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { threadsAtom, currentThreadAtom, threadActionsAtom, previewCodeAtom, defaultThreadAtom } from '@/src/hooks/atoms';
import { modalService } from '@/src/services/modalService';
import { Thread } from '@/src/types/core';
import { router } from 'expo-router';
import { useLocalization } from '@/src/hooks/useLocalization';
import Tooltip from '@/src/components/ui/Tooltip';
import { useChat } from '@/src/hooks/useChat';
import { SearchBar } from '../ui/SearchBar';
import { SectionHeader } from '../ui/SectionHeader';
import { Platform } from '@/src/utils/platform';


interface Section {
  title: string;
  data: Thread[];
}

interface ChatThreadsProps {
  className?: string;
  isSidebarVisible?: boolean;
  setIsSidebarVisible?: (isSidebarVisible: boolean) => void;
}

const ChatThreads: React.FC<ChatThreadsProps> = ({ className, isSidebarVisible, setIsSidebarVisible  }) => {
  const [threads] = useAtom(threadsAtom);
  const currentThread = useAtomValue(currentThreadAtom);
  const dispatchThread = useSetAtom(threadActionsAtom);
  const setPreviewCode = useSetAtom(previewCodeAtom);
  const scrollViewRef = useRef<SectionList>(null);
  const { t } = useLocalization();
  const { addNewThread } = useChat();
  const [search, setSearch] = useState('');
  const NewChatButton = () => (
    <TouchableOpacity 
        onPress={addNewThread} 
        className="mb-2 p-4 rounded-full flex flex-row justify-center bg-surface hover:border-primary hover:border-2 items-center"
      >
        <Ionicons 
          className="!text-primary" 
          name="add" 
          size={24}
        />
        <Text className="text-text mt-1 ml-2 font-bold">{t('chats.new_chat')} </Text>
      </TouchableOpacity>
      )

  const ListEmptyComponent = () => (
    <View className="flex-1 items-center justify-center">
      <Ionicons 
        name="chatbubbles-outline" 
        size={64} 
        className="!text-primary"
      />
      <Text className="text-text text-lg mb-2 text-center">{t('chats.no_threads')} </Text>
      <Text className="text-gray-500 text-sm mb-12 text-center px-4">
        {t('chats.start_new_chat')}  </Text>
        <NewChatButton />
    </View>
  );

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
    if (!Platform.isMobile && typeof window !== 'undefined' && window.innerWidth >= 768) {
      dispatchThread({ type: 'setCurrent', payload: thread });
    } else {
      dispatchThread({ type: 'setCurrent', payload: thread });
      router.push(`/thread/${thread.id}`);
    }
  };

  const clearAllThreads = async () => {
    const confirmed = await modalService.confirm({
      title: t('chats.clear_all'),
      message: t('chats.clear_all_confirm')
    });

    if (confirmed) {
      dispatchThread({ type: 'clearAll' });
    }
  };

  const filteredThreads = threads.filter(thread => thread.title.toLowerCase().includes(search.toLowerCase()));

  const sidebarToggle = () => (
    <TouchableOpacity onPress={()=>setIsSidebarVisible?.(isSidebarVisible??true)} className='mb-2 p-2'>
          <FontAwesome name="columns" size={20} className='text-gray-500!' />
        </TouchableOpacity>
  )


  return (
    <View className={`flex-col ${className} ${Platform.isMobile?'w-full flex-1':''} ${!Platform.isMobile && isSidebarVisible ? '' : 'w-0'}`}>
      <View className='flex-row justify-between items-center'>
        {isSidebarVisible && (<SectionHeader
          title={t('chats.chats')}
          icon="chatbubbles"
          className='p-2 mt-2'
        />)}
        {!Platform.isMobile && sidebarToggle()}
      </View>
      <SectionList
        ref={scrollViewRef}
        sections={groupThreadsByDate(filteredThreads)}
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
          <View className={`flex-row items-center mb-2 h-16 web:h-10 mx-4 rounded-lg shadow-md ${
            currentThread.id === thread.id 
              ? '' 
              : ''
          }`}>
            <TouchableOpacity 
              onPress={() => handleThreadSelect(thread)}
              onLongPress={() => editThreadTitle(thread)}
              className={`flex-row flex-1 items-center rounded-lg rounded-r-none hover:bg-background h-full ${
            currentThread.id === thread.id 
              ? 'bg-primary' 
              : 'bg-surface'
          }`}
            >
              <Text className={`font-bold p-2 text-center ${
            currentThread.id === thread.id 
              ? 'text-white' 
              : 'text-text'
          }`}>
                {thread.title}
              </Text>
              
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => deleteThread(thread.id)}
              className="h-full bg-background p-4 items-center justify-center rounded-r-lg hover:opacity-60"
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                className="text-red-500!"
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
        ListEmptyComponent={ListEmptyComponent}
        onContentSizeChange={() => {
          const lastSectionIndex = groupThreadsByDate(threads).length - 1;
          const lastSection = groupThreadsByDate(threads)[lastSectionIndex];
          if (filteredThreads.length > 0 && lastSection?.data.length > 0) {
            scrollViewRef.current?.scrollToLocation({ 
              sectionIndex: lastSectionIndex,
              itemIndex: 0,
              animated: true,
              viewOffset: 0
            });
          }
        }}
      />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder={t('chats.search_chats')}
        className="mb-2 mx-2"
      />
      
      <View className="flex-row justify-around mb-2 mx-2">
        <Tooltip text={t('chats.clear_all_tooltip')} tooltipClassName="-mt-8 w-20">
          <TouchableOpacity 
            onPress={clearAllThreads}
            className="p-2 rounded-full hover:bg-background flex-row py-4"
          >
            <Ionicons 
              name="trash-outline" 
              size={24}
              className="text-red-500!"
            />
            <Text className='text-text mt-1 ml-1'>{t('chats.clear_all')} </Text>
          </TouchableOpacity>
        </Tooltip>
        <Tooltip text={t('common.shortcut') + ': ' + 'Alt + N'}>
        {filteredThreads.length>0 && (<NewChatButton />)}
      
      </Tooltip>
      </View>
      
    </View>
  );
};

export { ChatThreads }; 