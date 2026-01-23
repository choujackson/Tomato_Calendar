import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, Animated, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import GridBackground from '../components/GridBackground';
import { habitsAPI } from '../services/api';

const { width } = Dimensions.get('window');

type CheckInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckIn'>;

interface WhiteCard {
  id: string;
  title: string;
  flipped?: boolean;
  days?: number;
  isShared?: boolean; // 是否已分享到打卡广场
}

interface CheckInScreenContentProps {
  navigation?: CheckInScreenNavigationProp;
  myCheckInCards?: WhiteCard[];
  setMyCheckInCards?: React.Dispatch<React.SetStateAction<WhiteCard[]>>;
  onShareToPlaza?: (habitId: number) => void; // 分享到打卡广场的回调（通过习惯 ID）
}

export default function CheckInScreenContent({ navigation: propNavigation, myCheckInCards, setMyCheckInCards, onShareToPlaza }: CheckInScreenContentProps = {}) {
  const defaultNavigation = useNavigation<CheckInScreenNavigationProp>();
  const navigation = propNavigation || defaultNavigation;
  const scale = width / 393;

  const [showAddModal, setShowAddModal] = useState(false);
  const [eventName, setEventName] = useState('');
  
  // 卡片编辑/删除/撤销打卡的 Modal 状态
  const [showCardActionModal, setShowCardActionModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<WhiteCard | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // 使用 props 中的卡片列表，如果没有则使用本地状态
  const [localWhiteCards, setLocalWhiteCards] = useState<WhiteCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  const whiteCards = myCheckInCards || localWhiteCards;
  const setWhiteCards = setMyCheckInCards || setLocalWhiteCards;

  const flipAnimations = useRef<{ [key: string]: Animated.Value }>({});

  // 加载习惯列表
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const habits = await habitsAPI.getHabits();
      // 将 API 数据转换为 WhiteCard 格式
      const cards: WhiteCard[] = habits.map((habit: any) => ({
        id: habit.id.toString(),
        title: habit.name,
        flipped: habit.checkedInToday || false,
        days: habit.streak || 0,
        isShared: habit.isShared || habit.isSharedToPlaza || false, // 从 API 获取分享状态
      }));
      
      // 根据是否有 props 传入的状态，更新相应的状态
      if (setMyCheckInCards) {
        // 如果有从外部传入的状态更新函数，使用它
        setMyCheckInCards(cards);
      } else {
        // 否则使用本地状态
        setLocalWhiteCards(cards);
      }
      
      // 初始化动画值
      cards.forEach(card => {
        if (!flipAnimations.current[card.id]) {
          flipAnimations.current[card.id] = new Animated.Value(card.flipped ? 1 : 0);
        }
      });
    } catch (error: any) {
      console.error('加载习惯列表失败:', error);
      if (error.response?.status !== 401) {
        Alert.alert('错误', '加载习惯列表失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 当卡片列表变化时，初始化新卡片的动画值
    whiteCards.forEach(card => {
      if (!flipAnimations.current[card.id]) {
        flipAnimations.current[card.id] = new Animated.Value(card.flipped ? 1 : 0);
      }
    });
  }, [whiteCards]);

  const flipCard = async (cardId: string) => {
    const card = whiteCards.find(c => c.id === cardId);
    if (!card || !flipAnimations.current[cardId]) return;

    const isFlipped = card.flipped || false;
    
    // 如果已经打卡，不需要调用 API
    if (isFlipped) {
      const toValue = 0;
      setWhiteCards(whiteCards.map(c => {
        if (c.id === cardId) {
          return { ...c, flipped: false };
        }
        return c;
      }));
      Animated.spring(flipAnimations.current[cardId], {
        toValue,
        useNativeDriver: true,
        tension: 10,
        friction: 8,
      }).start();
      return;
    }

    // 执行打卡
    try {
      await habitsAPI.checkIn(parseInt(cardId));
      // 打卡成功后刷新列表
      await loadHabits();
      // 动画翻转
      Animated.spring(flipAnimations.current[cardId], {
        toValue: 1,
        useNativeDriver: true,
        tension: 10,
        friction: 8,
      }).start();
    } catch (error: any) {
      console.error('打卡失败:', error);
      if (error.response?.status === 400) {
        Alert.alert('提示', '今日已打卡，无需重复打卡');
      } else {
        Alert.alert('错误', '打卡失败，请稍后重试');
      }
    }
  };

  const flipAllCards = async () => {
    const unflippedCards = whiteCards.filter(card => !card.flipped);
    
    if (unflippedCards.length === 0) return;
    
    // 批量打卡
    try {
      await Promise.all(
        unflippedCards.map(card => habitsAPI.checkIn(parseInt(card.id)))
      );
      
      // 先更新本地状态和触发动画
      const updatedCards = whiteCards.map(card => {
        if (!card.flipped && unflippedCards.some(uc => uc.id === card.id)) {
          return { ...card, flipped: true, days: (card.days || 0) + 1 };
        }
        return card;
      });
      
      // 更新状态
      setWhiteCards(updatedCards);
      
      // 触发所有未翻转卡片的翻转动画
      unflippedCards.forEach(card => {
        if (flipAnimations.current[card.id]) {
          Animated.spring(flipAnimations.current[card.id], {
            toValue: 1,
            useNativeDriver: true,
            tension: 10,
            friction: 8,
          }).start();
        }
      });
      
      // 刷新列表以获取最新数据（可选，因为上面已经更新了状态）
      // await loadHabits();
    } catch (error: any) {
      console.error('批量打卡失败:', error);
      Alert.alert('错误', '部分打卡失败，请稍后重试');
      // 即使部分失败也刷新列表
      await loadHabits();
    }
  };

  const openAddModal = () => {
    setEventName('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEventName('');
  };

  const handleCreate = async () => {
    if (eventName.trim()) {
      try {
        await habitsAPI.createHabit(eventName.trim());
        // 创建成功后刷新列表
        await loadHabits();
        closeAddModal();
      } catch (error: any) {
        // 显示友好的错误提示，不在控制台显示详细错误
        const errorMessage = error.response?.data?.message || '创建习惯失败，请稍后重试';
        Alert.alert('提示', errorMessage);
      }
    }
  };

  // 打开卡片操作 Modal
  const openCardActionModal = (card: WhiteCard) => {
    setSelectedCard(card);
    setEditTitle(card.title);
    setShowCardActionModal(true);
  };

  // 关闭卡片操作 Modal
  const closeCardActionModal = () => {
    setShowCardActionModal(false);
    setSelectedCard(null);
    setEditTitle('');
  };

  // 编辑卡片标题 - API 中没有编辑接口，这里先删除后创建
  const handleEditCard = async () => {
    if (selectedCard && editTitle.trim() && editTitle.trim() !== selectedCard.title) {
      try {
        // 先删除旧习惯
        await habitsAPI.deleteHabit(parseInt(selectedCard.id));
        // 再创建新习惯
        await habitsAPI.createHabit(editTitle.trim());
        // 刷新列表
        await loadHabits();
        closeCardActionModal();
      } catch (error: any) {
        console.error('编辑习惯失败:', error);
        Alert.alert('错误', '编辑习惯失败，请稍后重试');
      }
    }
  };

  // 删除卡片
  const handleDeleteCard = async () => {
    if (selectedCard) {
      try {
        await habitsAPI.deleteHabit(parseInt(selectedCard.id));
        // 删除成功后刷新列表
        await loadHabits();
        closeCardActionModal();
      } catch (error: any) {
        console.error('删除习惯失败:', error);
        Alert.alert('错误', '删除习惯失败，请稍后重试');
      }
    }
  };

  // 分享卡片到打卡广场
  const handleShareCard = async () => {
    if (selectedCard && onShareToPlaza) {
      // 检查是否已分享
      if (selectedCard.isShared) {
        Alert.alert('提示', '该卡片已分享到打卡广场，无法重复分享。如需重新分享，请先删除广场中的该卡片。');
        return;
      }
      
      try {
        // 通过习惯 ID 分享，后端会验证标题是否符合要求
        const habitId = parseInt(selectedCard.id);
        await onShareToPlaza(habitId);
        
        // 分享成功后，更新本地状态，标记为已分享
        setWhiteCards((prevCards) => 
          prevCards.map((card) => 
            card.id === selectedCard.id ? { ...card, isShared: true } : card
          )
        );
        
        closeCardActionModal();
      } catch (error: any) {
        // 如果后端返回错误（如已分享），显示友好提示
        if (error.response?.status === 400 || error.response?.status === 409) {
          Alert.alert('提示', '该卡片已分享到打卡广场，无法重复分享。');
          // 更新本地状态
          setWhiteCards((prevCards) => 
            prevCards.map((card) => 
              card.id === selectedCard.id ? { ...card, isShared: true } : card
            )
          );
        } else {
          Alert.alert('错误', '分享失败，请稍后重试');
        }
      }
    }
  };

  // 撤销打卡状态 - 刷新列表以获取最新状态
  const handleUndoCheckIn = async () => {
    if (selectedCard) {
      try {
        // 刷新列表以获取最新状态（后端会计算正确的状态）
        await loadHabits();
        closeCardActionModal();
      } catch (error: any) {
        console.error('刷新习惯列表失败:', error);
        Alert.alert('错误', '刷新失败，请稍后重试');
      }
    }
  };

  return (
    <View style={[styles.pageContainer, { width }]}>
      <View style={styles.gridBackgroundContainer}>
        <GridBackground />
      </View>
      
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
        <Text style={styles.title}>My Check in</Text>
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
        onPress={openAddModal}
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
          marginLeft: 27 * scale,
          width: 338 * scale,
          // 动态计算最小高度：根据白色卡片数量
          minHeight: (() => {
            const cardHeight = 117 * scale;
            const rowSpacing = 20 * scale;
            const topPadding = 28 * scale;
            const rows = Math.ceil(whiteCards.length / 2);
            const oneClickButtonArea = 42 * scale + 20 * scale + 20 * scale;
            
            if (rows === 0) {
              return topPadding + oneClickButtonArea;
            }
            
            const cardsArea = topPadding + (rows * cardHeight) + ((rows - 1) * rowSpacing) + 20 * scale;
            return cardsArea + oneClickButtonArea;
          })(),
        }]}>

        {/* 空状态提示 */}
        {whiteCards.length === 0 && (
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
              Create your first check-in card
            </Text>
          </View>
        )}

        {whiteCards.map((card, index) => {
          const cardWidth = 140 * scale;
          const cardHeight = 117 * scale;
          const cardSpacing = 20 * scale;
          const leftOffset = 20 * scale;
          const topOffset = 28 * scale;
          
          const row = Math.floor(index / 2);
          const col = index % 2;
          
          const left = leftOffset + col * (cardWidth + cardSpacing);
          const top = topOffset + row * (cardHeight + 20 * scale);

          if (!flipAnimations.current[card.id]) {
            flipAnimations.current[card.id] = new Animated.Value(card.flipped ? 1 : 0);
          }

          const flipValue = flipAnimations.current[card.id];
          
          const frontRotateY = flipValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          });
          
          const backRotateY = flipValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '360deg'],
          });

          const frontOpacity = flipValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0, 0],
          });

          const backOpacity = flipValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          return (
            <View key={card.id}>
              <View style={[styles.cardContainer, {
                left: left,
                top: top,
                width: cardWidth,
                height: cardHeight,
                zIndex: 10,
                // @ts-ignore
                perspective: 1000,
              }]}>
                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      opacity: frontOpacity,
                      transform: [{ rotateY: frontRotateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.whiteCard}
                    activeOpacity={0.9}
                    onPress={() => openCardActionModal(card)}
                  >
                    <View style={[styles.whiteCardTopSection, {
                      height: 71 * scale,
                    }]}>
                      <Text style={[styles.runningText, {
                        fontSize: 14 * scale,
                        lineHeight: 18 * scale,
                      }]}>{card.title}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.checkInButton, {
                        position: 'absolute',
                        left: 20 * scale,
                        top: 71 * scale,
                        width: 100 * scale,
                        height: 36.2 * scale,
                      }]}
                      onPress={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡，避免触发卡片的点击
                        flipCard(card.id);
                      }}
                    >
                      <Text style={[styles.checkInButtonText, {
                        fontSize: 16 * scale,
                      }]}>Check in</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      opacity: backOpacity,
                      transform: [{ rotateY: backRotateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.whiteCard}
                    activeOpacity={0.9}
                    onPress={() => openCardActionModal(card)}
                  >
                    <View style={styles.cardBackContent}>
                      <Text style={[styles.cardBackText, {
                        fontSize: 14 * scale,
                        lineHeight: 20 * scale,
                        textAlign: 'center',
                      }]}>
                        You have been{'\n'}
                        <Text style={styles.cardBackTitle}>{card.title}</Text>{'\n'}
                        for {card.days || 0} day{(card.days || 0) !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          );
        })}

        {/* One-click Check in 按钮 - 没有卡片时隐藏 */}
        {whiteCards.length > 0 && (
          <TouchableOpacity
            style={[styles.oneClickButton, {
              left: 79 * scale,
              top: (() => {
                const cardHeight = 117 * scale;
                const rowSpacing = 20 * scale;
                const topPadding = 28 * scale;
                const rows = Math.ceil(whiteCards.length / 2);
                return topPadding + (rows * cardHeight) + ((rows - 1) * rowSpacing) + 35 * scale;
              })(),
              width: 180 * scale,
              height: 42 * scale,
            }]}
            onPress={flipAllCards}
          >
            <Text style={[styles.oneClickButtonText, {
              fontSize: 18 * scale,
            }]}>One-click Check in</Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeAddModal}
        >
          <View
            style={[styles.modalContent, {
              width: 335 * scale,
              height: 239 * scale,
            }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, {
              fontSize: 24 * scale,
            }]}>Event Name</Text>

            <View style={[styles.modalInputContainer, {
              marginTop: 20 * scale,
              width: 264 * scale,
            }]}>
              <TextInput
                style={[styles.modalInput, {
                  fontSize: 20 * scale,
                }]}
                value={eventName}
                onChangeText={(text) => {
                  if (text.length <= 20) {
                    setEventName(text);
                  }
                }}
                maxLength={20}
                placeholder="Enter event name"
              />
              <Text style={[styles.charCount, {
                fontSize: 12 * scale,
                marginTop: 4 * scale,
                textAlign: 'right',
                color: eventName.length >= 20 ? '#FF4444' : '#666666',
              }]}>
                {eventName.length}/20
              </Text>
              <View style={styles.modalDivider} />
            </View>

            <TouchableOpacity
              style={[styles.modalCreateButton, {
                width: 163 * scale,
                height: 36.2 * scale,
                marginTop: 28 * scale,
              }]}
              onPress={handleCreate}
            >
              <Text style={[styles.modalCreateButtonText, {
                fontSize: 18 * scale,
              }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 卡片操作 Modal - 编辑/删除/撤销打卡 */}
      <Modal
        visible={showCardActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCardActionModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeCardActionModal}
        >
          <View 
            style={[styles.cardActionModal, {
              width: 320 * scale,
              padding: 28 * scale,
            }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.cardActionModalHeader}>
              <Text style={[styles.cardActionModalTitle, {
                fontSize: 22 * scale,
                fontWeight: '700',
              }]}>Card Options</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* 分享图标 */}
                <TouchableOpacity
                  onPress={handleShareCard}
                  style={[styles.shareButton, {
                    marginRight: 12 * scale,
                  }]}
                  disabled={!selectedCard || !onShareToPlaza || selectedCard.isShared}
                >
                  <Ionicons 
                    name="share-outline" 
                    size={24 * scale} 
                    color={!selectedCard || !onShareToPlaza || selectedCard.isShared ? '#CCCCCC' : '#71D1EE'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeCardActionModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24 * scale} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 编辑卡片 */}
            <View style={styles.cardActionSection}>
              <Text style={[styles.cardActionLabel, {
                fontSize: 16 * scale,
                marginBottom: 12 * scale,
                fontWeight: '600',
              }]}>Edit Title</Text>
              <TextInput
                style={[styles.cardActionInput, {
                  fontSize: 16 * scale,
                  padding: 12 * scale,
                  marginBottom: 8 * scale,
                  minHeight: 50 * scale,
                }]}
                value={editTitle}
                onChangeText={(text) => {
                  if (text.length <= 20) {
                    setEditTitle(text);
                  }
                }}
                maxLength={20}
                placeholder="Enter new title (max 20 chars)"
                multiline
              />
              <Text style={[styles.charCount, {
                fontSize: 12 * scale,
                marginBottom: 16 * scale,
                textAlign: 'right',
                color: editTitle.length >= 20 ? '#FF4444' : '#666666',
              }]}>
                {editTitle.length}/20
              </Text>
              <TouchableOpacity
                style={[styles.cardActionButton, {
                  backgroundColor: '#71D1EE',
                  marginBottom: 12 * scale,
                  paddingVertical: 14 * scale,
                }]}
                onPress={handleEditCard}
                disabled={!editTitle.trim() || editTitle.trim() === selectedCard?.title}
              >
                <Text style={[styles.cardActionButtonText, {
                  fontSize: 16 * scale,
                  fontWeight: '600',
                }]}>Save Changes</Text>
              </TouchableOpacity>
            </View>

            {/* 撤销打卡状态 */}
            {selectedCard?.flipped && (
              <TouchableOpacity
                style={[styles.cardActionButton, {
                  backgroundColor: '#FFA500',
                  marginBottom: 12 * scale,
                }]}
                onPress={handleUndoCheckIn}
              >
                <Text style={[styles.cardActionButtonText, {
                  fontSize: 16 * scale,
                }]}>Undo Check In</Text>
              </TouchableOpacity>
            )}

            {/* 删除卡片 */}
            <TouchableOpacity
              style={[styles.cardActionButton, {
                backgroundColor: '#FF4444',
                marginBottom: 12 * scale,
              }]}
              onPress={handleDeleteCard}
            >
              <Text style={[styles.cardActionButtonText, {
                fontSize: 16 * scale,
              }]}>Delete Card</Text>
            </TouchableOpacity>

            {/* 取消按钮 */}
            <TouchableOpacity
              style={[styles.cardActionButton, {
                backgroundColor: '#CCCCCC',
              }]}
              onPress={closeCardActionModal}
            >
              <Text style={[styles.cardActionButtonText, {
                fontSize: 16 * scale,
              }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  addButton: {
    position: 'absolute',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardContainer: {
    position: 'absolute',
    zIndex: 10,
    overflow: 'hidden',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  whiteCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  cardBackContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  cardBackText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  cardBackTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
  },
  whiteCardTopSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runningText: {
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
  oneClickButton: {
    position: 'absolute',
    backgroundColor: '#71D1EE',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oneClickButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 28 * (width / 393),
    paddingHorizontal: 35 * (width / 393),
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  modalInputContainer: {
    alignItems: 'center',
  },
  modalInput: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  modalDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#000000',
    marginTop: 0,
  },
  modalCreateButton: {
    backgroundColor: '#71D1EE',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCreateButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  charCount: {
    fontFamily: 'System',
    fontWeight: '400',
  },
  cardActionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: '25%',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardActionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24 * (width / 393),
    paddingBottom: 16 * (width / 393),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardActionModalTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'left',
  },
  shareButton: {
    padding: 4 * (width / 393),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4 * (width / 393),
    marginLeft: 8 * (width / 393),
  },
  cardActionSection: {
    marginBottom: 20 * (width / 393),
  },
  cardActionLabel: {
    fontFamily: 'System',
    fontWeight: '600',
    color: '#000000',
  },
  cardActionInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    fontFamily: 'System',
    color: '#000000',
    textAlignVertical: 'top',
  },
  cardActionButton: {
    borderRadius: 10,
    paddingVertical: 14 * (width / 393),
    paddingHorizontal: 20 * (width / 393),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48 * (width / 393),
  },
  cardActionButtonText: {
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'System',
    fontWeight: '400',
  },
});

