import { View, Text, TouchableOpacity } from 'react-native';
import RNModal from 'react-native-modal';

import { ThemeProvider } from '@/src/components/ui/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from '@/src/utils/platform';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Optional maximum height for the modal content.
   * Defaults to 70% of screen height.
   */
  maxHeight?: string;
  className?: string;
  /**
   * Position of the modal on the screen
   * @default 'bottom'
   */
  position?: 'bottom' | 'center';
  showCloseButton?: boolean;
}

export function Modal({ 
  isVisible, 
  onClose, 
  children,
  maxHeight = '70%',
  className,
  position = Platform.isMobile ? 'bottom' : 'center',
  showCloseButton = false
}: ModalProps) {
  return (
    <RNModal
      isVisible={isVisible}
      onModalHide={onClose}
      style={{
        margin: 0,
        justifyContent: position === 'center' ? 'center' : 'flex-end'
      }}
    >
      <ThemeProvider>
        <View 
          className={`
            ${position === 'bottom' ? 'justify-end' : 'justify-center'} 
            flex-1
          `}
        >
          <View 
            className={`overflow-y-auto max-h-[90%]
              ${position === 'center' ? 'my-auto mx-auto' : 'w-full'}
              ${position === 'bottom' ? 'rounded-t-xl' : 'rounded-xl'} 
              bg-background 
              ${className}
            `}
          >
            {showCloseButton && !Platform.isMobile && (<TouchableOpacity 
            onPress={onClose}
            className="p-2 hover:opacity-50 rounded-full ml-auto"
          >
            <Ionicons name="close" size={24} className="!text-text" />
          </TouchableOpacity>)}
            {children}
          </View>
        </View>
      </ThemeProvider>
    </RNModal>
  );
} 