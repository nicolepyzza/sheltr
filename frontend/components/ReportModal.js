import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Image, Alert, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { petsAPI } from '../utils/api';
import { DOG_BREEDS, CAT_BREEDS, PET_COLORS, PET_BEHAVIORS } from '../utils/petData';
import AddressAutocomplete from './AddressAutocomplete';

export default function ReportModal({ visible, onClose, onSubmit }) {
  const [type, setType] = useState('lost');
  const [petType, setPetType] = useState('dog');
  const [petName, setPetName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [breedInput, setBreedInput] = useState('');
  const [breeds, setBreeds] = useState([]);
  const [breedSuggestions, setBreedSuggestions] = useState([]);
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState([]);
  const [colorSuggestions, setColorSuggestions] = useState([]);
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);
  const [behaviorInput, setBehaviorInput] = useState('');
  const [behaviors, setBehaviors] = useState([]);
  const [behaviorSuggestions, setBehaviorSuggestions] = useState([]);
  const [showBehaviorSuggestions, setShowBehaviorSuggestions] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (visible) requestLocationPermission();
  }, [visible]);

  useEffect(() => {
    if (breedInput.length > 0) {
      const list = petType === 'dog' ? DOG_BREEDS : petType === 'cat' ? CAT_BREEDS : [];
      const filtered = list.filter(b => b.toLowerCase().includes(breedInput.toLowerCase()));
      setBreedSuggestions(filtered.slice(0, 5));
      setShowBreedSuggestions(filtered.length > 0);
    } else setShowBreedSuggestions(false);
  }, [breedInput, petType]);

  useEffect(() => {
    if (colorInput.length > 0) {
      const filtered = PET_COLORS.filter(c => c.toLowerCase().includes(colorInput.toLowerCase()));
      setColorSuggestions(filtered.slice(0, 5));
      setShowColorSuggestions(filtered.length > 0);
    } else setShowColorSuggestions(false);
  }, [colorInput]);

  useEffect(() => {
    if (behaviorInput.length > 0) {
      const filtered = PET_BEHAVIORS.filter(b => b.toLowerCase().includes(behaviorInput.toLowerCase()));
      setBehaviorSuggestions(filtered.slice(0, 5));
      setShowBehaviorSuggestions(filtered.length > 0);
    } else setShowBehaviorSuggestions(false);
  }, [behaviorInput]);

  const requestLocationPermission = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch (error) {}
  };

  const handleAddressSelect = ({ address: addr, latitude, longitude }) => {
    setAddress(addr);
    setLocation({ latitude, longitude });
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const addressData = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addressData.length > 0) {
        const a = addressData[0];
        setAddress(`${a.street || ''} ${a.city || ''}, ${a.region || ''}`.trim());
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
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (error) {}
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (error) {}
  };

  const addBreed = (breed) => {
    if (breed && !breeds.includes(breed)) setBreeds([...breeds, breed]);
    setBreedInput('');
    setShowBreedSuggestions(false);
  };

  const addColor = (color) => {
    if (color && !colors.includes(color)) setColors([...colors, color]);
    setColorInput('');
    setShowColorSuggestions(false);
  };

  const addBehavior = (behavior) => {
    if (behavior && !behaviors.includes(behavior)) setBehaviors([...behaviors, behavior]);
    setBehaviorInput('');
    setShowBehaviorSuggestions(false);
  };

  const handleTimeChange = (text) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length >= 2) formatted = digits.substring(0, 2) + ':' + digits.substring(2, 4);
    setCustomTime(formatted);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return Alert.alert('Error', 'Please provide a description');
    if (!location) return Alert.alert('Error', 'Location is required');
    if (!address.trim()) return Alert.alert('Error', 'Please provide an address');
    if (!useCurrentTime && !customTime.trim()) return Alert.alert('Error', 'Please specify a time or use current time');
    if (!useCurrentTime && !/^\d{2}:\d{2}$/.test(customTime)) return Alert.alert('Error', 'Time must be in HH:MM format (e.g., 14:30)');
    
    // Additional validation for lost pets
    if (type === 'lost') {
      if (!petName.trim()) return Alert.alert('Error', 'Pet name is required for lost pets');
      if (!image) return Alert.alert('Error', 'Photo is required for lost pets');
      if (breeds.length === 0) return Alert.alert('Error', 'At least one breed is required for lost pets');
    }

    try {
      setLoading(true);
      const petData = {
        type, petType, description: description.trim(), breeds, colors,
        behavior: behaviors.join(', '),
        latitude: location.latitude,
        longitude: location.longitude,
        address: address.trim(),
        initialTime: useCurrentTime ? new Date().toISOString() : customTime,
      };
      if (petName) petData.petName = petName.trim();
      if (contactPhone) petData.contactPhone = contactPhone.trim();
      if (microchipNumber) petData.microchipNumber = microchipNumber.trim();
      if (image) petData.image = image;
      await petsAPI.create(petData);
      Alert.alert('Success', 'Pet report submitted successfully!');
      resetForm();
      onSubmit();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('lost'); setPetType('dog'); setPetName(''); setContactPhone(''); setMicrochipNumber('');
    setImage(null); setDescription('');
    setBreedInput(''); setBreeds([]); setColorInput(''); setColors([]);
    setBehaviorInput(''); setBehaviors([]); setAddress('');
    setUseCurrentTime(true); setCustomTime('');
  };

  const renderSuggestions = (suggestions, onPress) => (
    <View style={styles.suggestionsContainer}>
      {suggestions.map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => onPress(item)}>
          <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Report a Pet</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Type *</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity style={[styles.typeButton, type === 'lost' && styles.typeButtonActive]} onPress={() => setType('lost')}>
              <Text style={[styles.typeText, type === 'lost' && styles.typeTextActive]}>🔍 Lost Pet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, type === 'stray' && styles.typeButtonActive]} onPress={() => setType('stray')}>
              <Text style={[styles.typeText, type === 'stray' && styles.typeTextActive]}>🐾 Stray Found</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Animal Type *</Text>
          <View style={styles.typeContainer}>
            {['dog', 'cat', 'other'].map(t => (
              <TouchableOpacity key={t} style={[styles.petTypeButton, petType === t && styles.typeButtonActive]} onPress={() => setPetType(t)}>
                <Text style={[styles.typeText, petType === t && styles.typeTextActive]}>
                  {t === 'dog' ? '🐕 Dog' : t === 'cat' ? '🐈 Cat' : '🦎 Other'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'lost' && (
            <>
              <Text style={styles.label}>Pet's Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="What's your pet's name?"
                value={petName}
                onChangeText={setPetName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Your Phone Number</Text>
              <Text style={styles.helperText}>Private - only shown to you</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Microchip Number</Text>
              <Text style={styles.helperText}>Always kept private</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional"
                value={microchipNumber}
                onChangeText={setMicrochipNumber}
                autoCapitalize="characters"
              />
            </>
          )}

          <Text style={styles.label}>{type === 'lost' ? 'Photo *' : 'Photo (Optional)'}</Text>
          <View style={styles.imageContainer}>
            {image ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
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
          <TextInput style={styles.textArea} placeholder="Describe the pet..." value={description} onChangeText={setDescription} multiline numberOfLines={4} maxLength={1000} />

          <Text style={styles.label}>{type === 'lost' ? 'Breed(s) *' : 'Breed(s)'}</Text>
          <View style={styles.tagInputContainer}>
            <TextInput style={styles.tagInput} placeholder="Start typing..." value={breedInput} onChangeText={setBreedInput} onSubmitEditing={() => addBreed(breedInput)} />
            <TouchableOpacity style={styles.addButton} onPress={() => addBreed(breedInput)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {showBreedSuggestions && renderSuggestions(breedSuggestions, addBreed)}
          <View style={styles.tagsContainer}>
            {breeds.map((b, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{b}</Text>
                <TouchableOpacity onPress={() => setBreeds(breeds.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Color(s)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput style={styles.tagInput} placeholder="Start typing..." value={colorInput} onChangeText={setColorInput} onSubmitEditing={() => addColor(colorInput)} />
            <TouchableOpacity style={styles.addButton} onPress={() => addColor(colorInput)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {showColorSuggestions && renderSuggestions(colorSuggestions, addColor)}
          <View style={styles.tagsContainer}>
            {colors.map((c, i) => (
              <View key={i} style={[styles.tag, styles.colorTag]}>
                <Text style={styles.tagText}>{c}</Text>
                <TouchableOpacity onPress={() => setColors(colors.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Behavior</Text>
          <View style={styles.tagInputContainer}>
            <TextInput style={styles.tagInput} placeholder="Start typing..." value={behaviorInput} onChangeText={setBehaviorInput} onSubmitEditing={() => addBehavior(behaviorInput)} />
            <TouchableOpacity style={styles.addButton} onPress={() => addBehavior(behaviorInput)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {showBehaviorSuggestions && renderSuggestions(behaviorSuggestions, addBehavior)}
          <View style={styles.tagsContainer}>
            {behaviors.map((b, i) => (
              <View key={i} style={[styles.tag, styles.behaviorTag]}>
                <Text style={styles.tagText}>{b}</Text>
                <TouchableOpacity onPress={() => setBehaviors(behaviors.filter((_, idx) => idx !== i))}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Location *</Text>
          <AddressAutocomplete 
            value={address}
            onSelect={handleAddressSelect}
          />

          <Text style={styles.label}>Time</Text>
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setUseCurrentTime(!useCurrentTime)}>
            <Ionicons name={useCurrentTime ? 'checkbox' : 'square-outline'} size={24} color="#E07A5F" />
            <Text style={styles.checkboxLabel}>Use current time</Text>
          </TouchableOpacity>
          {!useCurrentTime && (
            <>
              <Text style={styles.helpText}>Enter time as HHMM (e.g., 1430 for 2:30 PM)</Text>
              <TextInput style={styles.input} placeholder="HH:MM" value={customTime} onChangeText={handleTimeChange} keyboardType="numeric" maxLength={5} />
            </>
          )}

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Report</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
  helpText: { fontSize: 12, color: '#999', marginBottom: 5 },
  helperText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: -4, marginBottom: 8 },
  typeContainer: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  petTypeButton: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  typeButtonActive: { borderColor: '#E07A5F', backgroundColor: '#FFF5F3' },
  typeText: { fontSize: 14, color: '#666' },
  typeTextActive: { color: '#E07A5F', fontWeight: 'bold' },
  imageContainer: { marginBottom: 15 },
  imagePickers: { flexDirection: 'row', gap: 10 },
  imageButton: { flex: 1, padding: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', alignItems: 'center' },
  imageButtonText: { marginTop: 8, fontSize: 12, color: '#666' },
  imagePreview: { position: 'relative' },
  image: { width: '100%', height: 200, borderRadius: 10 },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, flex: 1 },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  tagInputContainer: { flexDirection: 'row', gap: 10 },
  tagInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14 },
  addButton: { width: 48, height: 48, backgroundColor: '#E07A5F', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  suggestionsContainer: { backgroundColor: '#f9f9f9', borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: '#ddd' },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionText: { fontSize: 14, color: '#333' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F4F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  colorTag: { backgroundColor: '#FFF3E0' },
  behaviorTag: { backgroundColor: '#E8F5E9' },
  tagText: { fontSize: 13, color: '#666', marginRight: 6 },
  locationContainer: { flexDirection: 'row', gap: 10 },
  locationButton: { width: 48, height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  checkboxLabel: { fontSize: 14, color: '#666', marginLeft: 8 },
  submitButton: { backgroundColor: '#E07A5F', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
