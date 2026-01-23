import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// User Icon SVG (深色版本 - 高亮)
const userIconSvgDark = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6666 28V25.3333C26.6666 23.9188 26.1047 22.5623 25.1045 21.5621C24.1044 20.5619 22.7478 20 21.3333 20H10.6666C9.25216 20 7.8956 20.5619 6.89541 21.5621C5.89522 22.5623 5.33331 23.9188 5.33331 25.3333V28M21.3333 9.33333C21.3333 12.2789 18.9455 14.6667 16 14.6667C13.0545 14.6667 10.6666 12.2789 10.6666 9.33333C10.6666 6.38781 13.0545 4 16 4C18.9455 4 21.3333 6.38781 21.3333 9.33333Z" stroke="#1E1E1E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// User Icon SVG (浅色版本 - 变灰)
const userIconSvgLight = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6666 28V25.3333C26.6666 23.9188 26.1047 22.5623 25.1045 21.5621C24.1044 20.5619 22.7478 20 21.3333 20H10.6666C9.25216 20 7.8956 20.5619 6.89541 21.5621C5.89522 22.5623 5.33331 23.9188 5.33331 25.3333V28M21.3333 9.33333C21.3333 12.2789 18.9455 14.6667 16 14.6667C13.0545 14.6667 10.6666 12.2789 10.6666 9.33333C10.6666 6.38781 13.0545 4 16 4C18.9455 4 21.3333 6.38781 21.3333 9.33333Z" stroke="#B3B3B3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Users Icon SVG (深色版本 - 高亮)
const usersIconSvgDark = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2_3274)">
<path d="M22.6666 28V25.3333C22.6666 23.9188 22.1047 22.5623 21.1045 21.5621C20.1044 20.5619 18.7478 20 17.3333 20H6.66665C5.25216 20 3.8956 20.5619 2.89541 21.5621C1.89522 22.5623 1.33331 23.9188 1.33331 25.3333V28M30.6666 28V25.3333C30.6658 24.1516 30.2725 23.0037 29.5485 22.0698C28.8245 21.1358 27.8108 20.4688 26.6666 20.1733M21.3333 4.17333C22.4805 4.46707 23.4974 5.13427 24.2235 6.06975C24.9496 7.00523 25.3438 8.15577 25.3438 9.34C25.3438 10.5242 24.9496 11.6748 24.2235 12.6103C23.4974 13.5457 22.4805 14.2129 21.3333 14.5067M17.3333 9.33333C17.3333 12.2789 14.9455 14.6667 12 14.6667C9.05446 14.6667 6.66665 12.2789 6.66665 9.33333C6.66665 6.38781 9.05446 4 12 4C14.9455 4 17.3333 6.38781 17.3333 9.33333Z" stroke="#1E1E1E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2_3274">
<rect width="32" height="32" fill="white"/>
</clipPath>
</defs>
</svg>`;

// Users Icon SVG (浅色版本 - 变灰)
const usersIconSvgLight = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2_3274)">
<path d="M22.6666 28V25.3333C22.6666 23.9188 22.1047 22.5623 21.1045 21.5621C20.1044 20.5619 18.7478 20 17.3333 20H6.66665C5.25216 20 3.8956 20.5619 2.89541 21.5621C1.89522 22.5623 1.33331 23.9188 1.33331 25.3333V28M30.6666 28V25.3333C30.6658 24.1516 30.2725 23.0037 29.5485 22.0698C28.8245 21.1358 27.8108 20.4688 26.6666 20.1733M21.3333 4.17333C22.4805 4.46707 23.4974 5.13427 24.2235 6.06975C24.9496 7.00523 25.3438 8.15577 25.3438 9.34C25.3438 10.5242 24.9496 11.6748 24.2235 12.6103C23.4974 13.5457 22.4805 14.2129 21.3333 14.5067M17.3333 9.33333C17.3333 12.2789 14.9455 14.6667 12 14.6667C9.05446 14.6667 6.66665 12.2789 6.66665 9.33333C6.66665 6.38781 9.05446 4 12 4C14.9455 4 17.3333 6.38781 17.3333 9.33333Z" stroke="#B3B3B3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_2_3274">
<rect width="32" height="32" fill="white"/>
</clipPath>
</defs>
</svg>`;

interface BottomNavBarProps {
  currentIndex: number;
  onNavPress: (index: number) => void;
}

export default function BottomNavBar({ currentIndex, onNavPress }: BottomNavBarProps) {
  const scale = width / 393;
  const { effectiveTheme } = useTheme();
  const backgroundColor = effectiveTheme === 'dark' ? '#B0B0B0' : '#FFFFFB';

  return (
    <View style={[styles.bottomNavBar, {
      height: 98 * scale,
      backgroundColor,
    }]}>
      <View style={styles.navIconsContainer}>
        {/* User 图标 - index 0 (CheckInScreen) */}
        <TouchableOpacity
          style={[styles.navIconButton, {
            width: 32 * scale,
            height: 32 * scale,
          }]}
          onPress={() => onNavPress(0)}
        >
          <SvgXml 
            xml={currentIndex === 0 ? userIconSvgDark : userIconSvgLight} 
            width="100%" 
            height="100%" 
          />
        </TouchableOpacity>

        {/* Users 图标 - index 1 (CheckInPlazaScreen) */}
        <TouchableOpacity
          style={[styles.navIconButton, {
            width: 32 * scale,
            height: 32 * scale,
            marginLeft: 130 * scale,
          }]}
          onPress={() => onNavPress(1)}
        >
          <SvgXml 
            xml={currentIndex === 1 ? usersIconSvgDark : usersIconSvgLight} 
            width="100%" 
            height="100%" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
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
});

