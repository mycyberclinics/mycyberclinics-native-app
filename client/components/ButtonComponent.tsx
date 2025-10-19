// components/ui/ButtonComponent.tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

type ButtonProps = {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  textStyle?: any;
} & Omit<PressableProps, 'onPress'>;

const ButtonComponent: React.FC<ButtonProps> = ({
  onPress,
  title = 'Sign in',
  disabled,
  loading,
  style,
  textStyle,
  ...rest
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        h-[48px] w-full items-center justify-center rounded-full border border-button-signInButtonBorderLight
        bg-button-buttonBGLight py-3
        dark:border-button-signInButtonBorderDark dark:bg-button-buttonBG
        ${disabled ? 'opacity-50' : ''}
      `}
      style={style}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          className="text-center text-[14px] font-[500] text-text-secondaryTextDark dark:text-text-textInverse"
          style={textStyle}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default ButtonComponent;
