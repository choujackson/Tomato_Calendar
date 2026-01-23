import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import CheckInScreenContent from './CheckInScreenContent';
import CheckInPlazaScreenContent from './CheckInPlazaScreenContent';
import BottomNavBar from './CheckInBottomNavBar';
import { habitsAPI, plazaAPI } from '../services/api';

const { width } = Dimensions.get('window');

type CheckInContainerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckIn'>;

interface PageData {
  id: string;
  type: 'checkin' | 'plaza';
}

interface WhiteCard {
  id: string;
  title: string;
  flipped?: boolean;
  days?: number;
  isShared?: boolean; // 是否已分享到打卡广场
}

const pages: PageData[] = [
  { id: 'checkin', type: 'checkin' },
  { id: 'plaza', type: 'plaza' },
];

export default function CheckInContainer() {
  const navigation = useNavigation<CheckInContainerNavigationProp>();
  const flatListRef = useRef<FlatList<PageData>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 共享的 My Check in 卡片列表
  const [myCheckInCards, setMyCheckInCards] = useState<WhiteCard[]>([]);
  
  // 广场卡片列表接口（与 CheckInPlazaScreenContent 中的 PlazaCard 匹配）
  interface PlazaCard {
    id: string;
    title: string;
    sponsor: string;
    checkedInCount: number;
    likes: number;
    rating: number;
    comments?: number;
    commentList?: Array<{ id: string; author: string; time: string; content: string }>;
    isSharedByUser?: boolean; // 标记是否是用户自己分享的
    isLikedByMe?: boolean; // 当前用户是否已点赞
    isCheckedInByMe?: boolean; // 当前用户今日是否已打卡
  }
  
  // 广场卡片列表 - 使用 undefined 初始状态，让 CheckInPlazaScreenContent 自己加载
  const [plazaCards, setPlazaCards] = useState<PlazaCard[] | undefined>(undefined);
  
  // 添加卡片到 My Check in（从 Plaza 页面调用，相当于调用 CheckInScreenContent 的 handleCreate 方法）
  const addToMyCheckIn = useCallback((title: string) => {
    const newCard: WhiteCard = {
      id: Date.now().toString(), // 使用时间戳作为唯一ID
      title: title,
      flipped: false,
      days: 0,
    };
    // 直接更新共享的卡片列表，CheckInScreenContent 会自动使用这个列表
    setMyCheckInCards(prev => [...prev, newCard]);
  }, []);
  
  // 分享卡片到打卡广场 - 通过习惯 ID
  const shareToPlaza = useCallback(async (habitId: number) => {
    try {
      await habitsAPI.shareToPlaza(habitId);
      // 分享成功后，更新本地卡片状态，标记为已分享
      setMyCheckInCards((prevCards) => 
        prevCards.map((card) => 
          card.id === habitId.toString() ? { ...card, isShared: true } : card
        )
      );
      // 重新加载广场列表以获取最新数据（包含统计信息）
      const habits = await plazaAPI.getHabits();
      const enrichedHabits = await Promise.all(habits.map(async (habit: any) => {
        // 获取评论列表
        let commentList: Array<{ id: string; author: string; time: string; content: string }> = [];
        try {
          const comments = await plazaAPI.getComments(habit.id);
          commentList = comments.map((comment: any, index: number) => ({
            id: comment.id?.toString() || index.toString(),
            author: comment.author?.username || comment.user?.username || 'Anonymous',
            content: comment.content || '',
            time: comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now',
          }));
        } catch (error) {
          console.error('加载评论失败:', error);
        }

        return {
          id: habit.id.toString(),
          title: habit.title || habit.name || '',
          sponsor: habit.creator?.username || 'Unknown',
          checkedInCount: habit.todayCheckInCount || 0,
          likes: habit.likesCount || habit.likes || 0, // 尝试多个字段名
          rating: 0,
          comments: habit.commentsCount || commentList.length || 0, // 如果后端没有返回，使用评论列表长度
          commentList,
          isSharedByUser: habit.isSharedByUser || false, // 从 API 获取是否为当前用户发布
          isLikedByMe: habit.isLikedByMe || false,
          isCheckedInByMe: habit.isCheckedInByMe || habit.hasCheckedInToday || false, // 从 API 获取今日是否已打卡
        };
      }));
      setPlazaCards(enrichedHabits);
    } catch (error: any) {
      console.error('分享到广场失败:', error);
      // 可以在这里显示错误提示
    }
  }, []);

  // 滑动结束处理
  const handleMomentumEnd = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  }, []);

  // 点击导航栏切换页面
  const handleNavPress = useCallback((index: number) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    }
  }, [currentIndex]);

  // 渲染页面
  const renderPage = useCallback(({ item }: { item: PageData }) => {
    if (item.type === 'checkin') {
      return <CheckInScreenContent navigation={navigation} myCheckInCards={myCheckInCards} setMyCheckInCards={setMyCheckInCards} onShareToPlaza={shareToPlaza} />;
    } else {
      return <CheckInPlazaScreenContent navigation={navigation} onAddToMyCheckIn={addToMyCheckIn} plazaCards={plazaCards} onPlazaCardsUpdate={setPlazaCards} />;
    }
  }, [navigation, myCheckInCards, addToMyCheckIn, shareToPlaza, plazaCards]);

  return (
    <View style={styles.container}>
      {/* 横向滑动页面 */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
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
        initialScrollIndex={0}
        removeClippedSubviews={true}
        scrollEnabled={true}
      />

      {/* 底部导航栏 - 固定位置 */}
      <BottomNavBar
        currentIndex={currentIndex}
        onNavPress={handleNavPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
});

