import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { petsAPI } from '../../utils/api';

export default function PetDetails() {
  const { id } = useLocalSearchParams();
  const [pet, setPet] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPetDetails();
  }, [id]);

  const loadPetDetails = async () => {
    try {
      setLoading(true);
      const data = await petsAPI.getById(id);
      setPet(data.pet);
      setSightings(data.sightings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pet details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Help find this ${pet.type} pet! ${pet.description}`,
        title: 'Sheltr - Lost Pet Alert',
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E07A5F" />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Pet not found</Text>
      </View>
    );
  }

  // Prepare map markers
  const allLocations = [
    {
      coordinate: {
        latitude: pet.initialLocation.coordinates[1],
        longitude: pet.initialLocation.coordinates[0],
      },
      title: 'Initial Sighting',
      time: pet.initialTime,
      isInitial: true,
    },
    ...sightings.map(s => ({
      coordinate: {
        latitude: s.location.coordinates[1],
        longitude: s.location.coordinates[0],
      },
      title: 'Sighting',
      time: s.sightedAt,
      isInitial: false,
    })),
  ];

  const mapRegion = allLocations.length > 0 ? {
    latitude: allLocations[0].coordinate.latitude,
    longitude: allLocations[0].coordinate.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return (
    <ScrollView style={styles.container}>
      {pet.imageUrl && (
        <Image source={{ uri: pet.imageUrl }} style={styles.heroImage} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.type}>
              {pet.type === 'lost' ? '🔍 Lost Pet' : '🐾 Stray Found'}
            </Text>
            <Text style={styles.date}>
              Reported: {new Date(pet.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={24} color="#E07A5F" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={20} color="#666" />
            <Text style={styles.statText}>{pet.viewCount} views</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.statText}>{sightings.length + 1} sightings</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{pet.description}</Text>

        {pet.breeds.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Breed(s)</Text>
            <View style={styles.tagsContainer}>
              {pet.breeds.map((breed, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{breed}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {pet.colors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Color(s)</Text>
            <View style={styles.tagsContainer}>
              {pet.colors.map((color, index) => (
                <View key={index} style={[styles.tag, styles.colorTag]}>
                  <Text style={styles.tagText}>{color}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {pet.behavior && (
          <>
            <Text style={styles.sectionTitle}>Behavior</Text>
            <Text style={styles.description}>{pet.behavior}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Location Track</Text>
        {mapRegion && (
          <MapView style={styles.map} initialRegion={mapRegion}>
            {allLocations.map((location, index) => (
              <Marker
                key={index}
                coordinate={location.coordinate}
                pinColor={location.isInitial ? '#E07A5F' : '#4A90E2'}
                title={location.title}
                description={new Date(location.time).toLocaleString()}
              />
            ))}
            {allLocations.length > 1 && (
              <Polyline
                coordinates={allLocations.map(l => l.coordinate)}
                strokeColor="#E07A5F"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        )}

        <Text style={styles.sectionTitle}>Sighting History</Text>
        <View style={styles.sightingsList}>
          <View style={styles.sightingItem}>
            <View style={styles.timeline}>
              <View style={[styles.dot, styles.initialDot]} />
              {sightings.length > 0 && <View style={styles.line} />}
            </View>
            <View style={styles.sightingContent}>
              <Text style={styles.sightingTitle}>Initial Report</Text>
              <Text style={styles.sightingTime}>
                {new Date(pet.initialTime).toLocaleString()}
              </Text>
              <Text style={styles.sightingLocation}>
                📍 {pet.initialLocation.address}
              </Text>
              <Text style={styles.sightingUser}>
                By: {pet.userId.username}
              </Text>
            </View>
          </View>

          {sightings.map((sighting, index) => (
            <View key={sighting._id} style={styles.sightingItem}>
              <View style={styles.timeline}>
                <View style={styles.dot} />
                {index < sightings.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.sightingContent}>
                <Text style={styles.sightingTitle}>Sighting #{index + 1}</Text>
                <Text style={styles.sightingTime}>
                  {new Date(sighting.sightedAt).toLocaleString()}
                </Text>
                <Text style={styles.sightingLocation}>
                  📍 {sighting.location.address}
                </Text>
                {sighting.notes && (
                  <Text style={styles.sightingNotes}>{sighting.notes}</Text>
                )}
                <Text style={styles.sightingUser}>
                  By: {sighting.userId.username}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.push(`/report-sighting/${id}`)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.reportButtonText}>Report a Sighting</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  type: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E07A5F',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  shareButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
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
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  sightingsList: {
    marginTop: 10,
  },
  sightingItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeline: {
    width: 30,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
  },
  initialDot: {
    backgroundColor: '#E07A5F',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: 5,
  },
  sightingContent: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  sightingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sightingTime: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  sightingLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  sightingNotes: {
    fontSize: 13,
    color: '#333',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  sightingUser: {
    fontSize: 12,
    color: '#999',
  },
  reportButton: {
    backgroundColor: '#E07A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});
