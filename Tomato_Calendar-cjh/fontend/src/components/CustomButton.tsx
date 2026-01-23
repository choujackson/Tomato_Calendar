import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const isOutline = variant === 'outline';

  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[variant],
    (disabled || loading) && styles.disabled,
    isDark && isOutline ? { borderColor: '#FFFFFF' } : null,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    isDark && isOutline ? { color: '#FFFFFF' } : null,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? '#FFFFFF'
              : isDark && isOutline
              ? '#FFFFFF'
              : theme.colors.primary
          }
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: theme.colors.primary,
  },
});

