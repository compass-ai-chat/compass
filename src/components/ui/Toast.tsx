import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import { toastService } from '@/src/services/toastService';
import { ToastMessage } from '@/src/types/toast';
import { Ionicons } from '@expo/vector-icons';
import RNModal from 'react-native-modal';

const getToastColor = (type: ToastMessage['type']) => {
  switch (type) {
    case 'warning':
      return 'bg-red-500';
    case 'info':
      return 'bg-blue-500';
    case 'success':
      return 'bg-green-500';
    case 'danger':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getToastIcon = (type: ToastMessage['type']) => {
  switch (type) {
    case 'warning':
      return 'warning';
    case 'info':
      return 'information-circle';
    case 'success':
      return 'checkmark-circle';
    case 'danger':
      return 'alert-circle';
    default:
      return 'information-circle';
  }
};

export const Toast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastService.setUpdateCallback(setToasts);
    return () => toastService.setUpdateCallback(() => {});
  }, []);

  const ToastItem = ({ toast }: { toast: ToastMessage }) => {
    const { position = 'top', animationDuration = 300, slideOffset = 20 } = toast.options;

    const animatedStyle = useAnimatedStyle(() => {
      const translateY = position === 'top' ? -slideOffset : slideOffset;

      return {
        opacity: withTiming(1, { duration: animationDuration }),
        transform: [
          {
            translateY: withSequence(
              withSpring(translateY),
              withSpring(0)
            ),
          },
        ],
      };
    });

    const handleDismiss = () => {
      toastService.dismiss(toast.id);
    };

    return (
      <Animated.View style={[animatedStyle]} className="px-4 py-2 mb-2">
        <View
          className={`rounded-lg shadow-lg ${getToastColor(toast.type)} p-4 flex-row items-center mt-4 mx-8`}
        >
          <Ionicons name={getToastIcon(toast.type)} size={24} color="white" />
          <View className="flex-1 ml-3">
            <Text className="text-white font-bold">{toast.title}</Text>
            {toast.description && (
              <Text className="text-white mt-1">{toast.description}</Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (toasts.length === 0) return null;

  const topToasts = toasts.filter(t => t.options.position !== 'bottom');
  const bottomToasts = toasts.filter(t => t.options.position === 'bottom');

  return (
    <RNModal
      isVisible={toasts.length > 0}
      animationIn="fadeIn"
      animationOut="fadeOut"
      hasBackdrop={true}
      backdropOpacity={0.0}
      coverScreen={true}
      useNativeDriver={true}
      statusBarTranslucent={true}
      onBackdropPress={() => toastService.dismissAll()}
      style={{ 
        margin: 0,
        zIndex: 9999,
      }}
    >
      <View 
        className="absolute inset-0 pointer-events-none" 
        style={[
          { elevation: 9999 },
          Platform.OS === 'web' && {
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
          }
        ]}
      >
        <View 
          className="p-4 pointer-events-auto"
          style={Platform.OS === 'web' ? {
            width: '30%',
            minWidth: 300,
            maxWidth: 600,
            marginBottom: 60,
            marginRight: 20,
          } : undefined}
        >
          {topToasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
          {bottomToasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </View>
      </View>
    </RNModal>
  );
}; 