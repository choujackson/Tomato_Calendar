import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  PanResponder,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import GridBackground from '../components/GridBackground';
import { usePlan } from '../context/PlanContext';
import { useDateContext } from '../context/DateContext';
import { getTodayString } from '../utils/dateUtils';
import UserProfileScreen from './UserProfileScreen';
import { useTheme } from '../context/ThemeContext';

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;

const { width, height: screenHeight } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  color: string;
}

export default function CalendarView() {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const backgroundColor = isDark ? '#B0B0B0' : '#FFFFFB';
  const headerBackgroundColor = isDark ? '#B0B0B0' : '#FFFFFB';
  const headerTextColor = isDark ? '#FFFFFF' : '#000000';
  const dayTextColor = isDark ? '#FFFFFF' : '#000000';
  const dayTextMutedColor = isDark ? '#FFFFFF' : '#757575';
  const { getPlansForDate, fetchPlansInRange } = usePlan();
  const { currentDate, setCurrentDate } = useDateContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // Side panel (UserProfile) state
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  // Use translateX: 0 means hidden (-width off-screen), width means fully visible (at left: 0)
  const sidePanelTranslateX = useRef(new Animated.Value(0)).current;
  
  // Initialize side panel position - translateX: 0 = hidden, width = visible
  useEffect(() => {
    if (!sidePanelVisible) {
      sidePanelTranslateX.setValue(0); // 0 = hidden (-width off-screen)
    }
  }, [sidePanelVisible, width]);
  const sidePanelPanGesture = useRef<{ dx: number; dy: number; isHorizontal: boolean | null }>({
    dx: 0,
    dy: 0,
    isHorizontal: null,
  }).current;
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString('en-US', { month: 'long' });
  
  // 获取今天的日期字符串
  const todayString = getTodayString();

  // 获取月份的第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // 生成日期数组
  const days = [];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // 格式化日期为 YYYY-MM-DD（使用本地时间，避免时区问题）
  const formatDateString = (year: number, month: number, day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    const startDate = formatDateString(year, month, 1);
    const endDate = formatDateString(year, month, daysInMonth);
    fetchPlansInRange(startDate, endDate);
  }, [fetchPlansInRange, year, month, daysInMonth]);

  // 添加上个月的日期（灰色）
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const dateObj = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: prevMonthLastDay - i,
      isCurrentMonth: false,
      fullDate: formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
    });
  }

  // 添加当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    days.push({
      date: day,
      isCurrentMonth: true,
      fullDate: formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
    });
  }

  // 添加下个月的日期（填充到5行，共35天）
  const remainingDays = 35 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const dateObj = new Date(year, month + 1, day);
    days.push({
      date: day,
      isCurrentMonth: false,
      fullDate: formatDateString(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
    });
  }

  const handleDatePress = (day: number, isCurrentMonth: boolean, fullDate: string) => {
    if (!isCurrentMonth) return;
    
    if (currentDate === fullDate) {
      // 第二次点击，进入详情页
      navigation.navigate('Detail', { date: fullDate });
    } else {
      // 第一次点击，选中该日期（保存完整日期字符串）
      setCurrentDate(fullDate);
    }
  };

  const getTasksForDay = (fullDate: string): Task[] => {
    const plans = getPlansForDate(fullDate);
    // 转换为简略格式，只显示title和color
    return plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      color: plan.color,
    }));
  };

  // 生成年份列表（当前年份前后10年）
  const generateYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // 月份列表
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const handleYearSelect = (selectedYear: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(selectedYear);
    setCurrentMonth(newDate);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (selectedMonthIndex: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(selectedMonthIndex);
    setCurrentMonth(newDate);
    setShowMonthPicker(false);
  };

  // Animate panel open with bounce effect
  // translateX: 0 = hidden, width = visible
  const animatePanelOpen = () => {
    // Stop any ongoing animation first
    sidePanelTranslateX.stopAnimation();
    
    // Create bounce animation: go slightly past width, then back to width
    const bounceAmount = width * 1.05; // 5% overshoot
    Animated.sequence([
      Animated.timing(sidePanelTranslateX, {
        toValue: bounceAmount,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(sidePanelTranslateX, {
        toValue: width,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
        overshootClamping: false,
      }),
    ]).start();
  };

  // Animate panel close with smooth animation
  // translateX: 0 = hidden
  const animatePanelClose = () => {
    // Stop any ongoing animation first
    sidePanelTranslateX.stopAnimation();
    
    Animated.timing(sidePanelTranslateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setSidePanelVisible(false);
    });
  };

  // PanResponder for side panel (UserProfile) gestures - use useMemo to get latest state
  const sidePanelPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false, // Don't capture on start, wait to determine direction
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          if (!sidePanelVisible) return false;
          
          // Determine gesture direction on first move - lower threshold for better response
          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);
          const isHorizontal = absDx > absDy && absDx > 5; // Only respond to horizontal gestures
          
          // Only respond if it's clearly horizontal (not vertical scrolling)
          if (isHorizontal) {
            sidePanelPanGesture.isHorizontal = true;
            return true;
          }
          
          // If it's vertical scrolling, don't intercept - let ScrollView handle it
          return false;
        },
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant: () => {
          sidePanelPanGesture.dx = 0;
          sidePanelPanGesture.dy = 0;
          sidePanelPanGesture.isHorizontal = true; // Set to true since we only respond to horizontal
        },
        onPanResponderMove: (evt, gestureState) => {
          // Panel is open (translateX = width), left swipe (negative dx) should move it left
          // Calculate new translateX: width + dx (dx is negative for left swipe)
          const newTranslateX = Math.max(0, Math.min(width, width + gestureState.dx));
          sidePanelTranslateX.setValue(newTranslateX);
          sidePanelPanGesture.dx = gestureState.dx;
        },
        onPanResponderRelease: (evt, gestureState) => {
          const threshold = width * 0.5; // Changed to 50% threshold
          const shouldClose = gestureState.dx < -threshold || gestureState.vx < -0.3;
          
          if (shouldClose) {
            // Close side panel
            animatePanelClose();
          } else {
            // Snap back to open with bounce
            animatePanelOpen();
          }
          
          sidePanelPanGesture.isHorizontal = null;
        },
      }),
    [sidePanelVisible, width, animatePanelOpen, animatePanelClose]
  );

  // PanResponder for main content (Calendar) - handles left swipe to Home and right swipe to show UserProfile
  // Use useMemo to recreate when sidePanelVisible changes so it always has latest state
  const panResponder = useMemo(
    () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !sidePanelVisible,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (sidePanelVisible) return false;
        
        // Determine gesture direction: horizontal vs vertical - higher sensitivity threshold
        const absDx = Math.abs(gestureState.dx);
        const absDy = Math.abs(gestureState.dy);
        // Lower threshold for higher sensitivity (2px instead of 3px)
        const isHorizontal = absDx > absDy && absDx > 2;
        
        return isHorizontal;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        sidePanelPanGesture.isHorizontal = null;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle right swipe to show side panel - real-time following
        if (gestureState.dx > 0) {
          // Always render side panel during right swipe for smooth experience
          if (!sidePanelVisible) {
            setSidePanelVisible(true);
            // Ensure panel starts from correct position (hidden)
            sidePanelTranslateX.setValue(0);
          }
          
          // Calculate translateX: 0 = hidden, width = fully visible
          // gestureState.dx increases from 0 to width as user swipes right
          // translateX should go from 0 (hidden) to width (visible)
          const translateX = Math.max(0, Math.min(width, gestureState.dx));
          sidePanelTranslateX.setValue(translateX);
          
          // Auto-open when swiped more than 30% of screen width during move (higher sensitivity)
          const threshold = width * 0.3;
          if (gestureState.dx > threshold && gestureState.vx >= 0) {
            // Automatically open side panel - use bounce animation sequence
            animatePanelOpen();
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (sidePanelVisible && gestureState.dx > 0) {
          // Handle right swipe release - determine if should open or close
          const threshold = width * 0.3; // Changed to 30% threshold for higher sensitivity
          
          // If swiped more than 30% of screen width OR has positive velocity, open panel
          if (gestureState.dx > threshold || gestureState.vx > 0.1) {
            // Open side panel with bounce animation
            animatePanelOpen();
          } else {
            // Close side panel with animation
            animatePanelClose();
          }
        } else if (!sidePanelVisible && gestureState.dx < 0) {
          // Handle left swipe to Home (existing logic)
        if (gestureState.dx < -50 || gestureState.vx < -0.3) {
          try {
            navigation.navigate('Home');
          } catch (error) {
            console.error('Navigation error:', error);
            }
          }
        }
      },
      }),
    [sidePanelVisible, width, animatePanelOpen, animatePanelClose, navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor }]} {...panResponder.panHandlers}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor, shadowColor: isDark ? '#9E9E9E' : '#EDEBD8' },
        ]}
      >
        <View style={styles.yearMonthContainer}>
          <TouchableOpacity 
            style={styles.yearRow}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={[styles.yearText, { color: headerTextColor }]}>{year}</Text>
            <Ionicons name="chevron-down" size={16} color={headerTextColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.monthRow}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={[styles.monthText, { color: headerTextColor }]}>{monthName}</Text>
            <Ionicons name="chevron-down" size={16} color={headerTextColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Days */}
      <View
        style={[
          styles.weekDaysContainer,
          { backgroundColor: headerBackgroundColor, shadowColor: isDark ? '#9E9E9E' : '#EDEBD8' },
        ]}
      >
        {weekDays.map((day, index) => {
          const verticalSpacing = width / 14; // 14条竖线，计算每个网格单位
          // 第一个字母对齐第1条竖线（索引1），其余每个间隔2个网格单位
          const lineIndex = 1 + index * 2;
          const linePosition = lineIndex * verticalSpacing + 2; // 向右移动2px
          return (
            <View 
              key={index} 
              style={[
                styles.weekDay,
                { left: linePosition }
              ]}
            >
              <Text style={[styles.weekDayText, { color: headerTextColor }]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Calendar Grid */}
      <GHScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <GridBackground />
        <View style={styles.calendarGrid}>
          {days.map((dayObj, index) => {
            const day = dayObj.date;
            const isSelected = currentDate === dayObj.fullDate;
            const tasks = dayObj.isCurrentMonth ? getTasksForDay(dayObj.fullDate) : [];
            // 红色圆圈显示在今天
            const hasRedCircle = dayObj.fullDate === todayString;
            
            // 计算日期位置：对齐到网格交点
            // week字母对齐到第1, 3, 5, 7, 9, 11, 13条竖线
            const GRID_SIZE = 29; // 网格单位大小（与GridBackground保持一致）
            const verticalSpacing = width / 14; // 竖线间距
            const row = Math.floor(index / 7); // 行号（0-4，共5行）
            const col = index % 7; // 列号（0-6）
            // 第1条竖线对应col=0，第3条对应col=1，以此类推
            const lineIndex = 1 + col * 2; // 对齐到第1, 3, 5, 7, 9, 11, 13条竖线
            // 个位数的day向右移动2px（day < 10）
            const leftOffset = day < 10 ? 2 : 0;
            const leftPosition = lineIndex * verticalSpacing + leftOffset;
            const topPosition = row * 5 * GRID_SIZE + 15; // 行间距为5个网格单位，第一个day在第一条横线，向下移动15px

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  {
                    left: leftPosition,
                    top: topPosition,
                  }
                ]}
                onPress={() => handleDatePress(day, dayObj.isCurrentMonth, dayObj.fullDate)}
                disabled={!dayObj.isCurrentMonth}
              >
                {/* 红色圆圈背景（如果有任务） */}
                {hasRedCircle && (
                  <View style={styles.redCircle} />
                )}
                
                {/* 选中状态的红色边框 */}
                {isSelected && (
                  <View style={styles.selectedBorder} />
                )}

                {/* 日期文本 */}
                <Text
                  style={[
                    styles.dayText,
                    { color: dayTextColor },
                    !dayObj.isCurrentMonth && { color: dayTextMutedColor },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* 简略计划（独立于day容器） */}
          {days.map((dayObj, index) => {
            const day = dayObj.date;
            const tasks = dayObj.isCurrentMonth ? getTasksForDay(dayObj.fullDate) : [];
            
            if (tasks.length === 0 || !dayObj.isCurrentMonth) return null;
            
            // 计算简略计划位置：在day的正下方，占两个网格的宽度
            const GRID_SIZE = 29;
            const verticalSpacing = width / 14;
            const row = Math.floor(index / 7);
            const col = index % 7;
            const lineIndex = 1 + col * 2;
            // day的中心位置（dayCell使用transform: translateX: -20，所以中心在leftPosition）
            const dayCenterLeft = lineIndex * verticalSpacing;
            const topPosition = row * 5 * GRID_SIZE + 15 + 40; // day下方（day高度40）
            const tasksWidth = 2 * verticalSpacing; // 两个网格的宽度
            
            return (
              <View
                key={`tasks-${index}`}
                style={[
                  styles.dayTasksContainer,
                  {
                    left: dayCenterLeft,
                    top: topPosition,
                    width: tasksWidth,
                    transform: [{ translateX: -tasksWidth / 2 }], // 居中相对于day中心位置
                  }
                ]}
              >
                {tasks.slice(0, 3).map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.dayTaskTag,
                      {
                        backgroundColor: task.color,
                        width: tasksWidth, // 每个标签占满两个网格单位
                      },
                    ]}
                    onPress={() => {
                      navigation.navigate('AddPlan', {
                        date: dayObj.fullDate,
                        planId: task.id,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dayTaskText} numberOfLines={1}>
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                {tasks.length > 3 && (
                  <Text style={[styles.moreTasksText, { color: dayTextColor }]}>
                    +{tasks.length - 3}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </GHScrollView>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>选择年份</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={generateYears()}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleYearSelect(item)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              initialScrollIndex={generateYears().findIndex((y) => y === year)}
              getItemLayout={(data, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>选择月份</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={monthNames}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    index === month && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      index === month && styles.pickerItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              initialScrollIndex={month}
              getItemLayout={(data, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Side Panel (UserProfile) - Initially hidden at left: -width */}
      <Animated.View
        style={[
          styles.sidePanelContainer,
          {
            transform: [{ translateX: sidePanelTranslateX }],
          },
        ]}
        {...sidePanelPanResponder.panHandlers}
        pointerEvents={sidePanelVisible ? 'auto' : 'none'}
      >
        {sidePanelVisible && <UserProfileScreen />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
  header: {
    backgroundColor: '#FFFFFB',
    paddingTop: 60,
    paddingBottom: 5,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    shadowColor: '#EDEBD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  yearMonthContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  yearText: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  monthText: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  weekDaysContainer: {
    position: 'relative',
    paddingVertical: 10,
    backgroundColor: '#FFFFFB',
    shadowColor: '#EDEBD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    height: 40,
  },
  weekDay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: 0,
    paddingBottom: 10,
    transform: [{ translateX: -8 }], // 将字母中心对齐到竖线（假设字母宽度约16px）
  },
  weekDayText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
  },
  weekDayTextCenter: {
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    position: 'relative',
  },
  calendarGrid: {
    position: 'relative',
    zIndex: 1,
    width: width,
    minHeight: 5 * 5 * 29, // 5行，每行5个网格单位的高度（GRID_SIZE=29）
  },
  dayCell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40, // 固定宽度，确保day在红圈中心
    height: 40, // 固定高度，确保day在红圈中心
    transform: [{ translateX: -20 }], // 将dayCell中心对齐到竖线（宽度40，所以向左偏移20）
  },
  redCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF595C',
    top: 0,
    left: 0,
  },
  selectedBorder: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF595C',
    top: 0,
    left: 0,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    zIndex: 1,
  },
  dayTextGray: {
    color: '#757575',
  },
  dayTasksContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  dayTaskTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTaskText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  moreTasksText: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#FFFFFB',
    borderRadius: 20,
    width: '80%',
    maxWidth: 300,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerModalTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#000000',
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemSelected: {
    backgroundColor: '#E8E8E8',
  },
  pickerItemText: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: '#FF595C',
  },
  sidePanelContainer: {
    position: 'absolute',
    top: 0,
    left: -width, // Start from off-screen left, translateX moves it right
    width: width,
    height: screenHeight,
    zIndex: 9999, // Very high z-index to ensure it's above everything
    backgroundColor: 'transparent',
    overflow: 'hidden',
    elevation: 9999, // Android elevation
  },
});

