import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function AddressAutocomplete({ value, onSelect, style }) {
  const [address, setAddress] = useState(value || '');
  const [loading, setLoading] = useState(false);

  const handleAddressChange = (text) => {
    setAddress(text);
  };

  const validateAndSelectAddress = async () => {
    if (!address.trim()) return;

    try {
      setLoading(true);
      // Geocode the address to validate and get coordinates
      const results = await Location.geocodeAsync(address);
      
      if (results && results.length > 0) {
        const location = results[0];
        
        // Reverse geocode to get formatted address
        const reverseResults = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        if (reverseResults && reverseResults.length > 0) {
          const addr = reverseResults[0];
          const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          
          onSelect({
            address: formattedAddress,
            latitude: location.latitude,
            longitude: location.longitude,
          });
          setAddress(formattedAddress);
        }
      } else {
        alert('Address not found. Please try a different format (e.g., "123 Main St, City, State")');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Could not validate address. Please check the format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const results = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (results && results.length > 0) {
        const addr = results[0];
        const formattedAddress = `${addr.street || ''} ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        
        onSelect({
          address: formattedAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Location error:', error);
      alert('Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter address (e.g., 123 Main St, City, State)"
          value={address}
          onChangeText={handleAddressChange}
          onSubmitEditing={validateAndSelectAddress}
        />
        <TouchableOpacity 
          style={styles.validateButton} 
          onPress={validateAndSelectAddress}
          disabled={loading || !address.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={useCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#E07A5F" />
          ) : (
            <Ionicons name="locate" size={20} color="#E07A5F" />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.helpText}>
        Enter an address and tap ✓ to validate, or tap 📍 for current location
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  validateButton: {
    width: 44,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
  },
});
