import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  secureTextEntry,
  ...props
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const labelColor = isDark ? '#FFFFFF' : theme.colors.text;
  const errorColor = isDark ? '#FFFFFF' : theme.colors.error;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={theme.colors.textSecondary}
        {...props}
      />
      {error && <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
});

