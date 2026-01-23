import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, TextInput, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../App';
import GridBackground from '../components/GridBackground';

const { width } = Dimensions.get('window');

type CheckInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckIn'>;

// User Icon SVG
const userIconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6666 28V25.3333C26.6666 23.9188 26.1047 22.5623 25.1045 21.5621C24.1044 20.5619 22.7478 20 21.3333 20H10.6666C9.25216 20 7.8956 20.5619 6.89541 21.5621C5.89522 22.5623 5.33331 23.9188 5.33331 25.3333V28M21.3333 9.33333C21.3333 12.2789 18.9455 14.6667 16 14.6667C13.0545 14.6667 10.6666 12.2789 10.6666 9.33333C10.6666 6.38781 13.0545 4 16 4C18.9455 4 21.3333 6.38781 21.3333 9.33333Z" stroke="#1E1E1E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Users Icon SVG
const usersIconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2_3274)">
<path d="M22.6666 28V25.3333C22.6666 23.9188 22.1047 22.5623 21.1045 21.5621C20.1044 20.5619 18.7478 20 17.3333 20H6.66665C5.25216 20 3.8956 20.5619 2.89541 21.5621C1.89522 22.5623 1.33331 23.9188 1.33331 25.3333V28M30.6666 28V25.3333C30.6658 24.1516 30.2725 23.0037 29.5485 22.0698C28.8245 21.1358 27.8108 20.4688 26.6666 20.1733M21.3333 4.17333C22.4805 4.46707 23.4974 5.13427 24.2235 6.06975C24.9496 7.00523 25.3438 8.15577 25.3438 9.34C25.3438 10.5242 24.9496 11.6748 24.2235 12.6103C23.4974 13.5457 22.4805 14.2129 21.3333 14.5067M17.3333 9.33333C17.3333 12.2789 14.9455 14.6667 12 14.6667C9.05446 14.6667 6.66665 12.2789 6.66665 9.33333C6.66665 6.38781 9.05446 4 12 4C14.9455 4 17.3333 6.38781 17.3333 9.33333Z" stroke="#B3B3B3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2_3274">
<rect width="32" height="32" fill="white"/>
</clipPath>
</defs>
</svg>`;

interface WhiteCard {
  id: string;
  title: string;
  flipped?: boolean;
  days?: number; // 打卡天数
}

export default function CheckInScreen() {
  const navigation = useNavigation<CheckInScreenNavigationProp>();
  
  // 根据 Figma 设计，计算相对位置
  // Figma 设计宽度为 393px，需要根据实际屏幕宽度进行缩放
  const scale = width / 393;

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventName, setEventName] = useState('');

  // 白色卡片列表
  const [whiteCards, setWhiteCards] = useState<WhiteCard[]>([
    { id: '1', title: 'Running', flipped: false, days: 0 },
    { id: '2', title: 'Watering\nThe Flowers', flipped: false, days: 0 },
  ]);

  // 存储每个卡片的翻转动画值
  const flipAnimations = useRef<{ [key: string]: Animated.Value }>({});

  // 初始化翻转动画值
  useEffect(() => {
    whiteCards.forEach(card => {
      if (!flipAnimations.current[card.id]) {
        flipAnimations.current[card.id] = new Animated.Value(card.flipped ? 1 : 0);
      }
    });
  }, [whiteCards.length]);

  // 翻转卡片
  const flipCard = (cardId: string) => {
    const card = whiteCards.find(c => c.id === cardId);
    if (!card || !flipAnimations.current[cardId]) return;

    const isFlipped = card.flipped || false;
    const toValue = isFlipped ? 0 : 1;

    // 更新卡片状态：如果是从正面翻到反面，增加打卡天数
    setWhiteCards(whiteCards.map(c => {
      if (c.id === cardId) {
        if (!isFlipped) {
          // 从正面翻到反面，增加打卡天数
          return { ...c, flipped: true, days: (c.days || 0) + 1 };
        } else {
          // 从反面翻回正面
          return { ...c, flipped: false };
        }
      }
      return c;
    }));

    // 执行翻转动画
    Animated.spring(flipAnimations.current[cardId], {
      toValue,
      useNativeDriver: true,
      tension: 10,
      friction: 8,
    }).start();
  };

  // 一键翻转所有卡片
  const flipAllCards = () => {
    // 更新所有卡片状态：从正面翻到反面，增加打卡天数
    setWhiteCards(whiteCards.map(card => {
      if (!card.flipped) {
        // 从正面翻到反面，增加打卡天数
        return { ...card, flipped: true, days: (card.days || 0) + 1 };
      }
      return card;
    }));

    // 执行所有卡片的翻转动画
    whiteCards.forEach(card => {
      if (!flipAnimations.current[card.id]) {
        flipAnimations.current[card.id] = new Animated.Value(card.flipped ? 1 : 0);
      }
      
      if (!card.flipped) {
        // 只翻转未翻转的卡片
        Animated.spring(flipAnimations.current[card.id], {
          toValue: 1,
          useNativeDriver: true,
          tension: 10,
          friction: 8,
        }).start();
      }
    });
  };

  // 打开添加弹窗
  const openAddModal = () => {
    setEventName('');
    setShowAddModal(true);
  };

  // 关闭添加弹窗
  const closeAddModal = () => {
    setShowAddModal(false);
    setEventName('');
  };

  // 创建新的白色卡片
  const handleCreate = () => {
    if (eventName.trim()) {
      const newCardId = Date.now().toString();
      const newCard: WhiteCard = {
        id: newCardId,
        title: eventName.trim(),
        flipped: false,
        days: 0,
      };
      // 初始化新卡片的动画值
      flipAnimations.current[newCardId] = new Animated.Value(0);
      setWhiteCards([...whiteCards, newCard]);
      closeAddModal();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.gridBackgroundContainer}>
        <GridBackground />
      </View>
      
      {/* 返回按钮 */}
      <TouchableOpacity
        style={[styles.backButton, {
          left: 29 * scale,
          top: 70 * scale,
          justifyContent: 'center',
          alignItems: 'center',
        }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28 * scale} color="#000000" />
      </TouchableOpacity>

      {/* 标题 "My Check in" */}
      <View style={[styles.titleContainer, {
        left: 0,
        right: 0,
        top: 70 * scale - 5, // 向上移动5px
      }]}>
        <Text style={styles.title}>My Check in</Text>
      </View>

      {/* 蓝色卡片 - 动态高度 */}
      <View style={[styles.blueCard, {
        left: 27 * scale,
        top: 112 * scale,
        width: 338 * scale,
        // 动态计算高度：根据白色卡片数量
        // 基础高度：顶部边距 + 卡片行数 * 卡片高度 + 行间距 + One-click 按钮区域
        height: (() => {
          const cardHeight = 117 * scale;
          const rowSpacing = 20 * scale;
          const topPadding = 28 * scale;
          const rows = Math.ceil(whiteCards.length / 2);
          // One-click 按钮区域：按钮高度 + 上下间距
          const oneClickButtonArea = 42 * scale + 20 * scale + 20 * scale; // 按钮高度 + 上间距 + 下间距
          
          if (rows === 0) {
            return topPadding + oneClickButtonArea;
          }
          
          // 计算所有卡片行的高度 + One-click 按钮区域
          const cardsArea = topPadding + (rows * cardHeight) + ((rows - 1) * rowSpacing) + 20 * scale; // 最后一行卡片下方的间距
          return cardsArea + oneClickButtonArea;
        })(),
      }]}>
        {/* 添加按钮 - 右上角 */}
        <TouchableOpacity
          style={[styles.addButton, {
            right: 0,
            top: -44 * scale, // 在卡片外部上方，根据 Figma x: 338, y: 68 (68-112=-44)
            width: 50 * scale, // 与 DetailView 保持一致
            alignItems: 'flex-end',
          }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={26 * scale} color="#000000" />
        </TouchableOpacity>

        {/* 动态渲染白色卡片 */}
        {whiteCards.map((card, index) => {
          // 计算卡片位置：每行2个，间距20px
          const cardWidth = 140 * scale;
          const cardHeight = 117 * scale;
          const cardSpacing = 20 * scale;
          const leftOffset = 20 * scale; // 相对于蓝色卡片的左边距
          const topOffset = 28 * scale; // 相对于蓝色卡片的顶部边距
          
          // 计算行和列
          const row = Math.floor(index / 2);
          const col = index % 2;
          
          // 计算位置
          const left = leftOffset + col * (cardWidth + cardSpacing);
          const top = topOffset + row * (cardHeight + 20 * scale); // 行间距20px

          // 确保动画值存在
          if (!flipAnimations.current[card.id]) {
            flipAnimations.current[card.id] = new Animated.Value(card.flipped ? 1 : 0);
          }

          const flipValue = flipAnimations.current[card.id];
          
          // 计算翻转角度
          const frontRotateY = flipValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          });
          
          const backRotateY = flipValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '360deg'],
          });

          // 正面和反面的透明度
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
              {/* 卡片容器 - 添加 perspective */}
              <View style={[styles.cardContainer, {
                left: left,
                top: top,
                width: cardWidth,
                height: cardHeight,
                zIndex: 10, // 确保卡片在网格背景之上
                // @ts-ignore - perspective 在 React Native 中需要内联样式
                perspective: 1000,
              }]}>
                {/* 正面 */}
                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      opacity: frontOpacity,
                      transform: [{ rotateY: frontRotateY }],
                    },
                  ]}
                >
                  <View style={styles.whiteCard}>
                    {/* 留白区域容器 - Check in 按钮上方 */}
                    <View style={[styles.whiteCardTopSection, {
                      height: 71 * scale,
                    }]}>
                      <Text style={[styles.runningText, {
                        fontSize: 14 * scale,
                        lineHeight: 18 * scale,
                      }]}>{card.title}</Text>
                    </View>
                    
                    {/* Check in 按钮 - 在正面 */}
                    <TouchableOpacity
                      style={[styles.checkInButton, {
                        position: 'absolute',
                        left: 20 * scale,
                        top: 71 * scale,
                        width: 100 * scale,
                        height: 36.2 * scale,
                      }]}
                      onPress={() => {
                        flipCard(card.id);
                      }}
                    >
                      <Text style={[styles.checkInButtonText, {
                        fontSize: 16 * scale,
                      }]}>Check in</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* 反面 - 显示打卡信息 */}
                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      opacity: backOpacity,
                      transform: [{ rotateY: backRotateY }],
                    },
                  ]}
                >
                  <View style={styles.whiteCard}>
                    {/* 打卡信息文本 - 居中显示 */}
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
                  </View>
                </Animated.View>
              </View>
            </View>
          );
        })}

        {/* One-click Check in 按钮 - 动态位置 */}
        <TouchableOpacity
          style={[styles.oneClickButton, {
            left: 79 * scale, // 调整位置以保持居中 (338 - 180) / 2 = 79
            // 动态计算位置：根据白色卡片行数
            top: (() => {
              const cardHeight = 117 * scale;
              const rowSpacing = 20 * scale;
              const topPadding = 28 * scale;
              const rows = Math.ceil(whiteCards.length / 2);
              // 按钮位置 = 顶部边距 + 所有卡片行的高度 + 行间距 + 按钮上方间距
              return topPadding + (rows * cardHeight) + ((rows - 1) * rowSpacing) + 35 * scale;
            })(),
            width: 180 * scale, // 放大宽度
            height: 42 * scale, // 放大高度
          }]}
          onPress={flipAllCards}
        >
          <Text style={[styles.oneClickButtonText, {
            fontSize: 18 * scale,
          }]}>One-click Check in</Text>
        </TouchableOpacity>
      </View>

      {/* 底部导航栏 - 根据 Figma 设计 */}
      <View style={[styles.bottomNavBar, {
        height: 98 * scale,
      }]}>
        {/* 图标容器 - 并排排列 */}
        <View style={styles.navIconsContainer}>
          {/* User 图标 */}
          <TouchableOpacity
            style={[styles.navIconButton, {
              width: 32 * scale,
              height: 32 * scale,
            }]}
            onPress={() => {
              // TODO: 实现用户功能
              console.log('User');
            }}
          >
            <SvgXml xml={userIconSvg} width="100%" height="100%" />
          </TouchableOpacity>

          {/* Users 图标 */}
          <TouchableOpacity
            style={[styles.navIconButton, {
              width: 32 * scale,
              height: 32 * scale,
              marginLeft: 130 * scale, // 增加图标之间的间距
            }]}
            onPress={() => {
              // TODO: 实现用户组功能
              console.log('Users');
            }}
          >
            <SvgXml xml={usersIconSvg} width="100%" height="100%" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 添加卡片弹窗 */}
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
            {/* Event Name 标题 */}
            <Text style={[styles.modalTitle, {
              fontSize: 24 * scale,
            }]}>Event Name</Text>

            {/* 输入框容器 - 包含输入框和分隔线 */}
            <View style={[styles.modalInputContainer, {
              marginTop: 20 * scale,
              width: 264 * scale,
            }]}>
              <TextInput
                style={[styles.modalInput, {
                  fontSize: 20 * scale,
                }]}
                value={eventName}
                onChangeText={setEventName}
              />
              {/* 分隔线 - 作为输入框的下划线 */}
              <View style={styles.modalDivider} />
            </View>

            {/* Create 按钮 */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  title: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  blueCard: {
    position: 'absolute',
    backgroundColor: '#C2F1FF',
    borderRadius: 20,
  },
  addButton: {
    position: 'absolute',
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'absolute',
    zIndex: 10, // 确保卡片在网格背景之上
    overflow: 'hidden', // 限制 perspective 的影响范围
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden', // 必须配置
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
    includeFontPadding: false, // Android 上移除额外的字体内边距
    textAlignVertical: 'center', // Android 上垂直居中
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
  wateringTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wateringText: {
    fontFamily: 'System',
    fontWeight: '700',
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
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#FFFFFB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12.2,
    elevation: 5, // Android 阴影
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconButton: {
    justifyContent: 'center',
    alignItems: 'center',
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
});

