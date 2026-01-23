import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const GRID_SIZE = 29; // 网格单元格大小（基于Figma的28.97）
const GRID_COLOR_LIGHT = '#E0DED3'; // 网格线颜色（浅色模式）
const GRID_COLOR_DARK = '#FFFFFF'; // 网格线颜色（灰白模式）
const BACKGROUND_COLOR_LIGHT = '#FFFFFB'; // 背景颜色（浅色模式）
const BACKGROUND_COLOR_DARK = '#B0B0B0'; // 背景颜色（灰白模式）

interface GridBackgroundProps {
  containerHeight?: number;
  theme?: 'light' | 'dark'; // 主题模式
}

export default function GridBackground({ containerHeight = height * 2, theme }: GridBackgroundProps) {
  const { effectiveTheme } = useTheme();
  const resolvedTheme = theme || effectiveTheme;
  // 固定14条竖线，平均分布
  const verticalLinesCount = 14;
  const verticalSpacing = width / verticalLinesCount; // 计算平均间距
  const horizontalLines = Math.ceil(containerHeight / GRID_SIZE);
  
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;
  const backgroundColor = isDark ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR_LIGHT;

  return (
    <View style={[styles.container, { height: containerHeight, backgroundColor }]} pointerEvents="none">
      {/* 垂直线 - 14条平均分布 */}
      {Array.from({ length: verticalLinesCount }).map((_, index) => (
        <View
          key={`vertical-${index}`}
          style={[
            styles.line,
            styles.verticalLine,
            { left: index * verticalSpacing, backgroundColor: gridColor },
          ]}
        />
      ))}
      {/* 水平线 */}
      {Array.from({ length: horizontalLines + 1 }).map((_, index) => (
        <View
          key={`horizontal-${index}`}
          style={[
            styles.line,
            styles.horizontalLine,
            { top: index * GRID_SIZE, backgroundColor: gridColor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 0,
  },
  line: {
    position: 'absolute',
    // backgroundColor 在组件中动态设置
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    width: '100%',
    height: 1,
  },
});

