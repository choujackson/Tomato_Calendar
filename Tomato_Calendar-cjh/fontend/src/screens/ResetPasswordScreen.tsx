import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { authAPI } from '../services/api';
import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface ResetPasswordScreenProps {
  navigation: any;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const backgroundColor = isDark ? '#B0B0B0' : theme.colors.background;
  const titleColor = isDark ? '#FFFFFF' : theme.colors.primary;
  const subtitleColor = isDark ? '#FFFFFF' : theme.colors.textSecondary;
  const linkColor = isDark ? '#FFFFFF' : theme.colors.primary;
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{
    email?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const validateEmail = () => {
    if (!email) {
      setErrors({ ...errors, email: 'Please enter your email address' });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return false;
    }
    setErrors({ ...errors, email: undefined });
    return true;
  };

  const handleSendCode = async () => {
    if (!validateEmail()) {
      return;
    }

    setCodeLoading(true);
    try {
      await authAPI.sendResetCode(email);
      Alert.alert('Success', 'Verification code sent to your email. Please check your inbox.');
      
      // 开始倒计时
      setCountdown(60);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send code. Please try again later.';
      Alert.alert('Error', message);
    } finally {
      setCodeLoading(false);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!code) {
      newErrors.code = 'Please enter verification code';
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = 'Code must be 6 digits';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Please enter new password';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(email, code, newPassword);
      Alert.alert('Success', 'Password reset successful!', [
        { text: '确定', onPress: () => navigation.replace('Login') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Reset failed. Please check your info.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: titleColor }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Reset your password using the email code
          </Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <View style={styles.codeContainer}>
            <View style={styles.codeInput}>
              <CustomInput
                label="Code"
                placeholder="Enter 6-digit code"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setErrors({ ...errors, code: undefined });
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.code}
              />
            </View>
            <CustomButton
              title={countdown > 0 ? `${countdown} seconds` : 'Send Code'}
              onPress={handleSendCode}
              loading={codeLoading}
              disabled={countdown > 0}
              variant="outline"
              style={styles.codeButton}
            />
          </View>

          <CustomInput
            label="New Password"
            placeholder="Enter new password (at least 6 characters)"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setErrors({ ...errors, newPassword: undefined });
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.newPassword}
          />

          <CustomInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: undefined });
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirmPassword}
          />

          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
          />

          <View style={styles.footer}>
            <Text
              style={[styles.linkText, { color: linkColor }]}
              onPress={() => navigation.navigate('Login')}
            >
              Back to login
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  codeInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  codeButton: {
    width: 120,
    height: 50,
    marginBottom: 0,
  },
  footer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    marginVertical: theme.spacing.xs,
    textDecorationLine: 'underline',
  },
});

