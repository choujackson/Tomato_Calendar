import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { usePlan, Plan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';

type AddPlanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddPlan'>;
type AddPlanScreenRouteProp = RouteProp<RootStackParamList, 'AddPlan'>;

const eventColors = ['#DF8788', '#F0CCA0', '#FFF7DA', '#8EB5C1'];

// 格式化日期为 "MMM D, YYYY" 格式
const formatDateDisplay = (date: Date): string => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// 格式化时间为 "HH : MM" 格式
const formatTimeDisplay = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours} : ${minutes}`;
};

// 格式化日期为 YYYY-MM-DD 格式
const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function AddPlanView() {
  const navigation = useNavigation<AddPlanScreenNavigationProp>();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const backgroundColor = isDark ? '#B0B0B0' : '#FFFFFB';
  const pickerBackground = isDark ? '#2C2C2C' : '#FFFFFB';
  const pickerHeaderBorder = isDark ? '#4D4D4D' : '#E0E0E0';
  const pickerButtonColor = isDark ? '#FFFFFF' : '#007AFF';
  const route = useRoute<AddPlanScreenRouteProp>();
  const { date, planId } = route.params;
  const { selectedLocation, setSelectedLocation } = useLocation();
  const { plans, addPlan, updatePlan, deletePlan, fetchPlanById } = usePlan();
  
  const isEditMode = !!planId;
  const existingPlan = planId ? plans.find((p) => p.id === planId) : null;

  // 初始化日期时间
  const initialDate = existingPlan 
    ? new Date(existingPlan.startDate + 'T' + existingPlan.startTime.replace(' : ', ':'))
    : date 
    ? new Date(date + 'T09:00')
    : new Date();
  
  const initialEndDate = existingPlan
    ? new Date(existingPlan.endDate + 'T' + existingPlan.endTime.replace(' : ', ':'))
    : new Date(initialDate.getTime() + 60 * 60 * 1000); // 默认结束时间比开始时间晚1小时

  const [title, setTitle] = useState(existingPlan?.title || '');
  const [location, setLocation] = useState(existingPlan?.location || '');
  const [allDay, setAllDay] = useState(existingPlan?.allDay || false);
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [endTime, setEndTime] = useState(initialEndDate);
  const [repeat, setRepeat] = useState(existingPlan?.repeat || 'Never');
  const [selectedColor, setSelectedColor] = useState(existingPlan?.color || eventColors[0]);
  const [notes, setNotes] = useState(existingPlan?.notes || '');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 日期时间选择器状态
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // 颜色选择器状态
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#FFFFFF');

  // 加载编辑模式的数据
  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title);
      setLocation(existingPlan.location || '');
      setAllDay(existingPlan.allDay);
      setRepeat(existingPlan.repeat);
      setSelectedColor(existingPlan.color);
      setNotes(existingPlan.notes);
    }
  }, [existingPlan]);

  useEffect(() => {
    if (isEditMode && planId && !existingPlan) {
      fetchPlanById(planId);
    }
  }, [isEditMode, planId, existingPlan, fetchPlanById]);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedLocation) {
        setLocation(selectedLocation);
        setSelectedLocation(null);
      }
    }, [selectedLocation, setSelectedLocation])
  );

  const handleLocationPress = () => {
    navigation.navigate('LocationPicker');
  };

  const handleSave = async () => {
    // 检查标题是否为空
    if (!title || title.trim() === '') {
      setErrorMessage('Please enter a title for the plan');
      setShowErrorModal(true);
      return;
    }

    const plan: Plan = {
      id: planId || Date.now().toString(),
      title,
      startTime: formatTimeDisplay(startTime),
      endTime: formatTimeDisplay(endTime),
      startDate: formatDateString(startDate),
      endDate: formatDateString(endDate),
      location: location || undefined,
      color: selectedColor,
      allDay,
      repeat,
      notes,
    };

    try {
      if (isEditMode && planId) {
        const updated = await updatePlan(planId, plan);
        if (!updated) {
          throw new Error('Failed to update plan');
        }
      } else {
        const created = await addPlan(plan);
        if (!created) {
          throw new Error('Failed to create plan');
        }
      }
      navigation.goBack();
    } catch (error) {
      setErrorMessage('Failed to save the plan. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleDelete = () => {
    if (!planId) return;
    Alert.alert('Delete Plan', 'Are you sure you want to delete this plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan(planId);
            navigation.goBack();
          } catch (error) {
            setErrorMessage('Failed to delete the plan. Please try again.');
            setShowErrorModal(true);
          }
        },
      },
    ]);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      // 同时更新开始时间的日期部分
      const newStartTime = new Date(startTime);
      newStartTime.setFullYear(selectedDate.getFullYear());
      newStartTime.setMonth(selectedDate.getMonth());
      newStartTime.setDate(selectedDate.getDate());
      setStartTime(newStartTime);
      if (Platform.OS === 'ios') {
        setShowStartDatePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowStartDatePicker(false);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime) {
      setStartTime(selectedTime);
      // 如果结束时间早于新的开始时间，自动更新结束时间
      if (endTime <= selectedTime) {
        const newEndTime = new Date(selectedTime.getTime() + 60 * 60 * 1000);
        setEndTime(newEndTime);
      }
      if (Platform.OS === 'ios') {
        setShowStartTimePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowStartTimePicker(false);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
      // 同时更新结束时间的日期部分
      const newEndTime = new Date(endTime);
      newEndTime.setFullYear(selectedDate.getFullYear());
      newEndTime.setMonth(selectedDate.getMonth());
      newEndTime.setDate(selectedDate.getDate());
      setEndTime(newEndTime);
      if (Platform.OS === 'ios') {
        setShowEndDatePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowEndDatePicker(false);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      setEndTime(selectedTime);
      if (Platform.OS === 'ios') {
        setShowEndTimePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowEndTimePicker(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setShowColorPicker(false);
  };

  const handleCustomColorPress = () => {
    // 这里可以打开一个更高级的颜色选择器，暂时使用一个简单的实现
    // 生成一些常用颜色选项
    const customColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AED6F1',
    ];
    // 简单实现：循环选择颜色
    const currentIndex = customColors.indexOf(customColor);
    const nextColor = customColors[(currentIndex + 1) % customColors.length];
    setCustomColor(nextColor);
    setSelectedColor(nextColor);
    setShowColorPicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit' : 'New'}</Text>
        <View style={styles.headerActions}>
          {isEditMode && (
            <TouchableOpacity onPress={handleDelete} style={styles.headerIconButton}>
              <Ionicons name="trash-outline" size={22} color="#000000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Information Section */}
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#757575"
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.divider} />
          <TouchableOpacity onPress={handleLocationPress}>
            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor="#757575"
              value={location}
              onChangeText={setLocation}
              editable={false}
              onPressIn={handleLocationPress}
            />
          </TouchableOpacity>
        </View>

        {/* Time Section */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Allday</Text>
            <Switch
              value={allDay}
              onValueChange={setAllDay}
              trackColor={{ false: '#767577', true: '#14AE5C' }}
              thumbColor="#ffffff"
            />
          </View>
          <View style={styles.divider} />
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Starts</Text>
            <View style={styles.timeInputContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateDisplay(startDate)}</Text>
              </TouchableOpacity>
              {!allDay && (
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.timeText}>{formatTimeDisplay(startTime)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Ends</Text>
            <View style={styles.timeInputContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateDisplay(endDate)}</Text>
              </TouchableOpacity>
              {!allDay && (
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.timeText}>{formatTimeDisplay(endTime)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Repeat Section */}
        <View style={styles.section}>
          <View style={styles.repeatRow}>
            <Text style={styles.repeatLabel}>Repeat</Text>
            <TouchableOpacity style={styles.repeatButton}>
              <Text style={styles.repeatText}>{repeat}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Color Section */}
        <View style={styles.section}>
          <Text style={styles.colorLabel}>Color of Event</Text>
          <View style={styles.colorContainer}>
            {eventColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorCircleSelected,
                ]}
                onPress={() => handleColorSelect(color)}
              />
            ))}
            <TouchableOpacity 
              style={styles.colorPickerButton}
              onPress={() => setShowColorPicker(true)}
            >
              <Ionicons name="color-palette-outline" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes</Text>
          <View style={styles.notesInputContainer}>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Add notes..."
              placeholderTextColor="#999999"
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent={true} animationType="fade">
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <Text style={styles.errorModalTitle}>Tips</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.errorModalButton}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date/Time Pickers */}
      {Platform.OS === 'ios' ? (
        <>
          {showStartDatePicker && (
            <Modal visible={showStartDatePicker} transparent={true} animationType="slide">
              <View style={styles.pickerModalContainer}>
                <View style={[styles.pickerModalContent, { backgroundColor: pickerBackground }]}>
                  <View style={[styles.pickerModalHeader, { borderBottomColor: pickerHeaderBorder }]}>
                    <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                      <Text style={[styles.pickerModalButton, { color: pickerButtonColor }]}>完成</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="spinner"
                    onChange={handleStartDateChange}
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.picker}
                  />
                </View>
              </View>
            </Modal>
          )}
          {showStartTimePicker && (
            <Modal visible={showStartTimePicker} transparent={true} animationType="slide">
              <View style={styles.pickerModalContainer}>
                <View style={[styles.pickerModalContent, { backgroundColor: pickerBackground }]}>
                  <View style={[styles.pickerModalHeader, { borderBottomColor: pickerHeaderBorder }]}>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <Text style={[styles.pickerModalButton, { color: pickerButtonColor }]}>完成</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="spinner"
                    onChange={handleStartTimeChange}
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.picker}
                  />
                </View>
              </View>
            </Modal>
          )}
          {showEndDatePicker && (
            <Modal visible={showEndDatePicker} transparent={true} animationType="slide">
              <View style={styles.pickerModalContainer}>
                <View style={[styles.pickerModalContent, { backgroundColor: pickerBackground }]}>
                  <View style={[styles.pickerModalHeader, { borderBottomColor: pickerHeaderBorder }]}>
                    <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                      <Text style={[styles.pickerModalButton, { color: pickerButtonColor }]}>完成</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="spinner"
                    onChange={handleEndDateChange}
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.picker}
                  />
                </View>
              </View>
            </Modal>
          )}
          {showEndTimePicker && (
            <Modal visible={showEndTimePicker} transparent={true} animationType="slide">
              <View style={styles.pickerModalContainer}>
                <View style={[styles.pickerModalContent, { backgroundColor: pickerBackground }]}>
                  <View style={[styles.pickerModalHeader, { borderBottomColor: pickerHeaderBorder }]}>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={[styles.pickerModalButton, { color: pickerButtonColor }]}>完成</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="spinner"
                    onChange={handleEndTimeChange}
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={styles.picker}
                  />
                </View>
              </View>
            </Modal>
          )}
        </>
      ) : (
        <>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </>
      )}

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={styles.colorPickerModal}>
            <Text style={styles.colorPickerTitle}>选择颜色</Text>
            <View style={styles.colorPickerGrid}>
              {eventColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorPickerCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorPickerCircleSelected,
                  ]}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
              <TouchableOpacity
                style={[styles.colorPickerCircle, { backgroundColor: customColor }]}
                onPress={handleCustomColorPress}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.colorPickerCloseButton}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={styles.colorPickerCloseText}>关闭</Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: '#FFFFFB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#EDEBD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#000000',
    marginHorizontal: 29,
    marginTop: 20,
    padding: 13,
  },
  input: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    minHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#757575',
    marginVertical: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#1E1E1E',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 85,
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  timeButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 58,
  },
  timeText: {
    fontSize: 15,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  repeatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repeatText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  chevron: {
    fontSize: 17,
    color: 'rgba(60, 60, 67, 0.6)',
  },
  colorLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#000000',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  colorPickerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  notesContainer: {
    marginHorizontal: 29,
    marginTop: 28,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    overflow: 'hidden',
  },
  notesLabel: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    height: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  notesInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    height: 167,
    position: 'relative',
  },
  notesInput: {
    backgroundColor: 'transparent',
    padding: 15,
    paddingBottom: 50,
    fontSize: 16,
    fontFamily: 'System',
    color: '#000000',
    textAlignVertical: 'top',
    flex: 1,
  },
  saveButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    paddingVertical: 6,
    paddingHorizontal: 18,
    minWidth: 35,
    minHeight: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerModal: {
    backgroundColor: '#FFFFFB',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 300,
  },
  colorPickerTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  colorPickerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPickerCircleSelected: {
    borderWidth: 3,
  },
  colorPickerCloseButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  colorPickerCloseText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerModalButton: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#007AFF',
  },
  picker: {
    height: 200,
  },
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContent: {
    backgroundColor: '#FFFFFB',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  errorModalTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  errorModalMessage: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorModalButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    minWidth: 80,
  },
  errorModalButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    textAlign: 'center',
  },
});
