import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import GridBackground from '../components/GridBackground';
import { focusAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

type TomatoTimerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TomatoTimer'>;

// 番茄图标 SVG（根据 Figma 设计调整大小）
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

// 小番茄图标 SVG（用于底部显示）
const smallTomatoIconSvg = `<svg width="35" height="34" viewBox="0 0 67 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M38.8118 1.37987L30.5001 0.548706L30.0845 6.36689L29.669 12.1851C24.6819 14.6786 15.5391 13.0162 11.3832 11.3539C14.9358 12.7749 16.977 14.66 18.0326 16.6484C19.9405 20.2425 18.6284 24.1745 17.2014 26.3149C26.3443 20.4968 37.9807 22.1591 48.7859 26.3149C47.2001 21.9542 48.2931 18.7555 50.0214 16.6484C51.192 15.2213 52.6541 14.2949 53.7729 13.8474C43.1339 15.8422 38.8118 13.0162 37.9806 11.3539L38.3962 6.36689L38.8118 1.37987Z" fill="#85B37C"/>
<path d="M48.7859 26.3149C37.9807 22.1591 26.3443 20.4968 17.2014 26.3149C18.6284 24.1745 19.9405 20.2425 18.0326 16.6484C5.56492 20.4968 -0.253257 31.302 0.577906 44.6007C3.07142 57.8994 15.4395 64.5487 32.9935 64.5487C52.5958 64.5487 66.2402 59.5617 66.2402 41.276C65.4091 32.9643 63.7467 23.8214 50.0214 16.6484C48.2931 18.7555 47.2001 21.9542 48.7859 26.3149Z" fill="#DF8788"/>
<path d="M18.0326 16.6484C19.9405 20.2425 18.6284 24.1745 17.2014 26.3149C26.3443 20.4968 37.9807 22.1591 48.7859 26.3149C47.2001 21.9542 48.2931 18.7555 50.0214 16.6484M18.0326 16.6484C16.977 14.66 14.9358 12.7749 11.3832 11.3539C15.5391 13.0162 24.6819 14.6786 29.669 12.1851L30.0845 6.36689L30.5001 0.548706L38.8118 1.37987L38.3962 6.36689L37.9806 11.3539C38.8118 13.0162 43.1339 15.8422 53.7729 13.8474C52.6541 14.2949 51.192 15.2213 50.0214 16.6484M18.0326 16.6484C5.56492 20.4968 -0.253257 31.302 0.577906 44.6007C3.07142 57.8994 15.4395 64.5487 32.9935 64.5487C52.5958 64.5487 66.2403 59.5617 66.2403 41.276C65.4091 32.9643 63.7467 23.8214 50.0214 16.6484" stroke="black" stroke-linecap="round"/>
<circle cx="19.6948" cy="39.6136" r="4.98701" fill="#D46C6E"/>
<circle cx="45.461" cy="39.6136" r="4.98701" fill="#D46C6E"/>
<circle cx="24.6818" cy="36.2889" r="1.16234" fill="black" stroke="black"/>
<path d="M41.1967 35.1266C41.7188 35.1266 42.1419 35.5498 42.142 36.0719C42.142 36.5941 41.7189 37.0172 41.1967 37.0172C40.6746 37.0171 40.2514 36.594 40.2514 36.0719C40.2515 35.5498 40.6747 35.1267 41.1967 35.1266Z" fill="black" stroke="black"/>
<path d="M31.0782 37.9512C32.1624 38.7824 33.8247 38.7824 34.692 37.9512" stroke="black" stroke-linecap="round"/>
</svg>`;

// 时钟图标 SVG（简化版）
const clockIconSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14" cy="14" r="13" stroke="black" stroke-width="2"/>
<path d="M14 7V14L19 17" stroke="black" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const FOCUS_END_AT_KEY = 'focus_end_at';
const FOCUS_DURATION_MINUTES_KEY = 'focus_duration_minutes';

export default function TomatoTimerScreen() {
  const navigation = useNavigation<TomatoTimerScreenNavigationProp>();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const backgroundColor = isDark ? '#B0B0B0' : '#FFFFFB';
  const textOnGray = isDark ? '#FFFFFF' : '#000000';
  
  // 根据 Figma 设计，计算相对位置
  // Figma 设计宽度为 393px，需要根据实际屏幕宽度进行缩放
  const scale = width / 393;
  
  // 时间选择器状态
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHours, setSelectedHours] = useState(0); // 默认0小时
  const [selectedMinutes, setSelectedMinutes] = useState(20); // 默认20分钟
  // 保存确认的时间（用于取消时恢复）
  const [confirmedHours, setConfirmedHours] = useState(0);
  const [confirmedMinutes, setConfirmedMinutes] = useState(20);
  // 临时选择的时间（在时间选择器中修改）
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(20);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  
  // 倒计时状态
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completionHandledRef = useRef(false);
  const endAtRef = useRef<number | null>(null);
  const durationMinutesRef = useRef<number | null>(null);

  // 专注完成次数（默认0）
  const [focusCount, setFocusCount] = useState(0);
  
  // 停止确认弹窗状态
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  
  // 生成小时选项（0-23小时）
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  
  // 生成分钟选项（0-55分钟，每5分钟一个选项）
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  
  // 计算总分钟数
  const totalMinutes = selectedHours * 60 + selectedMinutes;
  
  // 格式化显示时间（如果小时为0则不显示小时）
  const formatTimeDisplay = () => {
    // 如果正在倒计时，显示剩余时间
    if (isRunning && remainingSeconds > 0) {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}min ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}min ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
    
    // 否则显示设置的时间
    if (confirmedHours === 0) {
      return `${confirmedMinutes}min`;
    }
    return `${confirmedHours}h ${confirmedMinutes}min`;
  };
  
  const persistFocusSession = useCallback(async (endAt: number, durationMinutes: number) => {
    try {
      await AsyncStorage.multiSet([
        [FOCUS_END_AT_KEY, String(endAt)],
        [FOCUS_DURATION_MINUTES_KEY, String(durationMinutes)],
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to persist focus session', error);
      }
    }
  }, []);

  const clearFocusSession = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([FOCUS_END_AT_KEY, FOCUS_DURATION_MINUTES_KEY]);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to clear focus session', error);
      }
    }
  }, []);

  // 开始倒计时
  const startCountdown = () => {
    const durationMinutes = confirmedHours * 60 + confirmedMinutes;
    const totalSeconds = durationMinutes * 60;
    if (totalSeconds <= 0) return;

    completionHandledRef.current = false;
    durationMinutesRef.current = durationMinutes;
    const endAt = Date.now() + totalSeconds * 1000;
    endAtRef.current = endAt;
    setRemainingSeconds(totalSeconds);
    setIsRunning(true);
    persistFocusSession(endAt, durationMinutes);
  };
  
  // 停止倒计时
  const stopCountdown = () => {
    setIsRunning(false);
    setRemainingSeconds(0);
    endAtRef.current = null;
    durationMinutesRef.current = null;
    completionHandledRef.current = true;
    clearFocusSession();
  };
  
  // 显示停止确认弹窗
  const showStopConfirm = () => {
    // 暂停倒计时（保留剩余时间）
    if (endAtRef.current) {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    }
    setIsRunning(false);
    endAtRef.current = null;
    clearFocusSession();
    setShowStopConfirmModal(true);
  };
  
  // 确认停止
  const confirmStop = () => {
    stopCountdown();
    setShowStopConfirmModal(false);
  };
  
  // 取消停止（继续倒计时）
  const cancelStop = () => {
    setShowStopConfirmModal(false);
    // 恢复倒计时（如果还有剩余时间）
    if (remainingSeconds > 0) {
      const endAt = Date.now() + remainingSeconds * 1000;
      endAtRef.current = endAt;
      if (durationMinutesRef.current === null) {
        durationMinutesRef.current = confirmedHours * 60 + confirmedMinutes;
      }
      persistFocusSession(endAt, durationMinutesRef.current || 0);
      setIsRunning(true);
    }
  };
  
  const handleCountdownComplete = useCallback(async (durationOverride?: number) => {
    const fallbackDuration = confirmedHours * 60 + confirmedMinutes;
    const durationMinutes = typeof durationOverride === 'number' && durationOverride > 0
      ? durationOverride
      : durationMinutesRef.current ?? fallbackDuration;

    setFocusCount((prev) => prev + 1);

    try {
      await focusAPI.finishFocus({
        duration: durationMinutes > 0 ? durationMinutes : undefined,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to finish focus', error);
      }
    }
  }, [confirmedHours, confirmedMinutes]);

  // 初始化倒计时（返回页面时继续）
  useEffect(() => {
    const loadPersistedSession = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          FOCUS_END_AT_KEY,
          FOCUS_DURATION_MINUTES_KEY,
        ]);
        const endAtStr = entries[0]?.[1];
        const durationStr = entries[1]?.[1];
        if (!endAtStr) {
          return;
        }
        const endAt = Number(endAtStr);
        if (!Number.isFinite(endAt)) {
          clearFocusSession();
          return;
        }
        const durationMinutes = durationStr ? Number(durationStr) : undefined;
        if (typeof durationMinutes === 'number' && !Number.isNaN(durationMinutes)) {
          durationMinutesRef.current = durationMinutes;
        }
        const remaining = Math.ceil((endAt - Date.now()) / 1000);
        if (remaining > 0) {
          endAtRef.current = endAt;
          completionHandledRef.current = false;
          setRemainingSeconds(remaining);
          setIsRunning(true);
        } else {
          endAtRef.current = null;
          clearFocusSession();
          if (!completionHandledRef.current) {
            completionHandledRef.current = true;
            await handleCountdownComplete(durationMinutesRef.current ?? undefined);
          }
          setRemainingSeconds(0);
          setIsRunning(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to restore focus session', error);
        }
      }
    };

    loadPersistedSession();
  }, [clearFocusSession, handleCountdownComplete]);

  // 倒计时效果
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const endAt = endAtRef.current;
        if (!endAt) {
          setIsRunning(false);
          return;
        }
        const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        if (remaining <= 0) {
          setRemainingSeconds(0);
          setIsRunning(false);
          clearFocusSession();
          if (!completionHandledRef.current) {
            completionHandledRef.current = true;
            handleCountdownComplete(durationMinutesRef.current ?? undefined);
          }
          return;
        }
        setRemainingSeconds(remaining);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [clearFocusSession, handleCountdownComplete, isRunning]);

  // 初始化专注统计
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await focusAPI.getStats();
        if (typeof stats?.totalCount === 'number') {
          setFocusCount(stats.totalCount);
        } else {
          setFocusCount(0);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to fetch focus stats', error);
        }
        setFocusCount(0);
      }
    };

    fetchStats();
  }, []);

  
  // 打开时间选择器
  const openTimePicker = () => {
    // 使用确认的时间作为临时选择的初始值
    setTempHours(confirmedHours);
    setTempMinutes(confirmedMinutes);
    setShowTimePicker(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };
  
  // 关闭时间选择器（点击外部，不保存）
  const closeTimePicker = () => {
    // 恢复到确认的时间
    setSelectedHours(confirmedHours);
    setSelectedMinutes(confirmedMinutes);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowTimePicker(false);
    });
  };
  
  // 确认时间选择
  const confirmTimeSelection = () => {
    // 保存临时选择的时间
    setConfirmedHours(tempHours);
    setConfirmedMinutes(tempMinutes);
    setSelectedHours(tempHours);
    setSelectedMinutes(tempMinutes);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowTimePicker(false);
    });
  };
  
  // 选择小时（临时）
  const handleHourChange = (itemValue: number) => {
    setTempHours(itemValue);
  };
  
  // 选择分钟（临时）
  const handleMinuteChange = (itemValue: number) => {
    setTempMinutes(itemValue);
  };
  
  // 计算弹窗的 translateY
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [478 * scale, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <GridBackground />
      
      {/* 返回按钮 */}
      <TouchableOpacity
        style={[styles.backButton, {
          left: 29 * scale,
          top: 70 * scale,
        }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24 * scale} color="#000000" />
      </TouchableOpacity>

      {/* 标题 "Tomato Timer" - 在卡片外部，与返回按钮平齐 */}
      <View style={[styles.titleContainer, {
        left: 0,
        right: 0,
        top: 70 * scale - 8, // 向上移动5px
      }]}>
        <Text style={[styles.title, isDark && { color: textOnGray }]}>
          Tomato Timer
        </Text>
      </View>

      {/* 粉色卡片 */}
      <View style={[styles.card, {
        left: 27 * scale,
        top: 112 * scale,
        width: 338 * scale,
        height: 645 * scale,
      }]}>

        {/* 大番茄图标 */}
        <View style={[styles.tomatoIcon, {
          top: 169 * scale -100,
          width: 129.43 * scale,
          height: 126 * scale,
        }]}>
          <SvgXml xml={tomatoIconSvg} width="100%" height="100%" />
        </View>

        {/* 文本 "5 tomatoes have been harvested!" */}
        <View style={[styles.harvestText, {
          top: 310 * scale -100,
        }]}>
          <Text style={styles.harvestTextContent}>
            <Text style={styles.harvestTextBold}>{focusCount} </Text>
            tomatoes{'\n'}have been harvested!
          </Text>
        </View>

        {/* 时钟和 "20min" - 可点击组件 */}
        <TouchableOpacity
          style={[styles.timerContainer, {
            top: 441 * scale -80,
          }]}
          onPress={isRunning ? undefined : openTimePicker}
          activeOpacity={0.7}
          disabled={isRunning}
        >
          {!isRunning && (
            <View style={[styles.clockIcon, {
              width: 28 * scale,
              height: 28 * scale,
            }]}>
              <SvgXml xml={clockIconSvg} width="100%" height="100%" />
            </View>
          )}
          <Text style={[styles.timerText, {
            marginLeft: isRunning ? 0 : 4 * scale,
          }]}>
            {formatTimeDisplay()}
          </Text>
        </TouchableOpacity>

        {/* "Start to Focus" / "Stop Focusing" 按钮 */}
        <TouchableOpacity
          style={[styles.startButton, {
            top: 479 * scale -70,
            width: 188 * scale,
            height: 54 * scale,
          }]}
          onPress={() => {
            if (isRunning) {
              showStopConfirm();
            } else {
              startCountdown();
            }
          }}
        >
          <Text style={styles.startButtonText}>
            {isRunning ? 'Stop Focusing' : 'Start to Focus'}
          </Text>
        </TouchableOpacity>

        {/* 底部小番茄图标 - 放在卡片内部底部左边 */}
        <View style={[styles.smallTomatoesContainer, {
          paddingLeft: 53 * scale, // 根据原始设计，第一个图标距离左边53px
          paddingBottom: 18 * scale, // 距离底部一些间距
        }]}>
          {Array.from({ length: Math.min(focusCount, 5) }).map((_, index) => (
            <View
              key={`tomato-${index}`}
              style={[styles.smallTomato, {
                width: 34.92 * scale,
                height: 34 * scale,
                marginRight: index < 4 ? (43 - 34.92) * scale : 0,
              }]}
            >
              <SvgXml xml={smallTomatoIconSvg} width="100%" height="100%" />
            </View>
          ))}
          {focusCount > 5 && (
            <Text style={[styles.smallTomatoOverflow, { marginLeft: 6 * scale }]}>
              ... x {focusCount}
            </Text>
          )}
        </View>
      </View>
      
      {/* 底部时间选择器弹窗 */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="none"
        onRequestClose={closeTimePicker}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeTimePicker}
          />
          <Animated.View
            style={[
              styles.timePickerModal,
              {
                height: 478 * scale,
                transform: [{ translateY }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.timePickerContent}>
              {/* 顶部拖拽指示器 */}
              <View style={styles.dragIndicator} />
              
              {/* 标题 */}
              <Text style={styles.timePickerTitle}>Select Time</Text>
              
              {/* 滚轮时间选择器 - 小时和分钟 */}
              <View style={styles.pickerContainer}>
                {/* 高亮背景条（选中行背景） */}
                <View style={[styles.highlightBar, {
                  height: 49 * scale, // 高度减小10px (59 - 10 = 49)
                }]} />
                
                <View style={styles.pickerRow}>
                  {/* 小时选择器 */}
                  <View style={styles.pickerColumn}>
                    <View style={styles.pickerWithLabel}>
                      <Picker
                        selectedValue={tempHours}
                        onValueChange={handleHourChange}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                      >
                        {hourOptions.map((hour) => (
                          <Picker.Item
                            key={hour}
                            label={hour === 0 ? '0' : `${hour}`}
                            value={hour}
                          />
                        ))}
                      </Picker>
                      <Text style={styles.pickerLabel}>h</Text>
                    </View>
                  </View>
                  
                  {/* 分钟选择器 */}
                  <View style={styles.pickerColumn}>
                    <View style={styles.pickerWithLabel}>
                      <Picker
                        selectedValue={tempMinutes}
                        onValueChange={handleMinuteChange}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                      >
                        {minuteOptions.map((minutes) => (
                          <Picker.Item
                            key={minutes}
                            label={minutes === 0 ? '0' : `${minutes}`}
                            value={minutes}
                          />
                        ))}
                      </Picker>
                      <Text style={styles.pickerLabel}>min</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* 确认按钮 */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmTimeSelection}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* 停止确认弹窗 */}
      <Modal
        visible={showStopConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelStop}
      >
        <TouchableOpacity
          style={styles.stopConfirmOverlay}
          activeOpacity={1}
          onPress={cancelStop}
        >
          <View style={[styles.stopConfirmModal, {
            width: 292 * scale,
            minHeight: 150 * scale, // 增加最小高度以确保内容不被遮盖
            borderRadius: 24 * scale,
          }]}>
            {/* 文本内容 */}
            <View style={[styles.stopConfirmTextContainer, {
              paddingHorizontal: 20 * scale,
              paddingTop: 22 * scale,
              paddingBottom: 10 * scale,
            }]}>
              <Text style={[styles.stopConfirmText, {
                fontSize: 16 * scale, // 稍微减小字体以确保显示
                lineHeight: 20 * scale, // 调整行高
              }]}>
                Do you really want to stop focusing?{'\n'}You will lose a tomato T^T
              </Text>
            </View>
            
            {/* 分隔线 */}
            <View style={[styles.stopConfirmDivider, {
              width: 267 * scale,
              marginLeft: 12 * scale,
              marginTop: 8 * scale,
            }]} />
            
            {/* 按钮区域 */}
            <View style={[styles.stopConfirmButtons, {
              paddingHorizontal: 50 * scale, // 减少左右内边距
              paddingTop: 15 * scale, // 增加顶部内边距
              paddingBottom: 20 * scale, // 增加底部内边距
              minHeight: 50 * scale, // 确保按钮区域有足够高度
            }]}>
              <TouchableOpacity
                style={[styles.stopConfirmButton, {
                  paddingVertical: 8 * scale, // 增加按钮内边距
                }]}
                onPress={confirmStop}
              >
                <Text style={[styles.stopConfirmButtonTextStop, {
                  fontSize: 16 * scale, // 稍微减小字体
                }]}>Stop</Text>
              </TouchableOpacity>
              
              {/* 垂直分隔线 */}
              <View style={[styles.stopConfirmVerticalDivider, {
                height: 30 * scale, // 稍微减小高度
                marginHorizontal: 10 * scale, // 增加左右间距
              }]} />
              
              <TouchableOpacity
                style={[styles.stopConfirmButton, {
                  paddingVertical: 8 * scale, // 增加按钮内边距
                }]}
                onPress={cancelStop}
              >
                <Text style={[styles.stopConfirmButtonTextContinue, {
                  fontSize: 16 * scale, // 稍微减小字体
                }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
  backButton: {
    position: 'absolute',
    zIndex: 10,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#FFC3C4',
    borderRadius: 20,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  tomatoIcon: {
    position: 'absolute',
    alignSelf: 'center',
  },
  harvestText: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  harvestTextContent: {
    fontFamily: 'System',
    fontSize: 24,
    lineHeight: 22,
    color: '#000000',
    textAlign: 'center',
  },
  harvestTextBold: {
    fontWeight: '700',
  },
  timerContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  clockIcon: {
    // 时钟图标容器
  },
  timerText: {
    fontFamily: 'System',
    fontSize: 24,
    lineHeight: 28, // 增加行高，避免上方被裁剪
    color: '#000000',
    includeFontPadding: false, // Android 上移除额外的字体内边距
  },
  startButton: {
    position: 'absolute',
    backgroundColor: '#DF8788',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  startButtonText: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 22,
    color: '#000000',
  },
  smallTomatoesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  smallTomato: {
    // 小番茄图标样式
  },
  smallTomatoOverflow: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModal: {
    backgroundColor: '#FFFFFB',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    width: '100%',
  },
  timePickerContent: {
    flex: 1,
    paddingTop: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0DED3',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  timePickerTitle: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  highlightBar: {
    position: 'absolute',
    width: '100%',
    backgroundColor: 'rgba(255, 195, 196, 0.42)',
    top: '50%',
    marginTop: -52.5, // 高度的一半 + 向上移动28px (-24.5 - 28 = -52.5)
    zIndex: 0,
    borderRadius: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  picker: {
    width: '80%',
    height: 300,
    backgroundColor: 'transparent', // 移除暗色背景
  },
  pickerItem: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'System',
  },
  pickerLabel: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'System',
    marginLeft: -70, // 向左移动5px (-45 - 5 = -50)
    marginTop: -85, // 向上移动30px
    fontWeight: '500',
    height: 300,
    lineHeight: 300,
    textAlignVertical: 'center',
  },
  confirmButton: {
    backgroundColor: '#DF8788',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginBottom: 40,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  stopConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopConfirmModal: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  stopConfirmTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopConfirmText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  stopConfirmDivider: {
    height: 1,
    backgroundColor: '#000000',
  },
  stopConfirmButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopConfirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopConfirmButtonTextStop: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#FF0000',
    textAlign: 'center',
  },
  stopConfirmButtonTextContinue: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#0077FF',
    textAlign: 'center',
  },
  stopConfirmVerticalDivider: {
    width: 1,
    backgroundColor: '#000000',
  },
});

