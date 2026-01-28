import React, { useState, ReactNode } from 'react';
import { View, Text, Platform } from 'react-native';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  webOnly?: boolean;
  className?: string;
  tooltipClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  text, 
  children, 
  position = 'top',
  webOnly = true,
  className,
  tooltipClassName
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Position styles based on the position prop
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'absolute -top-8 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'absolute top-full mt-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute top-1/2 right-full mr-2 transform -translate-y-1/2';
      case 'right':
        return 'absolute top-1/2 left-full ml-2 transform -translate-y-1/2';
      default:
        return 'absolute -top-8 left-1/2 transform -translate-x-1/2';
    }
  };

  // Only show tooltip on web if webOnly is true
  const shouldShowTooltip = showTooltip && (!webOnly || Platform.OS === 'web');

  return (
    <View className={`relative ${className}`}>
      <View
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </View>
      
      {shouldShowTooltip && (
        <View 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${getPositionStyles()} bg-surface bg-background px-2 py-1 rounded shadow-md z-50 ${tooltipClassName}`}>
          <Text className="text-text text-xs text-center">{text}</Text>
        </View>
      )}
    </View>
  );
};

export default Tooltip; 