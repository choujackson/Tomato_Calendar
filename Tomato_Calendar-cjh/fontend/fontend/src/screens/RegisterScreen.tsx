import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { authAPI } from '../services/api';
import { theme } from '../styles/theme';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    code?: string;
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
      setErrors({ ...errors, email: 'Please enter your email' });
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
      await authAPI.sendRegisterCode(email);
      Alert.alert('Success', 'Verification code has been sent to your email');
      
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
      const message = error.response?.data?.message || 'Failed to send verification code, please try again later';
      Alert.alert('Error', message);
    } finally {
      setCodeLoading(false);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!code) {
      newErrors.code = 'Please enter the verification code';
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = 'Verification code must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await authAPI.register(email, password, code);
      Alert.alert('Success', 'Registration successful!', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed, please check your information and try again';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up for a new Tomato Calendar account</Text>
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
                label="Verification Code"
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
              title={countdown > 0 ? `${countdown}s` : 'Send Code'}
              onPress={handleSendCode}
              loading={codeLoading}
              disabled={countdown > 0}
              variant="outline"
              style={styles.codeButton}
            />
          </View>

          <CustomInput
            label="Password"
            placeholder="Enter password (at least 6 characters)"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: undefined });
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          <CustomInput
            label="Confirm Password"
            placeholder="Enter password again"
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
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
          />

          <View style={styles.footer}>
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('Login')}
            >
              Already have an account? Sign in
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flex: 1,
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

