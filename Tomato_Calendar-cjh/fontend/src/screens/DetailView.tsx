import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import GridBackground from '../components/GridBackground';
import { usePlan } from '../context/PlanContext';
import { useDateContext } from '../context/DateContext';
import { getTodayString } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

type DetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

const { width } = Dimensions.get('window');

interface DayPageData {
  date: string; // YYYY-MM-DD
}

/* ---------- 日期工具 ---------- */
const getPreviousDay = (currentDate: string): string => {
  const [y, m, d] = currentDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextDay = (currentDate: string): string => {
  const [y, m, d] = currentDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialPages = (date: string): DayPageData[] => [
  { date: getPreviousDay(date) },
  { date },
  { date: getNextDay(date) },
];

export default function DetailView() {
  const navigation = useNavigation<DetailScreenNavigationProp>();
  const { effectiveTheme } = useTheme();
  const backgroundColor = effectiveTheme === 'dark' ? '#B0B0B0' : '#FFFFFB';
  const route = useRoute<DetailScreenRouteProp>();
  const initialDate = route.params.date;
  
  const { getPlansForDate, fetchPlansInRange } = usePlan();
  const { currentDate, setCurrentDate } = useDateContext();
  // 使用 Map 存储每个日期的日记内容（使用状态以便触发重新渲染）
  const [diaryTexts, setDiaryTexts] = useState<Map<string, string>>(new Map());
  const flatListRef = useRef<FlatList<DayPageData>>(null);
  
  // 使用全局 currentDate 或路由参数作为显示日期
  const displayDate = currentDate || initialDate;
  const pagesRef = useRef<DayPageData[]>(getInitialPages(displayDate));
  const [pages, setPages] = useState<DayPageData[]>(pagesRef.current);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);

  // 当路由参数变化时更新当前日期（仅当从外部导航进入时）
  useEffect(() => {
    const routeDate = route.params.date;
    // 如果路由日期与当前显示的中间页面日期不同，需要更新（只响应路由参数变化，不响应内部滑动）
    if (routeDate !== pagesRef.current[1]?.date) {
      const newPages = getInitialPages(routeDate);
      pagesRef.current = newPages;
      setCurrentDate(routeDate);
      setPages(newPages);
      // 使用双重 requestAnimationFrame 确保 FlatList 已经重新渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({ index: 1, animated: false });
        });
      });
    }
    // 注意：移除了 else if，避免内部滑动切换时被重置
  }, [route.params.date, setCurrentDate]);

  useEffect(() => {
    const targetDate = currentDate || initialDate;
    if (!targetDate) return;
    let isActive = true;
    setLoadingDate(targetDate);
    setIsPlansLoading(true);
    fetchPlansInRange(targetDate, targetDate)
      .catch(() => null)
      .finally(() => {
        if (isActive) {
          setIsPlansLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [currentDate, initialDate, fetchPlansInRange]);

  // 根据日期计算一周的数据
  const getWeekData = useCallback((dateString: string) => {
    const [dateYear, dateMonth, dateDay] = dateString.split('-').map(Number);
    const dateObj = new Date(dateYear, dateMonth - 1, dateDay);
    const selectedDay = dateDay;
    const selectedDayOfWeek = dateObj.getDay();
    const selectedMonth = dateMonth - 1;
    const selectedYear = dateYear;

    const formatDateString = (year: number, month: number, day: number) => {
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const weekDays_data = [];
    for (let i = 0; i < 7; i++) {
      const dayOffset = i - selectedDayOfWeek;
      const weekDate = new Date(selectedYear, selectedMonth, selectedDay + dayOffset);
      const weekYear = weekDate.getFullYear();
      const weekMonth = weekDate.getMonth();
      const weekDay = weekDate.getDate();
      weekDays_data.push({
        date: weekDay,
        fullDate: formatDateString(weekYear, weekMonth, weekDay),
        isCurrentMonth: weekMonth === selectedMonth,
      });
    }
    return weekDays_data;
  }, []);

  /* 滑动结束（唯一的核心逻辑） */
  const handleMomentumEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      
      if (index === 1) return;

      const currentPages = pagesRef.current;
      let newCurrent: string;
      let newPages: DayPageData[];

      if (index === 0) {
        // 滑动到了前一天（左滑）
        newCurrent = currentPages[0].date;
        newPages = [
          { date: getPreviousDay(newCurrent) },
          { date: newCurrent },
          { date: currentPages[1].date },
        ];
      } else if (index === 2) {
        // 滑动到了后一天（右滑）
        newCurrent = currentPages[2].date;
        newPages = [
          { date: currentPages[1].date },
          { date: newCurrent },
          { date: getNextDay(newCurrent) },
        ];
      } else {
        return;
      }

      pagesRef.current = newPages;
      // 先更新 pagesRef，这样 renderPage 可以使用最新的数据
      // 然后批量更新状态，减少重新渲染次数
      setPages(newPages);
      setCurrentDate(newCurrent); // 更新全局日期状态
      
      // 在下一个事件循环中重置滚动位置，确保状态更新已完成
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: 1,
          animated: false,
        });
      }, 0);
    },
    [setCurrentDate]
  );

  // 渲染单个日期页面内容
  const renderPage = useCallback(({ item }: { item: DayPageData }) => {
    const itemDate = item.date;
    // 使用 pagesRef 来获取当前选中的日期，避免依赖 currentDate 导致频繁重新渲染
    const activeSelectedDate = pagesRef.current[1]?.date || currentDate || route.params.date;
    const isCurrent = itemDate === activeSelectedDate;

    const normalizedDate = itemDate;
    const plans = getPlansForDate(itemDate);
    const weekDays_data = getWeekData(itemDate);
    const todayString = getTodayString();

    return (
      <View style={styles.pageContainer}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={isCurrent}
          bounces={true}
        >
          <GridBackground />
          
          {/* Week Row */}
          <View style={styles.weekRowContainer}>
            {weekDays_data.map((dayObj, index) => {
              const day = dayObj.date;
              const dayFullDate = dayObj.fullDate;
              // 使用全局 currentDate 判断选中状态，而不是当前页面的 normalizedDate
              const isSelected = dayFullDate === activeSelectedDate;
              const hasRedCircle = dayFullDate === todayString;
              
              const verticalSpacing = width / 14;
              const col = index;
              const lineIndex = 1 + col * 2;
              const leftOffset = day < 10 ? 2 : 0;
              const leftPosition = lineIndex * verticalSpacing + leftOffset;
              
              const handleDayPress = () => {
                if (isCurrent && dayFullDate !== activeSelectedDate) {
                  // 只有点击的不是当前选中的日期时才导航
                  navigation.navigate('Detail', { date: dayFullDate });
                }
              };
              
              return (
                <TouchableOpacity
                  key={dayFullDate}
                  style={[styles.dayCell, { left: leftPosition, top: 15 }]}
                  onPress={handleDayPress}
                  disabled={!dayObj.isCurrentMonth || !isCurrent}
                >
                  {hasRedCircle && <View style={styles.redCircle} />}
                  {isSelected && <View style={styles.selectedBorder} />}
                  <Text style={[styles.dayText, !dayObj.isCurrentMonth && styles.dayTextGray]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Tasks List */}
          <View style={styles.tasksContainer}>
            {isPlansLoading && loadingDate === itemDate ? (
              <View style={styles.noTasksContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={styles.noTasksText}>Loading plans...</Text>
              </View>
            ) : plans.length === 0 ? (
              <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksText}>No plans for this day</Text>
              </View>
            ) : (
              plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.taskCard, { backgroundColor: plan.color }]}
                  onPress={() => {
                    if (isCurrent) {
                      navigation.navigate('AddPlan', { date: plan.startDate, planId: plan.id });
                    }
                  }}
                  disabled={!isCurrent}
                >
                  <Text style={styles.taskTitle}>{plan.title}</Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{plan.startTime}</Text>
                    <Text style={styles.timeText}>{plan.endTime}</Text>
                  </View>
                  {plan.location && (
                    <View style={styles.locationContainer}>
                      <Ionicons name="location-outline" size={14} color="#666666" />
                      <Text style={styles.locationText}>{plan.location}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Diary Section - 所有页面都显示，但只在当前页面可编辑 */}
          <View style={styles.diarySection}>
            <View style={styles.diaryHeader}>
              <Text style={styles.diaryTitle}>Notes/Diary</Text>
              <Ionicons name="create-outline" size={16} color="#000000" />
            </View>
            <TextInput
              style={styles.diaryInput}
              multiline
              placeholder="Write your diary here..."
              value={diaryTexts.get(itemDate) || ''}
              onChangeText={(text) => {
                // 更新对应日期的日记内容
                const newDiaryTexts = new Map(diaryTexts);
                newDiaryTexts.set(itemDate, text);
                setDiaryTexts(newDiaryTexts);
              }}
              editable={isCurrent}
              placeholderTextColor="#999999"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            disabled={!isCurrent}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }, [navigation, getPlansForDate, getWeekData, diaryTexts, isPlansLoading, loadingDate]);

  // 根据当前日期计算header显示的年份和月份
  const activeDate = currentDate || displayDate;
  const [dateYear, dateMonth, dateDay] = activeDate.split('-').map(Number);
  const dateObj = new Date(dateYear, dateMonth - 1, dateDay);
  const year = dateObj.getFullYear();
  const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <View style={styles.yearMonthContainer}>
          <View style={styles.yearRow}>
            <Text style={styles.yearText}>{year}</Text>
            <Ionicons name="chevron-down" size={16} color="#000000" />
          </View>
          <View style={styles.monthRow}>
            <Text style={styles.monthText}>{monthName}</Text>
            <Ionicons name="chevron-down" size={16} color="#000000" />
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddPlan', { date: activeDate })} 
          style={styles.addButtonContainer}
        >
          <Ionicons name="add" size={26} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Fixed Week Days */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => {
          const verticalSpacing = width / 14;
          const lineIndex = 1 + index * 2;
          const linePosition = lineIndex * verticalSpacing + 2;
          return (
            <View key={index} style={[styles.weekDay, { left: linePosition }]}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          );
        })}
      </View>

      {/* Scrollable Content - 横向分页滑动 */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.date}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        decelerationRate="normal"
        initialScrollIndex={1}
        removeClippedSubviews={true}
        style={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
  flatListContent: {
    flex: 1,
  },
  pageContainer: {
    width: width,
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFB',
    paddingTop: 60,
    paddingBottom: 5,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    shadowColor: '#EDEBD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonContainer: {
    width: 50,
  },
  backButton: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
  },
  yearMonthContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
  addButtonContainer: {
    width: 50,
    alignItems: 'flex-end',
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
    transform: [{ translateX: -8 }],
  },
  weekDayText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    position: 'relative',
    paddingTop: 0,
  },
  weekRowContainer: {
    position: 'relative',
    width: width,
    height: 40 + 15,
    zIndex: 1,
    marginBottom: 5,
  },
  dayCell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    transform: [{ translateX: -20 }],
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
  tasksContainer: {
    paddingHorizontal: 29,
    paddingTop: 0,
    gap: 14,
    position: 'relative',
    zIndex: 1,
  },
  noTasksContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#757575',
  },
  taskCard: {
    borderRadius: 15,
    padding: 13,
    minHeight: 70,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
  },
  timeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#666666',
  },
  diarySection: {
    marginHorizontal: 29,
    marginTop: 30,
    marginBottom: 20,
  },
  diaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  diaryTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  diaryInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 15,
    minHeight: 167,
    fontSize: 16,
    fontFamily: 'System',
    color: '#000000',
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
    marginRight: 29,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
  },
});
