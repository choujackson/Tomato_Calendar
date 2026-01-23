import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { authAPI } from '../services/api';
import { theme } from '../styles/theme';
import { SvgXml } from 'react-native-svg';

const SPLASH_BACKGROUND = '#FFFFF3';
const SPLASH_HOLD_MS = 2000;
const tomatoIconSvg = `<svg width="67" height="66" viewBox="0 0 67 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M38.8118 1.37987L30.5001 0.548706L30.0845 6.36689L29.669 12.1851C24.6819 14.6786 15.5391 13.0162 11.3832 11.3539C14.9358 12.7749 16.977 14.66 18.0326 16.6484C19.9405 20.2425 18.6284 24.1745 17.2014 26.3149C26.3443 20.4968 37.9807 22.1591 48.7859 26.3149C47.2001 21.9542 48.2931 18.7555 50.0214 16.6484C51.192 15.2213 52.6541 14.2949 53.7729 13.8474C43.1339 15.8422 38.8118 13.0162 37.9806 11.3539L38.3962 6.36689L38.8118 1.37987Z" fill="#85B37C"/>
<path d="M48.7859 26.3149C37.9807 22.1591 26.3443 20.4968 17.2014 26.3149C18.6284 24.1745 19.9405 20.2425 18.0326 16.6484C5.56492 20.4968 -0.253257 31.302 0.577906 44.6007C3.07142 57.8994 15.4395 64.5487 32.9935 64.5487C52.5958 64.5487 66.2402 59.5617 66.2402 41.276C65.4091 32.9643 63.7467 23.8214 50.0214 16.6484C48.2931 18.7555 47.2001 21.9542 48.7859 26.3149Z" fill="#DF8788"/>
<path d="M18.0326 16.6484C19.9405 20.2425 18.6284 24.1745 17.2014 26.3149C26.3443 20.4968 37.9807 22.1591 48.7859 26.3149C47.2001 21.9542 48.2931 18.7555 50.0214 16.6484M18.0326 16.6484C16.977 14.66 14.9358 12.7749 11.3832 11.3539C15.5391 13.0162 24.6819 14.6786 29.669 12.1851L30.0845 6.36689L30.5001 0.548706L38.8118 1.37987L38.3962 6.36689L37.9806 11.3539C38.8118 13.0162 43.1339 15.8422 53.7729 13.8474C52.6541 14.2949 51.192 15.2213 50.0214 16.6484M18.0326 16.6484C5.56492 20.4968 -0.253257 31.302 0.577906 44.6007C3.07142 57.8994 15.4395 64.5487 32.9935 64.5487C52.5958 64.5487 66.2403 59.5617 66.2403 41.276C65.4091 32.9643 63.7467 23.8214 50.0214 16.6484" stroke="black" stroke-linecap="round"/>
<circle cx="19.6948" cy="39.6136" r="4.98701" fill="#D46C6E"/>
<circle cx="45.461" cy="39.6136" r="4.98701" fill="#D46C6E"/>
<circle cx="24.6818" cy="36.2889" r="1.16234" fill="black" stroke="black"/>
<path d="M41.1967 35.1266C41.7188 35.1266 42.1419 35.5498 42.142 36.0719C42.142 36.5941 41.7189 37.0172 41.1967 37.0172C40.6746 37.0171 40.2514 36.594 40.2514 36.0719C40.2515 35.5498 40.6747 35.1267 41.1967 35.1266Z" fill="black" stroke="black"/>
<path d="M31.0782 37.9512C32.1624 38.7824 33.8247 38.7824 34.692 37.9512" stroke="black" stroke-linecap="round"/>
</svg>`;

let hasShownSplash = false;

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showSplash, setShowSplash] = useState(!hasShownSplash);

  const iconSize = Math.round(Math.max(72, Math.min(100, height * 0.14)));

  const contentOpacity = useRef(new Animated.Value(!hasShownSplash ? 0 : 1)).current;
  const contentTranslateY = useRef(
    new Animated.Value(!hasShownSplash ? 12 : 0)
  ).current;
  // 图标和背景使用相同的opacity，一起淡出
  const splashOpacity = useRef(new Animated.Value(!hasShownSplash ? 1 : 0)).current;

  useEffect(() => {
    if (!showSplash) {
      return;
    }

    let forceRemoveTimer: NodeJS.Timeout;
    // 2秒后开始淡出动画
    const timer = setTimeout(() => {
      // 启动画面和图标一起淡出，登录内容淡入
      const animation = Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

      animation.start(() => {
        // 动画完成后，完全移除启动画面和图标
        hasShownSplash = true;
        setShowSplash(false);
      });

      // 强制移除：在动画时间后一定移除（2000ms等待 + 400ms动画 = 2400ms）
      forceRemoveTimer = setTimeout(() => {
        hasShownSplash = true;
        setShowSplash(false);
      }, 2400);
    }, SPLASH_HOLD_MS);

    return () => {
      clearTimeout(timer);
      if (forceRemoveTimer) {
        clearTimeout(forceRemoveTimer);
      }
    };
  }, [showSplash, splashOpacity, contentOpacity, contentTranslateY]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await authAPI.login(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Calendar' }],
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed, please check your email and password';
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
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
            zIndex: 10,
          },
        ]}
        pointerEvents={showSplash ? 'none' : 'auto'}
      >
        <View style={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Tomato Calendar</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
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

            <CustomInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
            />

            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
            />

            <View style={styles.footer}>
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('Register')}
              >
                Don't have an account? Sign up
              </Text>
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('ResetPassword')}
              >
                Forgot password?
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {showSplash ? (
        <>
          <Animated.View
            pointerEvents="auto"
            style={[styles.splashOverlay, { opacity: splashOpacity }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.logoWrapper,
              {
                opacity: splashOpacity,
              },
            ]}
          >
            <SvgXml xml={tomatoIconSvg} width={iconSize} height={iconSize} />
          </Animated.View>
        </>
      ) : null}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  content: {
    flex: 1,
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
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BACKGROUND,
    zIndex: 1,
  },
  logoWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2, // For Android
  },
});

