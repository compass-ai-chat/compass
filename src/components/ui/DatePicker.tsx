import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
//import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Modal} from '@/src/components/ui/Modal'

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  className?: string;
  placeholder?: string;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  className = '',
  placeholder = 'Select date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  
  // Reset tempDate when value changes externally
  useEffect(() => {
    setTempDate(value);
    setCurrentMonth(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [value]);

  const handleChange = (date: Date) => {
    setTempDate(date);
    if (Platform.OS !== 'web') {
      onChange(date);
      setIsOpen(false);
    }
  };

  const confirmSelection = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  const cancelSelection = () => {
    setTempDate(value);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minimumDate && date < new Date(minimumDate.setHours(0, 0, 0, 0))) {
      return true;
    }
    if (maximumDate && date > new Date(maximumDate.setHours(23, 59, 59, 999))) {
      return true;
    }
    return false;
  };

  const renderCalendar = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1).getDay();
    
    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create calendar days array
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return (
      <View className="bg-background border border-border rounded-lg p-4 w-[300px]">
        {/* Calendar header */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={goToPreviousMonth}
            className="p-2"
          >
            <Ionicons name="chevron-back" size={20} className="text-primary" />
          </TouchableOpacity>
          
          <Text className="text-text font-medium">
            {monthNames[month]} {year}
          </Text>
          
          <TouchableOpacity 
            onPress={goToNextMonth}
            className="p-2"
          >
            <Ionicons name="chevron-forward" size={20} className="text-primary" />
          </TouchableOpacity>
        </View>
        
        {/* Day names */}
        <View className="flex-row mb-2">
          {dayNames.map((day, index) => (
            <View key={index} className="flex-1 items-center">
              <Text className="text-secondary text-xs">{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View className="flex-row flex-wrap">
          {days.map((date, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => date && !isDateDisabled(date) && handleChange(date)}
              className={`w-[14.28%] aspect-square items-center justify-center ${
                date && tempDate.getDate() === date.getDate() && 
                tempDate.getMonth() === date.getMonth() && 
                tempDate.getFullYear() === date.getFullYear()
                  ? 'bg-primary rounded-full'
                  : 'hover:bg-gray-200 rounded-full'
              }`}
              disabled={!date || isDateDisabled(date)}
            >
              {date && (
                <Text 
                  className={`text-sm ${
                    tempDate.getDate() === date.getDate() && 
                    tempDate.getMonth() === date.getMonth() && 
                    tempDate.getFullYear() === date.getFullYear()
                      ? 'text-white font-bold'
                      : isDateDisabled(date)
                        ? 'opacity-50'
                        : 'text-text'
                  }`}
                >
                  {date.getDate()}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Action buttons */}
        <View className="flex-row justify-end mt-4">
          <TouchableOpacity 
            onPress={cancelSelection}
            className="px-4 py-2 mr-2"
          >
            <Text className="text-secondary">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={confirmSelection}
            className="px-4 py-2 bg-primary rounded-lg"
          >
            <Text className="text-white">Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Use native DateTimePicker on mobile platforms
  // if (Platform.OS !== 'web') {
  //   return (
  //     <View>
  //       <TouchableOpacity
  //         onPress={() => setIsOpen(true)}
  //         className={`bg-primary/10 px-3 py-2 rounded-lg flex-row items-center justify-between ${className}`}
  //       >
  //         <Text className="text-primary">{formatDate(value)}</Text>
  //         <Ionicons name="calendar-outline" size={16} className="text-primary ml-2" />
  //       </TouchableOpacity>
        
  //       {isOpen && (
  //         <DateTimePicker
  //           value={value}
  //           mode="date"
  //           display="default"
  //           onChange={(_, selectedDate) => {
  //             if (selectedDate) {
  //               handleChange(selectedDate);
  //             } else {
  //               setIsOpen(false);
  //             }
  //           }}
  //           minimumDate={minimumDate}
  //           maximumDate={maximumDate}
  //         />
  //       )}
  //     </View>
  //   );
  // }

  // Custom calendar for web
  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className={`bg-primary/10 px-3 py-2 rounded-lg flex-row items-center justify-between ${className}`}
      >
        <Text className="text-primary">{value ? formatDate(value) : placeholder}</Text>
        <Ionicons name="calendar-outline" size={16} className="text-primary ml-2" />
      </TouchableOpacity>
      
      <Modal
        isVisible={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {renderCalendar()}
      </Modal>
    </View>
  );
};

export default DatePicker; 