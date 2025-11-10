import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | undefined;
  icon?: LucideIcon;
}

export function Input({
  label,
  error,
  icon: Icon,
  style,
  ...props
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color={error ? '#ff6b6b' : '#888'} />
          </View>
        )}
        <TextInput
          style={[styles.input, Icon && styles.inputWithIcon, style]}
          placeholderTextColor="#888"
          {...props}
        />
      </View>
      {error !== undefined && error !== '' && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  inputContainer: {
    flexDirection: 'row-reverse' as const,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  inputContainerError: {
    borderColor: Colors.danger,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light,
    paddingVertical: 16,
    paddingHorizontal: 16,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  inputWithIcon: {
    paddingRight: 0,
  },
  error: {
    fontSize: 13,
    color: '#ff6b6b',
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    fontWeight: '500' as const,
  },
});
