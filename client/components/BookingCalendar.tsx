import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  Animated,
  useColorScheme,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM'));

const BookingCalendar = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [animDirection, setAnimDirection] = useState<'left' | 'right' | null>(null);

  const animValue = useState(new Animated.Value(0))[0];

  const startOfWeek = selectedDate.startOf('week').add(1, 'day');
  const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  const animateSlide = (direction: 'left' | 'right', callback: () => void) => {
    setAnimDirection(direction);
    Animated.timing(animValue, {
      toValue: direction === 'left' ? -1 : 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      callback();
      animValue.setValue(direction === 'left' ? 1 : -1);
      Animated.timing(animValue, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleMonthSelect = (monthName: string) => {
    const newDate = selectedDate.month(
      dayjs()
        .month(monthName as any)
        .month(),
    );
    setSelectedDate(newDate);
    setShowMonthPicker(false);
  };

  const goToPreviousMonth = () =>
    animateSlide('left', () => setSelectedDate(selectedDate.subtract(1, 'month')));
  const goToNextMonth = () =>
    animateSlide('right', () => setSelectedDate(selectedDate.add(1, 'month')));

  return (
    <View className="mt-4">
      <View className="mb-3 flex-row items-center justify-center px-4">
        <Pressable onPress={goToPreviousMonth} className="mx-1 rounded-full p-2">
          <Feather name="chevron-left" size={20} color={isDark ? '#E5E7EB' : '#111827'} />
        </Pressable>

        <Pressable
          onPress={() => setShowMonthPicker(true)}
          className={`flex-row items-center rounded-full px-4 py-2 ${
            isDark ? 'bg-green-800' : 'bg-green-600'
          }`}
        >
          <Text className={`mr-2 text-base font-medium ${isDark ? 'text-gray-100' : 'text-white'}`}>
            {selectedDate.format('dddd, MMMM YYYY')}
          </Text>
          <Feather name="chevron-down" size={18} color={isDark ? '#E5E7EB' : '#FFF'} />
        </Pressable>

        <Pressable onPress={goToNextMonth} className="mx-1 rounded-full p-2">
          <Feather name="chevron-right" size={20} color={isDark ? '#E5E7EB' : '#111827'} />
        </Pressable>
      </View>

      <Animated.View
        style={{
          transform: [
            {
              translateX: animValue.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-80, 0, 80],
              }),
            },
          ],
          opacity: animValue.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0, 1, 0],
          }),
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {days.map((day, idx) => {
            const isSelected = day.isSame(selectedDate, 'day');
            return (
              <Pressable
                key={idx}
                onPress={() => setSelectedDate(day)}
                className={`mx-1 w-16 items-center justify-center rounded-full border py-2 ${
                  isSelected
                    ? isDark
                      ? 'border-green-600 bg-green-600'
                      : 'border-green-500 bg-green-500'
                    : isDark
                      ? 'border-gray-700 bg-gray-800'
                      : 'border-gray-300 bg-gray-100'
                }`}
              >
                <Text
                  className={`mb-1 text-sm font-medium ${
                    isSelected ? 'text-white' : isDark ? 'text-gray-100' : 'text-gray-800'
                  }`}
                >
                  {day.format('ddd')}
                </Text>
                <Text
                  className={`text-base font-semibold ${
                    isSelected ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {day.format('D')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Modal
        transparent
        visible={showMonthPicker}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className={`w-11/12 rounded-2xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <Text
              className={`mb-3 text-center text-lg font-semibold ${
                isDark ? 'text-gray-100' : 'text-gray-800'
              }`}
            >
              Select Month
            </Text>

            <FlatList
              data={months}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleMonthSelect(item)}
                  className={`m-2 flex-1 items-center rounded-lg py-3 ${
                    selectedDate.format('MMMM') === item
                      ? 'bg-green-500'
                      : isDark
                        ? 'bg-gray-800'
                        : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedDate.format('MMMM') === item
                        ? 'text-white'
                        : isDark
                          ? 'text-gray-200'
                          : 'text-gray-700'
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />

            <Pressable
              onPress={() => setShowMonthPicker(false)}
              className="mt-4 rounded-lg bg-green-600 py-2"
            >
              <Text className="text-center font-medium text-white">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingCalendar;
