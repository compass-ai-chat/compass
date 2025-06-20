import { View, Text, TouchableOpacity, Image, Pressable, Platform } from "react-native"
import React, { useState } from 'react';
import Modal from 'react-native-modal';
import { ScrollView } from "react-native-gesture-handler";
import { TextInput } from "react-native-gesture-handler";
import { useAtom } from 'jotai';
import { keyboardEventAtom } from '../../hooks/useKeyboardShortcuts';
import { Ionicons } from "@expo/vector-icons";
import LogoRenderer from "./LogoRenderer";

export interface DropdownElement {
    title: string;
    id: string;
    image?: string;
    icon?: string;
    logo?: string;
    metadata?: any;
}

interface DropdownProps {
    children: DropdownElement[];
    selected: DropdownElement | undefined;
    onSelect: (child: DropdownElement) => void;
    showSearch?: boolean;
    className?: string;
    position?: "left" | "right";
    iconOpen?: string;
    iconClosed?: string;
    iconSize?: number;
    dropdownOptionClassName?: string;
    openUpwards?: boolean;
}

export const Dropdown = ({ 
    children, 
    selected, 
    onSelect, 
    showSearch = false, 
    className, 
    position = "left",
    iconOpen = "chevron-back",
    iconClosed = "chevron-down",
    iconSize = 24,
    dropdownOptionClassName,
    openUpwards = false,
}: DropdownProps) => {

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [keyboardEvent] = useAtom(keyboardEventAtom);
    
    // Add ref for the TextInput
    const searchInputRef = React.useRef<TextInput>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);
    
    // Constants for item height calculation
    const ITEM_HEIGHT = 72; // Height of each item (48px image + padding)
    const SEARCH_HEIGHT = 61; // Height of search box (including padding and border)

    // Focus input when dropdown opens
    React.useEffect(() => {
        if (isOpen && showSearch) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, showSearch]);


    const filteredChildren = children.filter(child =>
        child.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset highlighted index when search query changes or dropdown opens
    React.useEffect(() => {
        setHighlightedIndex(filteredChildren.length > 0 ? 0 : -1);
    }, [searchQuery, isOpen]);

    // Handle keyboard events from the global listener
    React.useEffect(() => {
        if (!isOpen || !keyboardEvent) return;
        console.log("keyboardEvent", keyboardEvent)
        switch (keyboardEvent.key) {
            case 'ArrowDown':
            case 'ArrowUp':

                searchInputRef.current?.blur();
                
                if (keyboardEvent.key === 'ArrowDown') {
                    setHighlightedIndex(prev => 
                        prev < filteredChildren.length - 1 ? prev + 1 : prev
                    );
                } else {
                    setHighlightedIndex(prev => 
                        prev > 0 ? prev - 1 : prev
                    );
                }
                break;
            case 'Enter':
                if (highlightedIndex >= 0 && highlightedIndex < filteredChildren.length) {
                    onSelect(filteredChildren[highlightedIndex]);
                    setIsOpen(false);
                }
                break;
        }
    }, [keyboardEvent, isOpen]);

    const scrollView = () =>{
      return (
        <ScrollView ref={scrollViewRef}>
          
          {filteredChildren.map((child, index) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => {
                onSelect(child);
                setIsOpen(false);
              }}
              className={`flex-row items-center p-3 ${
                (index === highlightedIndex && index > 0) ? 'bg-surface' : ''
              } hover:opacity-70 ${dropdownOptionClassName}`}
            >
              {child.logo && (
                <LogoRenderer logo={child.logo} size={24} className="mr-3 !text-primary " />
              )}

              <View className="flex-1">
                <Text className="font-medium text-text truncate" numberOfLines={1}>
                  {child.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {filteredChildren.length === 0 && (
            <Text className="text-text p-3">No results found</Text>
          )}
        </ScrollView>
      )
    }
    
  return ( 
  
  <View className="">
    <TouchableOpacity 
        onMouseEnter={() => {
          setIsOpen(true)
        }}
        onMouseLeave={() => {
          setIsOpen(false)
        }}
        onPress={() => {
          setIsOpen(!isOpen)
        }}
        className={`flex-row items-center px-2 h-12 py-2 rounded-lg bg-background hover:opacity-70 border border-border ${className}`}
      >
        {selected?.logo && (
          <LogoRenderer logo={selected.logo} size={24} className="mr-3 !text-primary" />
        )}
        <Text className="font-medium text-text truncate" numberOfLines={1}>
          {selected?.title}
        </Text>
        <View className="ml-auto">
          <Ionicons name={isOpen ? iconOpen : iconClosed as any} size={iconSize} className="!text-text" />
        </View>
      </TouchableOpacity>
      {isOpen && <View 
      onMouseEnter={() => {
        setIsOpen(true)
      }}
      onMouseLeave={() => {
        setIsOpen(false)
      }}
      className={`z-200 ${position === "left" ? "" : "right-0"} absolute ${openUpwards ? "bottom-12" : "mt-12"} rounded-lg overflow-hidden max-h-64 bg-background border border-border shadow-lg`}>
      {showSearch && (
            <View className="p-2 border-b border-border flex-row items-center bg-surface m-2 rounded-md">
              <Ionicons name="search-outline" size={20} className="text-text mr-1" />
              <TextInput
                ref={searchInputRef}
                className="px-3 py-2 bg-surface rounded-md text-black dark:text-white flex-1 outline-none"
                placeholder="Search..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onKeyPress={(e) => {
                  switch (e.nativeEvent.key) {
                    case 'ArrowDown':
                    case 'ArrowUp':
                        // Blur the input when using arrow keys
                        searchInputRef.current?.blur();
                        console.log("ArrowDown or ArrowUp")
                        break;
                  }
                }}
              />
            </View>
          )}
        {scrollView()}
      </View>}
      
    </View>
  )
  
}