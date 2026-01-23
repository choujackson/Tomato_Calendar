import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocationProvider } from './src/context/LocationContext';
import { PlanProvider } from './src/context/PlanContext';
import { DateProvider } from './src/context/DateContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import CalendarView from './src/screens/CalendarView';
import DetailView from './src/screens/DetailView';
import AddPlanView from './src/screens/AddPlanView';
import LocationPickerView from './src/screens/LocationPickerView';
import HomeScreen from './src/screens/HomeScreen';
import TomatoTimerScreen from './src/screens/TomatoTimerScreen';
import CheckInContainer from './src/screens/CheckInContainer';
import UserProfileScreen from './src/screens/UserProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
  Home: undefined;
  Calendar: undefined;
  Detail: { date: string };
  AddPlan: { date: string; planId?: string }; // planId可选，如果有则是编辑模式
  LocationPicker: undefined;
  TomatoTimer: undefined;
  CheckIn: undefined;
  UserProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DateProvider>
          <PlanProvider>
            <LocationProvider>
              <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Calendar" component={CalendarView} />
          <Stack.Screen name="TomatoTimer" component={TomatoTimerScreen} />
          <Stack.Screen name="CheckIn" component={CheckInContainer} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen 
            name="Detail" 
            component={DetailView}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="AddPlan" 
            component={AddPlanView}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen 
            name="LocationPicker" 
            component={LocationPickerView}
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
            </LocationProvider>
          </PlanProvider>
        </DateProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

