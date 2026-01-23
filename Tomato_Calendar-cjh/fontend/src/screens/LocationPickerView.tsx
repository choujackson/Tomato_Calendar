import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';

const { width, height } = Dimensions.get('window');

interface LocationItem {
  id: string;
  name: string;
  icon?: string;
}

// 示例位置数据
const recentLocations: LocationItem[] = [
  { id: '1', name: 'Fuzhou University' },
  { id: '2', name: 'Maynooth University' },
];

export default function LocationPickerView() {
  const navigation = useNavigation<LocationPickerScreenNavigationProp>();
  const { setSelectedLocation } = useLocation();
  const [searchText, setSearchText] = useState('');

  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Modal Sheet */}
      <View style={styles.modalSheet}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Location</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#999999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Location"
              placeholderTextColor="#999999"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={16} color="#999999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Recents Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recents</Text>
            <View style={styles.divider} />
            
            {recentLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(location.name)}
              >
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={20} color="#1E1E1E" />
                </View>
                <Text style={styles.locationText}>{location.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Common Locations Section */}
          <View style={styles.section}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => handleLocationSelect('Current Location')}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#1E1E1E" />
              </View>
              <Text style={styles.locationText}>Current Location</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => handleLocationSelect('Fuzhou University')}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#1E1E1E" />
              </View>
              <Text style={styles.locationText}>Fuzhou University</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => handleLocationSelect('Maynooth University')}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#1E1E1E" />
              </View>
              <Text style={styles.locationText}>Maynooth University</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    height: height * 0.9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.18,
    shadowRadius: 11.1,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 10,
  },
  headerSpacer: {
    width: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#333333',
    textAlign: 'center',
  },
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#FF5F57',
  },
  searchContainer: {
    paddingHorizontal: 19,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#757575',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#757575',
    marginVertical: 0,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  locationIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 17,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#333333',
    flex: 1,
  },
});

