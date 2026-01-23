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

interface ResetPasswordScreenProps {
  navigation: any;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
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
      setErrors({ ...errors, email: '请输入邮箱' });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ ...errors, email: '请输入有效的邮箱地址' });
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
      Alert.alert('成功', '验证码已发送到您的邮箱，请查收');
      
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
      const message = error.response?.data?.message || '发送验证码失败，请稍后重试';
      Alert.alert('错误', message);
    } finally {
      setCodeLoading(false);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!code) {
      newErrors.code = '请输入验证码';
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = '验证码为6位数字';
    }
    
    if (!newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = '密码长度至少6位';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
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
      Alert.alert('成功', '密码重置成功！', [
        { text: '确定', onPress: () => navigation.replace('Login') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || '重置密码失败，请检查信息后重试';
      Alert.alert('错误', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>重置密码</Text>
          <Text style={styles.subtitle}>通过邮箱验证码重置您的密码</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="邮箱"
            placeholder="请输入注册邮箱"
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
                label="验证码"
                placeholder="请输入6位验证码"
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
              title={countdown > 0 ? `${countdown}秒` : '发送验证码'}
              onPress={handleSendCode}
              loading={codeLoading}
              disabled={countdown > 0}
              variant="outline"
              style={styles.codeButton}
            />
          </View>

          <CustomInput
            label="新密码"
            placeholder="请输入新密码（至少6位）"
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
            label="确认新密码"
            placeholder="请再次输入新密码"
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
            title="重置密码"
            onPress={handleResetPassword}
            loading={loading}
          />

          <View style={styles.footer}>
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('Login')}
            >
              返回登录
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

