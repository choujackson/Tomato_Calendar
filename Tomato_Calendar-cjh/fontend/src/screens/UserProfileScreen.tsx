import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Animated, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Line, Polyline, SvgXml, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../App';
import GridBackground from '../components/GridBackground';
import { useTheme } from '../context/ThemeContext';
import { focusAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

type UserProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

// Menu Icon SVG from assets
const menuIconSvg = `<svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<line x1="1" y1="8.5" x2="18" y2="8.5" stroke="black" stroke-width="2" stroke-linecap="round"/>
<line x1="1" y1="1" x2="18" y2="1" stroke="black" stroke-width="2" stroke-linecap="round"/>
<line x1="1" y1="16" x2="18" y2="16" stroke="black" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const pad2 = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const normalizeDateKey = (value?: string) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateKey(parsed);
};

const getDurationMinutes = (item: any) => {
  const candidates = [
    item?.duration,
    item?.minutes,
    item?.focusMinutes,
    item?.durationMinutes,
    item?.totalMinutes,
  ];
  const direct = candidates.find((value) => typeof value === 'number' && Number.isFinite(value));
  if (typeof direct === 'number') {
    return direct;
  }

  const start = item?.startTime || item?.startedAt;
  const end = item?.endTime || item?.finishedAt;
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return Math.round(diff / 60000);
};


export default function UserProfileScreen() {
  const navigation = useNavigation<UserProfileScreenNavigationProp>();
  const scale = width / 393;
  
  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(width)).current;

  const {
    darkModeEnabled,
    automaticEnabled,
    followSystemEnabled,
    effectiveTheme,
    setDarkModeEnabled,
    setAutomaticEnabled,
    setFollowSystemEnabled,
  } = useTheme();

  const isDark = effectiveTheme === 'dark';
  const colors = {
    background: isDark ? '#B0B0B0' : '#FFFFFB',
    surface: isDark ? '#C2C2C2' : '#FFF7DA',
    card: isDark ? '#D6D6D6' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    muted: isDark ? '#FFFFFF' : '#666666',
    divider: isDark ? '#A8A8A8' : '#E0E0E0',
    sidebar: isDark ? '#C2C2C2' : '#FFFFFF',
  };

  const [focusTotalCount, setFocusTotalCount] = useState(0);
  const [focusTotalMinutes, setFocusTotalMinutes] = useState(0);
  const [dailyFocusData, setDailyFocusData] = useState<
    { date: string; label: string; minutes: number }[]
  >([]);

  // PanResponder removed - gestures are now handled by CalendarView's sidePanelPanResponder
  // Left swipe will close the side panel, returning to Calendar view

  // Open sidebar
  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(sidebarTranslateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close sidebar
  const closeSidebar = () => {
    Animated.timing(sidebarTranslateX, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear stored authentication data
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      
      // Close sidebar
      closeSidebar();
      
      // Navigate to login screen and reset navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const buildRecentDays = useCallback((dailyMap: Map<string, number>) => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - idx));
      const key = toDateKey(date);
      return {
        date: key,
        label: pad2(date.getDate()),
        minutes: Math.round(dailyMap.get(key) ?? 0),
      };
    });
  }, []);

  const fetchFocusStats = useCallback(async () => {
    try {
      const [stats, historyRaw] = await Promise.all([
        focusAPI.getStats(),
        focusAPI.getHistory(),
      ]);

      const historyList = Array.isArray(historyRaw)
        ? historyRaw
        : Array.isArray(historyRaw?.data)
        ? historyRaw.data
        : [];

      const dailyMap = new Map<string, number>();
      let historyMinutesTotal = 0;

      historyList.forEach((item: any) => {
        const minutes = getDurationMinutes(item);
        if (typeof minutes === 'number' && Number.isFinite(minutes)) {
          historyMinutesTotal += minutes;
        }

        const dateKey =
          normalizeDateKey(item?.date) ||
          normalizeDateKey(item?.day) ||
          normalizeDateKey(item?.finishedAt) ||
          normalizeDateKey(item?.createdAt) ||
          normalizeDateKey(item?.endTime) ||
          normalizeDateKey(item?.startTime);

        if (dateKey && typeof minutes === 'number' && Number.isFinite(minutes)) {
          dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + minutes);
        }
      });

      const totalCount =
        typeof stats?.totalCount === 'number'
          ? stats.totalCount
          : historyList.length;

      const totalMinutes =
        typeof stats?.totalMinutes === 'number'
          ? stats.totalMinutes
          : typeof stats?.totalDuration === 'number'
          ? stats.totalDuration
          : typeof stats?.totalFocusMinutes === 'number'
          ? stats.totalFocusMinutes
          : historyMinutesTotal;

      setFocusTotalCount(Number.isFinite(totalCount) ? totalCount : 0);
      setFocusTotalMinutes(Number.isFinite(totalMinutes) ? Math.round(totalMinutes) : 0);
      setDailyFocusData(buildRecentDays(dailyMap));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load focus stats', error);
      }
      setFocusTotalCount(0);
      setFocusTotalMinutes(0);
      setDailyFocusData(buildRecentDays(new Map()));
    }
  }, [buildRecentDays]);

  useEffect(() => {
    fetchFocusStats();
  }, [fetchFocusStats]);

  useEffect(() => {
    if (sidebarVisible) {
      fetchFocusStats();
    }
  }, [sidebarVisible, fetchFocusStats]);

  const chartData = useMemo(() => {
    if (dailyFocusData.length > 0) {
      return dailyFocusData;
    }
    return buildRecentDays(new Map());
  }, [dailyFocusData, buildRecentDays]);

  const chartWidth = width - 60 * scale;
  const chartHeight = 200 * scale;
  const chartPadding = 24 * scale;
  const maxMinutes = Math.max(10, ...chartData.map((item) => item.minutes));
  const linePoints = chartData
    .map((item, index) => {
      const x =
        chartPadding +
        ((chartWidth - chartPadding * 2) * index) / Math.max(1, chartData.length - 1);
      const y =
        chartPadding +
        (chartHeight - chartPadding * 2) * (1 - item.minutes / maxMinutes);
      return { x, y };
    });
  const polylinePoints = linePoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground theme={effectiveTheme} />
      
      {/* Menu Icon - Fixed at top right */}
      <TouchableOpacity
        style={[styles.menuIconButton, {
          top: 60 * scale,
          right: 20 * scale,
        }]}
        onPress={openSidebar}
        activeOpacity={0.7}
      >
        <SvgXml xml={menuIconSvg} width={19 * scale} height={17 * scale} />
      </TouchableOpacity>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section - White grid background */}
        <View style={styles.profileSection}>
          {/* Profile Photo - Yellow Circle */}
          <View style={[styles.avatarCircle, {
            width: 153 * scale * 0.75,
            height: 153 * scale * 0.75,
            borderRadius: (153 * scale * 0.75) / 2,
            marginTop: 120 * scale ,
          }]} />

          {/* User Name */}
          <Text style={[styles.userName, {
            fontSize: 20 * scale * 2,
            marginTop: 20 * scale,
            fontWeight: '700',
          }, { color: colors.text }]}>User Name</Text>

          {/* Signature */}
          <Text style={[styles.signature, {
            fontSize: 14 * scale,
            marginTop: 8 * scale,
          }, { color: colors.muted }]}>This is a personalized signature.</Text>
        </View>

        {/* Statistics and Diary Section - Light yellow background with top border radius */}
        <View style={[styles.yellowSection, {
          marginTop: 20 * scale,
          borderTopLeftRadius: 30 * scale,
          borderTopRightRadius: 30 * scale,
          paddingTop: 20 * scale,
          paddingHorizontal: 30 * scale,
          backgroundColor: colors.surface,
        }]}>
          {/* Statistics Section */}
          <View style={styles.statsContainer}>
            {/* Left Stat */}
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { fontSize: 32 * scale, color: colors.text }]}>
                {focusTotalCount}
              </Text>
              <Text style={[styles.statLabel, { fontSize: 12 * scale, color: colors.text }]}>
                Finished tomatoes
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { height: 60 * scale, backgroundColor: colors.divider }]} />

            {/* Right Stat */}
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { fontSize: 32 * scale, color: colors.text }]}>
                {focusTotalMinutes}
              </Text>
              <Text style={[styles.statLabel, { fontSize: 12 * scale, color: colors.text }]}>
                Total tomato minutes
              </Text>
            </View>
          </View>

          {/* Horizontal Line */}
          <View style={[styles.horizontalLine, { marginTop: 15 * scale, backgroundColor: colors.divider }]} />

          {/* Focus Line Chart */}
          <View style={[styles.chartWrapper, { paddingTop: 20 * scale, paddingBottom: 40 * scale }]}>
            <View
              style={[
                styles.chartContainer,
                {
                  width: chartWidth,
                  height: chartHeight,
                  backgroundColor: colors.card,
                  borderColor: colors.divider,
                },
              ]}
            >
              <Svg width={chartWidth} height={chartHeight}>
                <Line
                  x1={chartPadding}
                  y1={chartPadding}
                  x2={chartPadding}
                  y2={chartHeight - chartPadding}
                  stroke={colors.text}
                  strokeWidth={1}
                />
                <Line
                  x1={chartPadding}
                  y1={chartHeight - chartPadding}
                  x2={chartWidth - chartPadding}
                  y2={chartHeight - chartPadding}
                  stroke={colors.text}
                  strokeWidth={1}
                />
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke={colors.text}
                  strokeWidth={2}
                />
                {linePoints.map((point, index) => (
                  <Circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={2.5}
                    fill={colors.text}
                  />
                ))}
                <SvgText
                  x={chartPadding - 6}
                  y={chartPadding + 4}
                  fill={colors.text}
                  fontSize={10 * scale}
                  textAnchor="end"
                >
                  {Math.round(maxMinutes)}
                </SvgText>
                <SvgText
                  x={chartPadding - 6}
                  y={chartHeight - chartPadding + 4}
                  fill={colors.text}
                  fontSize={10 * scale}
                  textAnchor="end"
                >
                  0
                </SvgText>
                <SvgText
                  x={chartPadding - 6}
                  y={chartPadding - 6}
                  fill={colors.text}
                  fontSize={10 * scale}
                  textAnchor="end"
                >
                  min
                </SvgText>
                <SvgText
                  x={chartWidth - chartPadding}
                  y={chartHeight - 6}
                  fill={colors.text}
                  fontSize={10 * scale}
                  textAnchor="end"
                >
                  day
                </SvgText>
              </Svg>
            </View>
            <View style={[styles.chartLabels, { width: chartWidth }]}>
              {chartData.map((item) => (
                <Text
                  key={item.date}
                  style={[
                    styles.chartLabelText,
                    { color: colors.text, width: chartWidth / chartData.length },
                  ]}
                >
                  {item.label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeSidebar}
        />
      )}

      {/* Sidebar - Slides in from right */}
      {sidebarVisible && (
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: width * 0.75 * 0.8,
              transform: [{ translateX: sidebarTranslateX }],
              backgroundColor: colors.sidebar,
            },
          ]}
        >
          <View style={styles.sidebarContainer}>
            <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {/* Sidebar header */}
            <View style={[styles.sidebarHeader, { paddingTop: 60 * scale }]}>
              <TouchableOpacity onPress={closeSidebar} style={styles.arrowButton}>
                <Ionicons name="chevron-forward" size={24 * scale} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Sidebar menu items */}
            <View style={[styles.sidebarMenu, { marginTop: 0 }]}>
              {/* Settings */}
              <TouchableOpacity style={styles.menuItemContainer}>
                <View style={styles.menuItemRow}>
                  <Ionicons name="settings-outline" size={20 * scale} color="#000000" />
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>Settings</Text>
                </View>
              </TouchableOpacity>
              
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />

              {/* Dark Mode Section */}
              <View style={styles.menuItemContainer}>
                <View style={styles.menuItemRow}>
                  <Ionicons name="moon-outline" size={20 * scale} color="#000000" />
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>Dark Mode</Text>
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={setDarkModeEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#71D1EE' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Automatic - Indented */}
              <View style={[styles.menuItemContainer, { paddingLeft: 40 * scale }]}>
                <View style={styles.menuItemRow}>
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>Automatic</Text>
                  <Switch
                    value={automaticEnabled}
                    onValueChange={setAutomaticEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#71D1EE' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Follow system - Indented */}
              <View style={[styles.menuItemContainer, { paddingLeft: 40 * scale }]}>
                <View style={styles.menuItemRow}>
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>Follow system</Text>
                  <Switch
                    value={followSystemEnabled}
                    onValueChange={setFollowSystemEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#71D1EE' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />

              {/* Language */}
              <TouchableOpacity style={styles.menuItemContainer}>
                <View style={styles.menuItemRow}>
                  <Ionicons name="globe-outline" size={20 * scale} color="#000000" />
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>Language</Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />

              {/* About Us */}
              <TouchableOpacity style={styles.menuItemContainer}>
                <View style={styles.menuItemRow}>
                  <Ionicons name="information-circle-outline" size={20 * scale} color="#000000" />
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>About Us</Text>
                </View>
              </TouchableOpacity>
            </View>
            </ScrollView>

            {/* Log Out - Fixed at bottom */}
            <View style={styles.logoutContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              <TouchableOpacity style={styles.menuItemContainer} onPress={handleLogout}>
                <View style={styles.menuItemRow}>
                  <Ionicons name="log-out-outline" size={20 * scale} color="#000000" />
                  <Text style={[styles.menuItemText, { fontSize: 16 * scale, color: colors.text }]}>Log Out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  avatarCircle: {
    backgroundColor: '#FFD9AA',
  },
  userName: {
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  signature: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  yellowSection: {
    backgroundColor: '#FFF7DA',
    width: width,
    minHeight: height,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
  },
  statUnit: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#666666',
    marginTop: 4,
  },
  statLabel: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  horizontalLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  diaryGrid: {
    alignItems: 'center',
    width: '100%',
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartLabelText: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '400',
  },
  diaryRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
    width: width - 60,
    alignSelf: 'center',
  },
  diaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
  },
  diaryImagePlaceholder: {
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryTitle: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  menuIconButton: {
    position: 'absolute',
    zIndex: 100,
    padding: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 200,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 300,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  sidebarContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  sidebarContent: {
    flex: 1,
  },
  logoutContainer: {
    paddingBottom: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  arrowButton: {
    padding: 8,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 0,
  },
  menuItemContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
});
