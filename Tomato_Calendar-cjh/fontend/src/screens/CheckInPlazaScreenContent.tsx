import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Animated, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../App';
import GridBackground from '../components/GridBackground';
import { plazaAPI } from '../services/api';

// Comment Icon SVG from file
const commentIconSvgFromFile = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.00004 9.33325H12V7.99992H4.00004V9.33325ZM4.00004 7.33325H12V5.99992H4.00004V7.33325ZM4.00004 5.33325H12V3.99992H4.00004V5.33325ZM2.66671 11.9999C2.30004 11.9999 1.98615 11.8694 1.72504 11.6083C1.46393 11.3471 1.33337 11.0333 1.33337 10.6666V2.66659C1.33337 2.29992 1.46393 1.98603 1.72504 1.72492C1.98615 1.46381 2.30004 1.33325 2.66671 1.33325H13.3334C13.7 1.33325 14.0139 1.46381 14.275 1.72492C14.5362 1.98603 14.6667 2.29992 14.6667 2.66659V14.6666L12 11.9999H2.66671Z" fill="#1D1B20"/>
</svg>`;

const { width } = Dimensions.get('window');

type CheckInPlazaScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckIn'>;

// Heart Icon SVG (未点赞 - 白色填充)
const heartIconSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.94 2C13.94 2 12.03 1.33 10.67 2.67C9.31 1.33 7.4 2 7.4 2C6.04 3.36 6.04 5.27 7.4 6.63L10.67 9.9L13.94 6.63C15.3 5.27 15.3 3.36 13.94 2Z" fill="#FFFFFF" stroke="#1E1E1E" stroke-width="1.6"/>
</svg>`;

// Heart Icon SVG (已点赞 - 红色填充)
const heartIconSvgFilled = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.94 2C13.94 2 12.03 1.33 10.67 2.67C9.31 1.33 7.4 2 7.4 2C6.04 3.36 6.04 5.27 7.4 6.63L10.67 9.9L13.94 6.63C15.3 5.27 15.3 3.36 13.94 2Z" fill="#FF0000" stroke="#FF0000" stroke-width="1.6"/>
</svg>`;

// Star Icon SVG
const starIconSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 1.33333L9.77 6.88L15.3333 7.33333L11.05 10.62L12.3333 16L8 13.06L3.66667 16L4.95 10.62L0.666668 7.33333L6.23 6.88L8 1.33333Z" stroke="#1E1E1E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Copy Icon SVG
const copyIconSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6667 1.33334H4.66667C3.93334 1.33334 3.33334 1.93334 3.33334 2.66667V10.6667C3.33334 11.4 3.93334 12 4.66667 12H12.6667C13.4 12 14 11.4 14 10.6667V2.66667C14 1.93334 13.4 1.33334 12.6667 1.33334Z" stroke="#1E1E1E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2 5.33334H1.33333C0.966667 5.33334 0.666667 5.63334 0.666667 6V13.3333C0.666667 13.7 0.966667 14 1.33333 14H8.66667C9.03333 14 9.33333 13.7 9.33333 13.3333V12.6667" stroke="#1E1E1E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Comment Icon SVG
const commentIconSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 2H14V12H4L2 14V2Z" stroke="#1D1B20" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface Comment {
  id: string;
  author: string;
  content: string;
  time: string;
}

interface PlazaCard {
  id: string;
  title: string;
  sponsor: string;
  checkedInCount: number;
  likes: number;
  rating: number;
  comments?: number;
  commentList?: Comment[];
  isSharedByUser?: boolean; // 标记是否是用户自己分享的
  isLikedByMe?: boolean; // 当前用户是否已点赞
  isCheckedInByMe?: boolean; // 当前用户今日是否已打卡
}

interface CheckInPlazaScreenContentProps {
  navigation?: CheckInPlazaScreenNavigationProp;
  onAddToMyCheckIn?: (title: string) => void;
  plazaCards?: PlazaCard[]; // 从外部传入的广场卡片列表
  onPlazaCardsUpdate?: (cards: PlazaCard[]) => void; // 更新广场卡片列表的回调
}

export default function CheckInPlazaScreenContent({ navigation: propNavigation, onAddToMyCheckIn, plazaCards: externalPlazaCards, onPlazaCardsUpdate }: CheckInPlazaScreenContentProps = {}) {
  const defaultNavigation = useNavigation<CheckInPlazaScreenNavigationProp>();
  const navigation = propNavigation || defaultNavigation;
  const scale = width / 393;
  
  // 跟踪哪些卡片已被 check in（仅用于按钮状态显示）
  const [checkedInCards, setCheckedInCards] = useState<Set<string>>(new Set());
  
  // 跟踪哪些卡片已被添加到 My Check in
  const [addedToMyCheckInCards, setAddedToMyCheckInCards] = useState<Set<string>>(new Set());
  
  // Toast 提示相关状态
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // 卡片展开状态
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  // 卡片高度动画
  const cardHeights = useRef<{ [key: string]: Animated.Value }>({});
  // 评论输入框文本
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  // 用户名展开状态（用于显示完整用户名）
  const [expandedUsernames, setExpandedUsernames] = useState<Set<string>>(new Set());
  // 本地广场卡片列表（如果外部未传入，则从 API 获取）
  const [localPlazaCards, setLocalPlazaCards] = useState<PlazaCard[]>([]);
  const [loading, setLoading] = useState(false);

  // 使用传入的 plazaCards，如果没有则使用本地状态（从 API 获取）
  // 注意：如果 externalPlazaCards 是空数组，则使用 localPlazaCards（允许加载数据）
  const plazaCards = (externalPlazaCards && externalPlazaCards.length > 0) ? externalPlazaCards : localPlazaCards;

  // 加载广场卡片列表
  const loadPlazaCards = async () => {
    try {
      setLoading(true);
      const habits = await plazaAPI.getHabits();
      // 将 API 数据转换为 PlazaCard 格式
      const cards: PlazaCard[] = await Promise.all(habits.map(async (habit: any) => {
        // 获取评论列表
        let commentList: Comment[] = [];
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
          rating: 0, // API 中没有 rating
          comments: habit.commentsCount || commentList.length || 0, // 如果后端没有返回，使用评论列表长度
          commentList,
          isSharedByUser: habit.isSharedByUser || false, // 从 API 获取是否为当前用户发布
          isLikedByMe: habit.isLikedByMe || false, // 从 API 获取点赞状态
          isCheckedInByMe: habit.isCheckedInByMe || habit.hasCheckedInToday || false, // 从 API 获取今日是否已打卡
        };
      }));
      setLocalPlazaCards(cards);
    } catch (error: any) {
      console.error('加载广场卡片列表失败:', error);
      if (error.response?.status !== 401) {
        Alert.alert('错误', '加载广场卡片列表失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 删除广场卡片
  const handleDeleteCard = async (cardId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这张卡片吗？删除后将无法恢复。',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await plazaAPI.deleteHabit(parseInt(cardId));
              
              // 更新卡片列表
              if (externalPlazaCards && onPlazaCardsUpdate) {
                // 如果是外部状态，通过回调更新
                const updatedCards = externalPlazaCards.filter(card => card.id !== cardId);
                onPlazaCardsUpdate(updatedCards);
              } else {
                // 如果是本地状态，直接更新
                setLocalPlazaCards(prev => prev.filter(card => card.id !== cardId));
              }
              
              Alert.alert('提示', '删除成功');
            } catch (error: any) {
              const errorMessage = error.response?.data?.message || '删除失败，请稍后重试';
              Alert.alert('提示', errorMessage);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    // 如果外部传入的 plazaCards 为空数组或 undefined，则加载数据
    if (!externalPlazaCards || externalPlazaCards.length === 0) {
      loadPlazaCards();
    }
  }, [externalPlazaCards]);

  // 同步 check-in 状态：当 plazaCards 更新时，从卡片数据中恢复 check-in 状态
  useEffect(() => {
    if (plazaCards && plazaCards.length > 0) {
      const checkedInSet = new Set<string>();
      plazaCards.forEach(card => {
        if (card.isCheckedInByMe) {
          checkedInSet.add(card.id);
        }
      });
      setCheckedInCards(checkedInSet);
    }
  }, [plazaCards]);
  
  // 处理 check in 按钮点击
  const handleCheckIn = async (card: PlazaCard) => {
    if (!checkedInCards.has(card.id)) {
      try {
        await plazaAPI.checkIn(parseInt(card.id));
        setCheckedInCards(prev => new Set(prev).add(card.id));
        
        // 更新卡片状态，标记为已check-in
        const currentCards = (externalPlazaCards && externalPlazaCards.length > 0) ? externalPlazaCards : localPlazaCards;
        const updatedCards = currentCards.map(c => {
          if (c.id === card.id) {
            return { ...c, isCheckedInByMe: true, checkedInCount: (c.checkedInCount || 0) + 1 };
          }
          return c;
        });
        
        if (externalPlazaCards && onPlazaCardsUpdate) {
          onPlazaCardsUpdate(updatedCards);
        } else {
          setLocalPlazaCards(updatedCards);
        }
      } catch (error: any) {
        console.error('广场打卡失败:', error);
        if (error.response?.status === 400) {
          Alert.alert('提示', '今日已打卡，无需重复打卡');
        } else {
          Alert.alert('错误', '打卡失败，请稍后重试');
        }
      }
    }
  };

  // 显示 Toast 提示
  const showSuccessToast = () => {
    setShowToast(true);
    // 从 100% 透明度开始，逐渐消失到 25%
    toastOpacity.setValue(1.0);
    Animated.sequence([
      Animated.delay(1000), // 显示1.5秒
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };

  // 处理添加到 My Check in
  const handleAddToMyCheckIn = async (card: PlazaCard) => {
    // 检查卡片是否已经添加过
    if (!addedToMyCheckInCards.has(card.id)) {
      try {
        await plazaAPI.adopt(parseInt(card.id));
        // 标记该卡片为已添加
        setAddedToMyCheckInCards(prev => new Set(prev).add(card.id));
        if (onAddToMyCheckIn) {
          onAddToMyCheckIn(card.title);
        }
        showSuccessToast();
      } catch (error: any) {
        // 显示友好的错误提示，不在控制台显示详细错误
        const errorMessage = error.response?.data?.message || '加入我的打卡失败，请稍后重试';
        Alert.alert('提示', errorMessage);
      }
    }
  };

  // 处理评论图标点击 - 展开/收起卡片
  const toggleCardExpansion = async (cardId: string) => {
    const isExpanded = expandedCards.has(cardId);
    
    // 初始化动画值（如果不存在）
    if (!cardHeights.current[cardId]) {
      cardHeights.current[cardId] = new Animated.Value(124 * scale);
    }

    if (isExpanded) {
      // 收起
      setExpandedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      Animated.timing(cardHeights.current[cardId], {
        toValue: 124 * scale, // 原始高度
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // 展开 - 加载评论列表
      await loadCardComments(cardId);
      
      // 展开高度 = 原始高度(124) + 评论区高度
      // 评论区高度包括：评论列表区域(最大高度200) + 输入框区域(约60)
      // 使用固定的展开高度，评论列表在内部滚动
      const commentListMaxHeight = 200 * scale; // 评论列表最大高度
      const inputContainerHeight = 68 * scale; // 输入框容器高度（包括padding和border）
      const expandedHeight = 124 * scale + commentListMaxHeight + inputContainerHeight;
      
      // 先设置状态，再开始动画，确保渲染立即生效
      setExpandedCards(prev => new Set(prev).add(cardId));
      // 确保动画值立即更新到目标高度（如果是第一次展开）
      const currentValue = (cardHeights.current[cardId] as any)._value || 124 * scale;
      if (Math.abs(currentValue - expandedHeight) < 1) {
        // 如果已经是目标高度，直接返回
        return;
      }
      
      Animated.timing(cardHeights.current[cardId], {
        toValue: expandedHeight,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // 提交评论
  const handleSubmitComment = async (cardId: string) => {
    const commentText = commentInputs[cardId]?.trim();
    if (commentText) {
      try {
        const newComment = await plazaAPI.createComment(parseInt(cardId), commentText);
        // 清空输入框
        setCommentInputs(prev => ({
          ...prev,
          [cardId]: ''
        }));
        
        // 立即将新评论添加到评论列表中
        const commentItem: Comment = {
          id: newComment.id?.toString() || Date.now().toString(),
          author: newComment.author?.username || 'You',
          content: newComment.content || commentText,
          time: 'Just now',
        };
        
        // 更新卡片评论列表和评论数量
        if (!externalPlazaCards) {
          const updatedCards = localPlazaCards.map(card => {
            if (card.id === cardId) {
              const updatedCommentList = [...(card.commentList || []), commentItem];
              return {
                ...card,
                commentList: updatedCommentList,
                comments: updatedCommentList.length,
              };
            }
            return card;
          });
          setLocalPlazaCards(updatedCards);
        } else {
          // 如果是从外部传入，立即添加新评论，然后刷新评论列表以确保同步
          if (onPlazaCardsUpdate) {
            const updatedCards = externalPlazaCards.map(card => {
              if (card.id === cardId) {
                const updatedCommentList = [...(card.commentList || []), commentItem];
                return {
                  ...card,
                  commentList: updatedCommentList,
                  comments: updatedCommentList.length,
                };
              }
              return card;
            });
            onPlazaCardsUpdate(updatedCards);
          }
          // 同时刷新评论列表以确保与后端同步
          await loadCardComments(cardId);
        }
      } catch (error: any) {
        console.error('提交评论失败:', error);
        Alert.alert('错误', '提交评论失败，请稍后重试');
      }
    }
  };

  // 加载单个卡片的评论列表
  const loadCardComments = async (cardId: string) => {
    try {
      const comments = await plazaAPI.getComments(parseInt(cardId));
      const commentList: Comment[] = comments.map((comment: any, index: number) => ({
        id: comment.id?.toString() || index.toString(),
        author: comment.author?.username || 'Anonymous',
        content: comment.content || '',
        time: comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now',
      }));
      
      // 更新卡片评论列表和评论数量
      if (!externalPlazaCards) {
        const updatedCards = localPlazaCards.map(card => 
          card.id === cardId ? { ...card, commentList, comments: commentList.length } : card
        );
        setLocalPlazaCards(updatedCards);
      } else if (onPlazaCardsUpdate) {
        // 如果是从外部传入，通过回调更新
        const updatedCards = externalPlazaCards.map(card => 
          card.id === cardId ? { ...card, commentList, comments: commentList.length } : card
        );
        onPlazaCardsUpdate(updatedCards);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  };

  // 处理点赞/取消点赞
  const handleToggleLike = async (card: PlazaCard) => {
    try {
      const result = await plazaAPI.toggleLike(parseInt(card.id));
      
      // API 返回格式: { "isLiked": true } 或 { "isLiked": false }
      // 根据API文档，返回的是 isLiked 字段
      const isLiked = result?.isLiked ?? false;
      
      // 确定使用哪个卡片列表进行更新
      // 如果 externalPlazaCards 存在且长度大于0，使用它；否则使用 localPlazaCards
      const currentCards = (externalPlazaCards && externalPlazaCards.length > 0) ? externalPlazaCards : localPlazaCards;
      
      // 更新点赞状态和数量
      const updatedCards = currentCards.map(c => {
        if (c.id === card.id) {
          const wasLiked = c.isLikedByMe || false;
          let newLikes = c.likes;
          
          // 如果从未点赞变为已点赞，点赞数+1
          if (!wasLiked && isLiked) {
            newLikes = c.likes + 1;
          }
          // 如果从已点赞变为未点赞，点赞数-1
          else if (wasLiked && !isLiked) {
            newLikes = Math.max(0, c.likes - 1);
          }
          
          return { ...c, isLikedByMe: isLiked, likes: newLikes };
        }
        return c;
      });
      
      // 更新状态
      if (externalPlazaCards && externalPlazaCards.length > 0) {
        // 如果是从外部传入，通过回调更新
        if (onPlazaCardsUpdate) {
          onPlazaCardsUpdate(updatedCards);
        }
      } else {
        // 使用本地状态
        setLocalPlazaCards(updatedCards);
      }
    } catch (error: any) {
      console.error('点赞失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      Alert.alert('错误', '点赞失败，请稍后重试');
    }
  };


  const renderCard = ({ item: card, index }: { item: PlazaCard; index: number }) => {
    // 根据 Figma 设计，每个卡片的位置
    // 第一个卡片距离顶部 23px (135-112=23)，后续每个间距 50px
    const cardTopMargin = index === 0 ? 23 * scale : 50 * scale;
    
    // 黄色圆圈半径和白色卡片宽度
    const avatarRadius = 19.5 * scale; // 39 / 2
    const whiteCardWidth = 289 * scale;
    const cardWithAvatarWidth = avatarRadius + whiteCardWidth; // 308.5 * scale
    
    // check in 按钮的位置
    const checkInButtonTop = 15 * scale;
    const checkInButtonHeight = 36.2 * scale;
    const checkInButtonRight = 15 * scale;
    
    // 图标行的布局（恢复之前的间隔和位置，图标放大一倍）
    const iconSize = 24 * scale; // 图标大小
    const iconBottom = 89 * scale + 24 * scale; // 图标行的底部位置（水平对齐）：原来的 top(89) + 原来的图标高度(16)
    const iconTop = iconBottom - iconSize; // 计算图标顶部位置，使图标底部对齐
    
    // like 图标位置（左边）
    const likeIconLeft = (47 - 20) * scale; // 27 * scale
    
    // comment 图标位置（中间） - 在 like 和右侧元素之间居中
    const likesLeft = (47 - 20) * scale; // 27 * scale
    const rightElementRight = 15 * scale; // 右侧元素右边界
    
    let commentIconLeft: number;
    if (card.isSharedByUser) {
      // 有删除图标时：图标在右边，comment 在 like 和 delete 之间居中
      const deleteIconLeft = whiteCardWidth - rightElementRight - iconSize; // delete 图标的左边界
      commentIconLeft = (likesLeft + deleteIconLeft) / 2 - iconSize / 2; // comment 图标居中
    } else {
      // 有 paste 图标时：图标在右边，comment 在 like 和 paste 之间居中
      const pasteIconLeft = whiteCardWidth - rightElementRight - iconSize; // paste 图标的左边界
      commentIconLeft = (likesLeft + pasteIconLeft) / 2 - iconSize / 2; // comment 图标居中
    }
    
    // 右侧图标位置（paste 或 delete）
    const rightIconLeft = whiteCardWidth - rightElementRight - iconSize;
    
    // 初始化动画值
    if (!cardHeights.current[card.id]) {
      cardHeights.current[card.id] = new Animated.Value(124 * scale);
    }
    const isExpanded = expandedCards.has(card.id);
    const cardHeight = cardHeights.current[card.id];
    
    return (
      <View key={card.id} style={[styles.cardGroup, {
        marginLeft: (41 - 29) * scale,
        marginTop: cardTopMargin,
        width: cardWithAvatarWidth,
      }]}>
        {/* 大容器：包含黄色圆圈和白色卡片 */}
        <Animated.View style={[styles.cardWithAvatarContainer, {
          width: cardWithAvatarWidth,
          height: cardHeight,
        }]}>
          {/* 黄色圆圈 - 左对齐，置于最上层 */}
          <View style={[styles.avatar, {
            left: 0,
            top: 42 * scale,
            width: 39 * scale,
            height: 39 * scale,
            zIndex: 100,
          }]} />

          {/* 白色卡片 - 从黄色圆圈半径位置开始（右对齐） */}
          <Animated.View style={[styles.whiteCard, {
            left: avatarRadius,
            top: 0,
            width: whiteCardWidth,
            height: cardHeight,
          }]}>
            <View style={[styles.cardTitleContainer, {
              left: (47 - 20) * scale,
              top: 22 * scale,
            }]}>
              <Text style={[styles.cardTitle, {
                fontSize: 18 * scale,
              }]}>{card.title}</Text>
            </View>

            {/* Check in 按钮 - 用户自己发布的卡片不显示 */}
            {!card.isSharedByUser && (
              <TouchableOpacity
                style={[styles.checkInButton, {
                  right: 15 * scale,
                  top: 15 * scale,
                  width: 100 * scale,
                  height: 36.2 * scale,
                  backgroundColor: checkedInCards.has(card.id) ? '#CCCCCC' : '#71D1EE', // 已check in时变灰
                }]}
                onPress={() => handleCheckIn(card)}
                disabled={checkedInCards.has(card.id)} // 已check in时禁用
                activeOpacity={0.7}
              >
                <Text style={[styles.checkInButtonText, {
                  fontSize: 16 * scale,
                }]}>{checkedInCards.has(card.id) ? 'Checked' : 'Check in'}</Text>
              </TouchableOpacity>
            )}

            {/* Sponsor text with username truncation */}
            <View style={[styles.sponsorTextContainer, {
              left: (47 - 20) * scale,
              top: 51 * scale,
            }]}>
              <Text style={[styles.sponsorText, {
                fontSize: 14 * scale,
              }]}>sponsored by </Text>
              {(() => {
                const username = card.sponsor;
                const isExpanded = expandedUsernames.has(card.id);
                const shouldTruncate = username.length > 5;
                
                if (!shouldTruncate) {
                  // 用户名长度 <= 5，直接显示完整用户名
                  return (
                    <Text style={[styles.sponsorText, {
                      fontSize: 14 * scale,
                    }]}>{username}</Text>
                  );
                } else if (isExpanded) {
                  // 已展开：显示完整用户名，点击可收起
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setExpandedUsernames(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(card.id);
                          return newSet;
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.sponsorText, {
                        fontSize: 14 * scale,
                      }]}>{username}</Text>
                    </TouchableOpacity>
                  );
                } else {
                  // 显示截断的用户名 + 可点击的...
                  const truncated = username.substring(0, 5);
                  return (
                    <View style={{ flexDirection: 'row' }}>
                      <Text style={[styles.sponsorText, {
                        fontSize: 14 * scale,
                      }]}>{truncated}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setExpandedUsernames(prev => {
                            const newSet = new Set(prev);
                            newSet.add(card.id);
                            return newSet;
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.sponsorText, styles.sponsorEllipsis, {
                          fontSize: 14 * scale,
                        }]}>...</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
              })()}
            </View>

            {/* "ppl Checked in today" 文本 - 只在有 Check in 按钮时显示（即非用户发布的卡片） */}
            {!card.isSharedByUser && (
              <Text style={[styles.checkedInText, {
                right: checkInButtonRight, // 与 check in 按钮右对齐
                top: checkInButtonTop + checkInButtonHeight + 4 * scale, // 按钮下方，留4px间距
                fontSize: 10 * scale * 0.75, // 缩小到原来的0.75倍
                lineHeight: 10 * scale * 0.75 * 1.2, // 调整行高为字体大小的1.2倍
              }]}>{card.checkedInCount} ppl Checked in today</Text>
            )}

            {/* Like 图标 - 第一个位置（左边），向下移动 2px */}
            <TouchableOpacity
              style={[styles.likesContainer, {
                left: likeIconLeft,
                top: iconTop + 2 * scale,
              }]}
              onPress={() => handleToggleLike(card)}
              activeOpacity={0.7}
            >
              <SvgXml 
                xml={card.isLikedByMe ? heartIconSvgFilled : heartIconSvg} 
                width={iconSize} 
                height={iconSize} 
              />
              <Text style={[styles.likesText, {
                marginLeft: 1 * scale,
                marginTop: -2 * scale,
              }]}>{card.likes || 0}</Text>
            </TouchableOpacity>

            {/* Comment 图标 - 第二个位置（中间），向下移动 1px */}
            <TouchableOpacity
              style={[styles.commentContainer, {
                left: commentIconLeft,
                top: iconTop + 1 * scale,
              }]}
              onPress={() => toggleCardExpansion(card.id)}
              activeOpacity={0.7}
            >
              <SvgXml xml={commentIconSvgFromFile} width={iconSize} height={iconSize} />
              <Text style={[styles.commentText, {
                marginLeft: 1 * scale,
              }]}>{card.comments || 0}</Text>
            </TouchableOpacity>

            {/* paste 图标 - 第三个位置（最右边），用户自己发布的卡片不显示 */}
            {!card.isSharedByUser && (
              <TouchableOpacity
                style={[styles.addToCheckInContainer, {
                  left: rightIconLeft,
                  top: iconTop,
                  opacity: addedToMyCheckInCards.has(card.id) ? 0.5 : 1, // 已添加的卡片降低透明度
                }]}
                onPress={() => handleAddToMyCheckIn(card)}
                disabled={addedToMyCheckInCards.has(card.id)} // 已添加的卡片禁用按钮
                activeOpacity={0.7}
              >
                <SvgXml xml={copyIconSvg} width={iconSize} height={iconSize} />
              </TouchableOpacity>
            )}

            {/* 删除图标 - 第三个位置（最右边），只有发布此卡片的用户才显示 */}
            {card.isSharedByUser && (
              <TouchableOpacity
                style={[styles.deleteContainer, {
                  left: rightIconLeft,
                  top: iconTop,
                }]}
                onPress={() => handleDeleteCard(card.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={iconSize} color="#1E1E1E" />
              </TouchableOpacity>
            )}

            {/* 评论区 - 展开时显示 */}
            {isExpanded && (
              <View style={[styles.commentSection, {
                top: 124 * scale,
                left: 0,
                width: whiteCardWidth,
                height: 200 * scale + 68 * scale, // 固定高度：评论列表(200) + 输入框(68)
              }]}>
                {/* 评论列表 - 可滚动区域 */}
                <ScrollView 
                  style={styles.commentListScrollView}
                  contentContainerStyle={[styles.commentListContent, {
                    paddingHorizontal: (47 - 20) * scale,
                    paddingTop: 16 * scale,
                    paddingBottom: 12 * scale,
                  }]}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {(card.commentList && card.commentList.length > 0) ? (
                    card.commentList.map((comment) => (
                      <View key={comment.id} style={[styles.commentItem, {
                        marginBottom: 12 * scale,
                      }]}>
                        <View style={styles.commentItemHeader}>
                          <Text style={[styles.commentAuthor, {
                            fontSize: 12 * scale,
                            fontWeight: '600',
                          }]}>{comment.author}</Text>
                          <Text style={[styles.commentTime, {
                            fontSize: 10 * scale,
                            marginLeft: 8 * scale,
                            color: '#999999',
                          }]}>{comment.time}</Text>
                        </View>
                        <Text style={[styles.commentContent, {
                          fontSize: 12 * scale,
                          marginTop: 4 * scale,
                          color: '#333333',
                        }]}>{comment.content}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.noCommentsText, {
                      fontSize: 12 * scale,
                      color: '#999999',
                      textAlign: 'center',
                      paddingVertical: 20 * scale,
                    }]}>No comments yet</Text>
                  )}
                </ScrollView>

                {/* 评论输入框 - 固定在底部 */}
                <View style={[styles.commentInputContainer, {
                  paddingHorizontal: (47 - 20) * scale,
                  paddingBottom: 16 * scale,
                  paddingTop: 12 * scale,
                  borderTopWidth: 1,
                  borderTopColor: '#E0E0E0',
                  backgroundColor: '#FFFFFF',
                }]}>
                  <TextInput
                    style={[styles.commentInput, {
                      fontSize: 12 * scale,
                      paddingHorizontal: 12 * scale,
                      paddingVertical: 8 * scale,
                      height: 36 * scale,
                      flex: 1,
                    }]}
                    placeholder="Write a comment..."
                    placeholderTextColor="#999999"
                    value={commentInputs[card.id] || ''}
                    onChangeText={(text) => {
                      setCommentInputs(prev => ({
                        ...prev,
                        [card.id]: text
                      }));
                    }}
                    maxLength={200}
                    multiline={false}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, {
                      marginLeft: 8 * scale,
                      padding: 4 * scale,
                    }]}
                    onPress={() => handleSubmitComment(card.id)}
                    disabled={!commentInputs[card.id]?.trim()}
                  >
                    <Ionicons 
                      name="send" 
                      size={18 * scale} 
                      color={commentInputs[card.id]?.trim() ? '#71D1EE' : '#CCCCCC'} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[styles.pageContainer, { width }]}>
      <View style={styles.gridBackgroundContainer}>
        <GridBackground />
      </View>

      {/* Toast 提示 */}
      {showToast && (
        <View style={styles.toastWrapper} pointerEvents="none">
          <Animated.View
            style={[
              styles.toastContainer,
              {
                opacity: toastOpacity,
              },
            ]}
          >
            <Text style={styles.toastText}>Successfully added</Text>
          </Animated.View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.backButton, {
          left: 29 * scale,
          top: 70 * scale,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        }]}
        onPress={() => {
          console.log('Back button pressed');
          navigation.navigate('Home');
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={28 * scale} color="#000000" />
      </TouchableOpacity>

      <View style={[styles.titleContainer, {
        left: 0,
        right: 0,
        top: 70 * scale - 5,
      }]}>
        <Text style={styles.title}>Check in Plaza</Text>
      </View>

      {/* Add 按钮 - 固定在右上角 */}
      <TouchableOpacity
        style={[styles.addButton, {
          right: 29 * scale, // 根据 Figma x: 338, 屏幕宽度 393, 所以 right = 393 - 338 - 26 = 29
          top: 68 * scale, // 根据 Figma y: 68
          width: 50 * scale,
          alignItems: 'flex-end',
          zIndex: 10,
        }]}
        onPress={() => {
          console.log('Add');
        }}
      >
        <Ionicons name="add" size={26 * scale} color="#000000" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: 112 * scale, // 顶部留出标题和返回按钮的空间
          paddingBottom: 120 * scale, // 底部留出导航栏的空间
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.blueCard, {
          marginLeft: 29 * scale,
          width: 338 * scale,
          minHeight: 672 * scale,
        }]}>

          <View style={[styles.blueCardContent, {
            paddingTop: 28 * scale,
            paddingBottom: 20 * scale,
            minHeight: 672 * scale,
            position: 'relative',
          }]}>
            {/* 空状态提示 */}
            {plazaCards.length === 0 && (
              <View style={[styles.emptyStateContainer, {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }]}>
                <Text style={[styles.emptyStateText, {
                  fontSize: 16 * scale,
                  color: '#666666',
                  textAlign: 'center',
                }]}>
                  No shared check-in cards yet
                </Text>
              </View>
            )}

            {plazaCards.map((card, index) => renderCard({ item: card, index }))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
  gridBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backButton: {
    position: 'absolute',
    zIndex: 10,
  },
  titleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  blueCard: {
    backgroundColor: '#C2F1FF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  blueCardContent: {
    // 蓝色卡片内容容器
    position: 'relative',
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  addButton: {
    position: 'absolute',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardGroup: {
    // 使用 margin 而不是绝对定位，以便在 ScrollView 中正常滚动
  },
  cardWithAvatarContainer: {
    position: 'relative',
  },
  whiteCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardTitleContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  checkInButton: {
    position: 'absolute',
    backgroundColor: '#71D1EE',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  sponsorTextContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sponsorText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  sponsorEllipsis: {
    textDecorationLine: 'underline',
  },
  checkedInText: {
    position: 'absolute',
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  avatar: {
    position: 'absolute',
    backgroundColor: '#FFD9AA',
    borderRadius: 19.5,
  },
  likesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14 * (width / 393) * 1.1,
    color: '#000000',
  },
  addToCheckInContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToCheckInText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  commentContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14 * (width / 393) * 1.1,
    color: '#000000',
  },
  deleteContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSection: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    display: 'flex',
  },
  commentListScrollView: {
    flex: 1, // 占据剩余空间，让输入框固定在底部
  },
  commentListContent: {
    flexGrow: 1,
  },
  commentItem: {
    marginBottom: 12 * (width / 393),
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthor: {
    fontFamily: 'System',
    fontWeight: '600',
    color: '#000000',
  },
  commentTime: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#999999',
  },
  commentContent: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#333333',
  },
  noCommentsText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#999999',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    fontFamily: 'System',
    color: '#000000',
  },
  sendButton: {
    padding: 4 * (width / 393),
  },
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  toastContainer: {
    backgroundColor: '#E5E5E5', // 更浅的灰色背景
    paddingHorizontal: 40 * (width / 393), // 扩大水平内边距
    paddingVertical: 20 * (width / 393), // 扩大垂直内边距
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    color: '#000000', // 黑色文字（在浅灰色背景上）
    fontSize: 16 * (width / 393), // 稍微增大字体
    fontWeight: '500',
    textAlign: 'center',
  },
});

