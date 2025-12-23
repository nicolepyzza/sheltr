import React, { useState } from 'react';
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

export default function OwnerClaimModal({ visible, onClose, onSubmit, petId }) {
  const [photo, setPhoto] = useState(null);
  const [collarColor, setCollarColor] = useState('');
  const [hasMicrochip, setHasMicrochip] = useState(null);
  const [uniqueMarks, setUniqueMarks] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [loading, setLoading] = useState(false);

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
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
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
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Photo Required', 'Please provide a verification photo');
      return;
    }

    // Require at least 2 verification fields
    const filledFields = [
      collarColor.trim(),
      hasMicrochip !== null,
      uniqueMarks.trim(),
      microchipId.trim()
    ].filter(Boolean).length;

    if (filledFields < 2) {
      Alert.alert('More Details Needed', 'Please provide at least 2 verification details (collar color, microchip, unique marks, or microchip ID)');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        photo,
        collarColor: collarColor.trim(),
        hasMicrochip,
        uniqueMarks: uniqueMarks.trim(),
        microchipId: microchipId.trim()
      });
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhoto(null);
    setCollarColor('');
    setHasMicrochip(null);
    setUniqueMarks('');
    setMicrochipId('');
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
          <Text style={styles.title}>I Think This Is My Pet</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={24} color="#4A90E2" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Ownership Verification</Text>
              <Text style={styles.infoDescription}>
                To prevent false claims and protect pets:{'\n\n'}
                • Photo required (not already posted){'\n'}
                • At least 2 verification details{'\n'}
                • Original reporter will review{'\n'}
                • 24-48 hour review period{'\n\n'}
                Your microchip ID will never be shown publicly.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Verification Photo * (Required)</Text>
          <Text style={styles.helpText}>
            A photo of your pet that hasn't been posted yet
          </Text>
          <View style={styles.imageContainer}>
            {photo ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: photo.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setPhoto(null)}
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

          <Text style={styles.sectionHeader}>Provide at least 2 of the following:</Text>

          <Text style={styles.label}>Collar Color</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Red, Blue, None"
            value={collarColor}
            onChangeText={setCollarColor}
          />

          <Text style={styles.label}>Microchip</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setHasMicrochip(true)}
            >
              <Ionicons
                name={hasMicrochip === true ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color="#E07A5F"
              />
              <Text style={styles.radioLabel}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setHasMicrochip(false)}
            >
              <Ionicons
                name={hasMicrochip === false ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color="#E07A5F"
              />
              <Text style={styles.radioLabel}>No</Text>
            </TouchableOpacity>
          </View>

          {hasMicrochip === true && (
            <>
              <Text style={styles.label}>Microchip ID (Private)</Text>
              <Text style={styles.helpText}>
                Will never be shown publicly - only for verification
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter microchip number"
                value={microchipId}
                onChangeText={setMicrochipId}
                secureTextEntry
              />
            </>
          )}

          <Text style={styles.label}>Unique Marks or Features</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., White patch on chest, scar on left ear"
            value={uniqueMarks}
            onChangeText={setUniqueMarks}
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              False ownership claims may result in account suspension and legal action
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !photo}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Ownership Claim</Text>
              </>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 5,
  },
  infoDescription: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 15,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
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
  radioGroup: {
    flexDirection: 'row',
    gap: 30,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
