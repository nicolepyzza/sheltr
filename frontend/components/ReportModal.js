import React, { useState, useEffect } from 'react';
import {
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { petsAPI } from '../utils/api';

export default function ReportModal({ visible, onClose, onSubmit }) {
  const [type, setType] = useState('lost');
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [breedInput, setBreedInput] = useState('');
  const [breeds, setBreeds] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState([]);
  const [behavior, setBehavior] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      requestLocationPermission();
    }
  }, [visible]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to report pets');
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      
      // Reverse geocode to get address
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
      console.error(error);
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
      console.error(error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error(error);
    }
  };

  const addBreed = () => {
    if (breedInput.trim()) {
      setBreeds([...breeds, breedInput.trim()]);
      setBreedInput('');
    }
  };

  const removeBreed = (index) => {
    setBreeds(breeds.filter((_, i) => i !== index));
  };

  const addColor = () => {
    if (colorInput.trim()) {
      setColors([...colors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const removeColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please provide an address');
      return;
    }

    try {
      setLoading(true);
      
      const petData = {
        type,
        description: description.trim(),
        breeds,
        colors,
        behavior: behavior.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        address: address.trim(),
        initialTime: useCurrentTime ? new Date().toISOString() : customTime,
      };

      if (image) {
        petData.image = image;
      }

      await petsAPI.create(petData);
      
      Alert.alert('Success', 'Pet report submitted successfully!');
      resetForm();
      onSubmit();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('lost');
    setImage(null);
    setDescription('');
    setBreedInput('');
    setBreeds([]);
    setColorInput('');
    setColors([]);
    setBehavior('');
    setAddress('');
    setUseCurrentTime(true);
    setCustomTime('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Report a Pet</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Type *</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'lost' && styles.typeButtonActive]}
              onPress={() => setType('lost')}
            >
              <Text style={[styles.typeText, type === 'lost' && styles.typeTextActive]}>
                🔍 Lost Pet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'stray' && styles.typeButtonActive]}
              onPress={() => setType('stray')}
            >
              <Text style={[styles.typeText, type === 'stray' && styles.typeTextActive]}>
                🐾 Stray Found
              </Text>
            </TouchableOpacity>
          </View>

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
              <View style={styles.imagePickers}>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color="#E07A5F" />
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="images" size={32} color="#E07A5F" />
                  <Text style={styles.imageButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the pet and circumstances..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />

          <Text style={styles.label}>Breed(s)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Enter breed"
              value={breedInput}
              onChangeText={setBreedInput}
              onSubmitEditing={addBreed}
            />
            <TouchableOpacity style={styles.addButton} onPress={addBreed}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {breeds.map((breed, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{breed}</Text>
                <TouchableOpacity onPress={() => removeBreed(index)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Color(s)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Enter color"
              value={colorInput}
              onChangeText={setColorInput}
              onSubmitEditing={addColor}
            />
            <TouchableOpacity style={styles.addButton} onPress={addColor}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {colors.map((color, index) => (
              <View key={index} style={[styles.tag, styles.colorTag]}>
                <Text style={styles.tagText}>{color}</Text>
                <TouchableOpacity onPress={() => removeColor(index)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Behavior</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Friendly, scared, aggressive, etc."
            value={behavior}
            onChangeText={setBehavior}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <Text style={styles.label}>Location *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter address or intersection"
              value={address}
              onChangeText={setAddress}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#E07A5F" />
              ) : (
                <Ionicons name="locate" size={24} color="#E07A5F" />
              )}
            </TouchableOpacity>
          </View>

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
            <TextInput
              style={styles.input}
              placeholder="Custom time (optional)"
              value={customTime}
              onChangeText={setCustomTime}
            />
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#E07A5F',
    backgroundColor: '#FFF5F3',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  typeTextActive: {
    color: '#E07A5F',
    fontWeight: 'bold',
  },
  imageContainer: {
    marginBottom: 15,
  },
  imagePickers: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  imageButtonText: {
    marginTop: 8,
    fontSize: 12,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#E07A5F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  colorTag: {
    backgroundColor: '#FFF3E0',
  },
  tagText: {
    fontSize: 13,
    color: '#666',
    marginRight: 6,
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
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
