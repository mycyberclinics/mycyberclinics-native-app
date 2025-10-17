import React from 'react';
import { Pressable, Text, useColorScheme, PressableProps } from 'react-native';

type ButtonProps = {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  loading?: boolean;
} & Omit<PressableProps, 'onPress'>;

const ButtonComponent: React.FC<ButtonProps> = ({
  onPress,
  title = 'Sign in',
  disabled,
  style,
  textStyle,
  ...rest
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`
        w-full items-center justify-center rounded-full py-3
        ${isDark ? 'bg-button-buttonBG' : 'bg-button-buttonBGLight'}
        ${disabled ? 'opacity-50' : ''}
      `}
      style={style}
      {...rest}
    >
      <Text
        className={`
          text-base font-normal
          ${isDark ? 'text-black' : 'text-white'}
        `}
        style={textStyle}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export default ButtonComponent;
