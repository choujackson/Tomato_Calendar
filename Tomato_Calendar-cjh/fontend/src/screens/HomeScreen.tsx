import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../App';
import GridBackground from '../components/GridBackground';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// SVG 内容
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

const cardIconSvg = `<svg width="70" height="81" viewBox="0 0 70 81" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0.310877" y="0.637411" width="45.283" height="68.5246" rx="9.5" transform="matrix(0.944554 0.328355 -0.3228 0.946467 23.5062 -0.0679556)" fill="#71D1EE" stroke="black"/>
<rect x="0.5" y="9.8358" width="45.2358" height="68.5944" rx="9.5" fill="#71D1EE" stroke="black"/>
<circle cx="13.987" cy="43.987" r="4.98701" fill="#55B7D5"/>
<circle cx="37.961" cy="43.987" r="4.98701" fill="#55B7D5"/>
<path d="M63.6435 34C63.6435 40.3272 59.109 41.909 57 41.909C62.0617 41.909 63.6435 47.1816 63.6435 49.8179C63.6435 43.4908 68.3888 41.909 69.9706 41.909C64.9089 41.909 63.6435 36.6363 63.6435 34Z" fill="#FFF7DA" stroke="black" stroke-linecap="round"/>
<path d="M7.164 40.827C8.19807 40.8272 9.03607 41.6659 9.03607 42.7001C9.03588 43.734 8.19795 44.5719 7.164 44.5721C6.12988 44.5721 5.29115 43.7342 5.29095 42.7001C5.29095 41.6658 6.12976 40.827 7.164 40.827Z" fill="white" stroke="black"/>
<path d="M17.2363 39.0476C17.8337 39.0477 18.3174 39.5323 18.3174 40.1296C18.3173 40.7269 17.8336 41.2115 17.2363 41.2117C16.639 41.2117 16.1544 40.727 16.1543 40.1296C16.1543 39.5322 16.6389 39.0476 17.2363 39.0476Z" fill="black" stroke="black"/>
<path d="M34.636 39.0476C35.2333 39.0477 35.717 39.5323 35.717 40.1296C35.7169 40.7269 35.2332 41.2115 34.636 41.2117C34.0386 41.2117 33.5541 40.727 33.554 40.1296C33.554 39.5322 34.0385 39.0476 34.636 39.0476Z" fill="black" stroke="black"/>
<path d="M23.5632 39.5364C23.5632 42.0673 27.5177 42.1857 27.5177 39.5364" stroke="black" stroke-linecap="round"/>
<path d="M3.93206 50.5046C3.65848 50.5422 3.46712 50.7944 3.50464 51.0679C3.54216 51.3415 3.79435 51.5329 4.06794 51.4954L4 51L3.93206 50.5046ZM9 43H8.5C8.5 44.1886 8.41495 45.9453 7.78762 47.4697C7.17251 48.9644 6.05048 50.2141 3.93206 50.5046L4 51L4.06794 51.4954C6.61618 51.1459 7.99415 49.5956 8.71238 47.8503C9.41838 46.1347 9.5 44.2114 9.5 43H9Z" fill="black"/>
<path d="M49.164 40.5C50.1981 40.5002 51.0361 41.3389 51.0361 42.373C51.0359 43.407 50.198 44.2449 49.164 44.2451C48.1299 44.2451 47.2911 43.4071 47.291 42.373C47.291 41.3388 48.1298 40.5 49.164 40.5Z" fill="white" stroke="black"/>
<path d="M45.9321 50.1776C45.6585 50.2151 45.4671 50.4673 45.5046 50.7409C45.5422 51.0145 45.7944 51.2059 46.0679 51.1683L46 50.673L45.9321 50.1776ZM51 42.673H50.5C50.5 43.8615 50.415 45.6183 49.7876 47.1427C49.1725 48.6374 48.0505 49.8871 45.9321 50.1776L46 50.673L46.0679 51.1683C48.6162 50.8189 49.9942 49.2685 50.7124 47.5233C51.4184 45.8077 51.5 43.8844 51.5 42.673H51Z" fill="black"/>
<path d="M15.6543 34L17.2361 35.5818" stroke="black" stroke-linecap="round"/>
<path d="M36.2173 34L34.6356 35.5818" stroke="black" stroke-linecap="round"/>
</svg>`;

const addIconSvg = `<svg width="44" height="47" viewBox="0 0 44 47" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 23.5H41M22 3V44" stroke="#EBC08C" stroke-width="6" stroke-linecap="round"/>
</svg>`;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { effectiveTheme } = useTheme();
  const backgroundColor = effectiveTheme === 'dark' ? '#B0B0B0' : '#FFFFFB';
  
  // 根据 Figma 设计，计算相对位置
  // Figma 设计宽度为 393px，需要根据实际屏幕宽度进行缩放
  const scale = width / 393;

  // 使用 PanResponder 处理右滑手势（从右向左滑动）
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 只响应水平滑动，且水平滑动距离大于垂直滑动距离
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 5 // 降低初始滑动距离要求
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 检测右滑：从左向右滑动（dx > 0 表示向右）
        if (gestureState.dx > 50 || gestureState.vx > 0.3) {
          // 右滑，返回 Calendar 页面
          try {
            navigation.navigate('Calendar');
          } catch (error) {
            console.error('Navigation error:', error);
          }
        }
      },
    })
  ).current;
  
  return (
    <View style={[styles.container, { backgroundColor }]} {...panResponder.panHandlers}>
      <GridBackground />
      
      {/* 三个卡片 */}
      {/* 粉色卡片 - 左上 */}
      <TouchableOpacity
        style={[styles.card, styles.pinkCard, { 
          left: 27 * scale, 
          top: 84 * scale,
          width: 160 * scale,
          height: 202 * scale,
        }]}
        onPress={() => navigation.navigate('TomatoTimer')}
        activeOpacity={0.8}
      >
        {/* 番茄图标 */}
        <View style={[styles.iconContainer, {
          left: (74 - 27) * scale,
          top: (150 - 84) * scale,
          width: 65.74 * scale,
          height: 64 * scale,
        }]}>
          <SvgXml xml={tomatoIconSvg} width="100%" height="100%" />
        </View>
      </TouchableOpacity>

      {/* 蓝色卡片 - 右上 */}
      <TouchableOpacity
        style={[styles.card, styles.blueCard, { 
          left: 206 * scale, 
          top: 84 * scale,
          width: 160 * scale,
          height: 202 * scale,
        }]}
        onPress={() => navigation.navigate('CheckIn')}
        activeOpacity={0.8}
      >
        {/* 卡片图标 */}
        <View style={[styles.iconContainer, {
          left: (257 - 206) * scale,
          top: (141 - 84) * scale,
          width: 70 * scale,
          height: 81 * scale,
        }]}>
          <SvgXml xml={cardIconSvg} width="100%" height="100%" />
        </View>
      </TouchableOpacity>

      {/* 橙色卡片 - 左下 */}
      <View style={[styles.card, styles.orangeCard, { 
        left: 27 * scale, 
        top: 302 * scale,
        width: 160 * scale,
        height: 202 * scale,
        justifyContent: 'center',
        alignItems: 'center',
      }]}>
        {/* 添加图标 - 居中显示 */}
        <View style={{
          width: 44 * scale,
          height: 47 * scale,
        }}>
          <SvgXml xml={addIconSvg} width="100%" height="100%" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFB',
  },
  card: {
    position: 'absolute',
    borderRadius: 20,
  },
  pinkCard: {
    backgroundColor: '#FFC3C4',
  },
  blueCard: {
    backgroundColor: '#C2F1FF',
  },
  orangeCard: {
    backgroundColor: '#FFD9AA',
  },
  iconContainer: {
    position: 'absolute',
  },
});

