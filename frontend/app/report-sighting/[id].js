import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { sightingsAPI } from '../../utils/api';
import AddressAutocomplete from '../../components/AddressAutocomplete';

export default function ReportSighting() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  React.useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch (error) {}
  };

  const handleAddressSelect = ({ address: addr, latitude, longitude }) => {
    setAddress(addr);
    setLocation({ latitude, longitude });
  };

  const handleTimeChange = (text) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = digits.substring(0, 2) + ':' + digits.substring(2, 4);
    }
    setCustomTime(formatted);
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      
      const addressData = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (addressData.length > 0) {
        const addr = addressData[0];
        const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''}`.trim();
        setAddress(formattedAddress);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please provide an address');
      return;
    }

    if (!useCurrentTime && !customTime.trim()) {
      Alert.alert('Error', 'Please specify a time or use current time');
      return;
    }

    if (!useCurrentTime && !/^\d{2}:\d{2}$/.test(customTime)) {
      Alert.alert('Error', 'Time must be in HH:MM format (e.g., 14:30)');
      return;
    }

    try {
      setLoading(true);
      
      const sightingData = {
        petId: id,
        latitude: location.latitude,
        longitude: location.longitude,
        address: address.trim(),
        sightedAt: useCurrentTime ? new Date().toISOString() : customTime,
        notes: notes.trim(),
      };

      if (image) {
        sightingData.image = image;
      }

      await sightingsAPI.create(sightingData);
      
      Alert.alert('Success', 'Sighting reported successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit sighting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Report a Sighting</Text>

        <Text style={styles.label}>Photo (Optional)</Text>
        <View style={styles.imageContainer}>
          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={28} color="#E07A5F" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color="#E07A5F" />
              <Text style={styles.imageButtonText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Any additional details about this sighting..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <Text style={styles.label}>Location *</Text>
        <AddressAutocomplete 
          value={address}
          onSelect={handleAddressSelect}
        />

        <Text style={styles.label}>Time</Text>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setUseCurrentTime(!useCurrentTime)}
        >
          <Ionicons
            name={useCurrentTime ? 'checkbox' : 'square-outline'}
            size={24}
            color="#E07A5F"
          />
          <Text style={styles.checkboxLabel}>Use current time</Text>
        </TouchableOpacity>

        {!useCurrentTime && (
          <>
            <Text style={styles.helpText}>Enter time as HHMM (e.g., 1430 for 2:30 PM)</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              value={customTime}
              onChangeText={handleTimeChange}
              keyboardType="numeric"
              maxLength={5}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Sighting</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  imageContainer: {
    marginBottom: 15,
  },
  imageButton: {
    padding: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  imageButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  imagePreview: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#E07A5F',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
