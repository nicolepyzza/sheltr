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
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { petsAPI } from '../../utils/api';
import ClaimFoundModal from '../../components/ClaimFoundModal';
import OwnerClaimModal from '../../components/OwnerClaimModal';
import { useAuth } from '../../context/AuthContext';

export default function PetDetails() {
  const { id } = useLocalSearchParams();
  const [pet, setPet] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showOwnerClaimModal, setShowOwnerClaimModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadPetDetails();
  }, [id]);

  // Reload data when screen comes back into focus (after reporting a sighting)
  useFocusEffect(
    React.useCallback(() => {
      if (id) loadPetDetails();
    }, [id])
  );

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

  const handleClaimFound = async (claimData) => {
    try {
      await petsAPI.claimFound(id, claimData);
      Alert.alert('Success', 'Your safety claim has been submitted for verification!');
      loadPetDetails(); // Refresh data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleConfirmClaim = async (claimId) => {
    try {
      await petsAPI.confirmFound(id, claimId);
      Alert.alert('Success', 'Pet marked as safe!');
      loadPetDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to confirm');
    }
  };

  const handleDisputeClaim = async (claimId) => {
    Alert.prompt(
      'Dispute Claim',
      'Why is this claim incorrect?',
      async (reason) => {
        if (reason) {
          try {
            await petsAPI.disputeFound(id, claimId, reason);
            Alert.alert('Success', 'Claim disputed. Pet marked as active.');
            loadPetDetails();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to dispute');
          }
        }
      }
    );
  };

  const handleOwnershipClaim = async (claimData) => {
    try {
      await petsAPI.claimOwnership(id, claimData);
      Alert.alert('Success', 'Your ownership claim has been submitted! The reporter will review it within 24-48 hours.');
      loadPetDetails();
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit ownership claim');
    }
  };

  const handleVerifyOwnership = async (claimId, approved) => {
    if (approved) {
      Alert.alert(
        'Approve Ownership',
        'Confirm this person is the owner?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              try {
                await petsAPI.verifyOwnership(id, claimId, true);
                Alert.alert('Success', 'Ownership verified!');
                loadPetDetails();
              } catch (error) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to verify');
              }
            }
          }
        ]
      );
    } else {
      Alert.prompt(
        'Deny Ownership',
        'Why is this claim incorrect?',
        async (reason) => {
          if (reason) {
            try {
              await petsAPI.verifyOwnership(id, claimId, false, reason);
              Alert.alert('Success', 'Ownership claim denied.');
              loadPetDetails();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to deny');
            }
          }
        }
      );
    }
  };

  const handleUpdateStatus = (newStatus) => {
    const statusLabels = {
      no_longer_sighted: 'No Longer Sighted',
      transferred_to_shelter: 'Transferred to Shelter'
    };

    Alert.alert(
      'Update Status',
      `Mark pet as "${statusLabels[newStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await petsAPI.updateStatus(id, newStatus);
              Alert.alert('Success', 'Status updated');
              loadPetDetails();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update');
            }
          }
        }
      ]
    );
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
        {/* Owner Unknown Banner (for strays) */}
        {pet.status === 'owner_unknown' && (
          <View style={styles.ownerUnknownBanner}>
            <Ionicons name="help-circle" size={24} color="#6B7280" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>🔍 Owner Unknown</Text>
              <Text style={styles.bannerDescription}>
                This pet was reported as a stray. If this is your pet, claim ownership below.
              </Text>
            </View>
          </View>
        )}

        {/* Ownership Pending Banner (for reporter to review) */}
        {pet.status === 'ownership_pending' && pet.ownershipClaims && pet.ownershipClaims.length > 0 && (
          <View style={styles.pendingBanner}>
            <Ionicons name="hourglass" size={24} color="#F59E0B" />
            <View style={styles.pendingText}>
              <Text style={styles.pendingTitle}>⏳ Ownership Claim Pending</Text>
              <Text style={styles.pendingDescription}>
                Someone claims to be the owner. {pet.userId._id === user?._id ? 'Please review their claim.' : 'Waiting for reporter verification.'}
              </Text>
              {pet.userId._id === user?._id && (
                <>
                  <View style={styles.claimPreview}>
                    <Image 
                      source={{ uri: pet.ownershipClaims[pet.ownershipClaims.length - 1].verificationPhoto }} 
                      style={styles.claimPreviewImage}
                    />
                    <View style={styles.claimPreviewInfo}>
                      <Text style={styles.claimUser}>
                        By: {pet.ownershipClaims[pet.ownershipClaims.length - 1].userId?.username}
                      </Text>
                      {pet.ownershipClaims[pet.ownershipClaims.length - 1].verificationAnswers?.collarColor && (
                        <Text style={styles.claimDetail}>
                          Collar: {pet.ownershipClaims[pet.ownershipClaims.length - 1].verificationAnswers.collarColor}
                        </Text>
                      )}
                      {pet.ownershipClaims[pet.ownershipClaims.length - 1].verificationAnswers?.uniqueMarks && (
                        <Text style={styles.claimDetail}>
                          Marks: {pet.ownershipClaims[pet.ownershipClaims.length - 1].verificationAnswers.uniqueMarks}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => handleVerifyOwnership(pet.ownershipClaims[pet.ownershipClaims.length - 1]._id, true)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.confirmButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.disputeButton}
                      onPress={() => handleVerifyOwnership(pet.ownershipClaims[pet.ownershipClaims.length - 1]._id, false)}
                    >
                      <Ionicons name="close-circle" size={16} color="#fff" />
                      <Text style={styles.disputeButtonText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Pending Found Claim Banner */}
        {pet.status === 'pending_found' && pet.foundClaims && pet.foundClaims.length > 0 && (
          <View style={styles.pendingBanner}>
            <Ionicons name="hourglass" size={24} color="#F59E0B" />
            <View style={styles.pendingText}>
              <Text style={styles.pendingTitle}>⏳ Safety Claim Pending</Text>
              <Text style={styles.pendingDescription}>
                Someone claims this pet is safe. {pet.claimedOwner && pet.claimedOwner._id === user?._id ? 'Please confirm.' : 'Waiting for owner confirmation.'}
              </Text>
              {pet.claimedOwner && pet.claimedOwner._id === user?._id && (
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleConfirmClaim(pet.foundClaims[pet.foundClaims.length - 1]._id)}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.disputeButton}
                    onPress={() => handleDisputeClaim(pet.foundClaims[pet.foundClaims.length - 1]._id)}
                  >
                    <Ionicons name="close-circle" size={16} color="#fff" />
                    <Text style={styles.disputeButtonText}>Dispute</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Found Status Banner */}
        {pet.status === 'found' && (
          <View style={styles.foundBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.foundText}>
              <Text style={styles.foundTitle}>✅ Pet is Safe!</Text>
              <Text style={styles.foundDescription}>
                This pet is now safe - at home, with a vet, or in foster care.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.type}>
              {pet.type === 'lost' ? '🔍 Lost Pet' : '🐾 Stray Found'}
            </Text>
            {pet.petName && (
              <Text style={styles.petName}>{pet.petName}</Text>
            )}
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

        {/* Private Contact Info (only for owner/reporter) */}
        {(pet.userId._id === user?._id || (pet.claimedOwner && pet.claimedOwner._id === user?._id)) && (
          <>
            {(pet.contactPhone || pet.microchipNumber) && (
              <View style={styles.privateInfoContainer}>
                <View style={styles.privateInfoHeader}>
                  <Ionicons name="lock-closed" size={16} color="#6B7280" />
                  <Text style={styles.privateInfoTitle}>Private Information</Text>
                </View>
                {pet.contactPhone && (
                  <View style={styles.privateInfoRow}>
                    <Ionicons name="call" size={16} color="#6B7280" />
                    <Text style={styles.privateInfoText}>{pet.contactPhone}</Text>
                  </View>
                )}
                {pet.microchipNumber && (
                  <View style={styles.privateInfoRow}>
                    <Ionicons name="qr-code" size={16} color="#6B7280" />
                    <Text style={styles.privateInfoText}>Microchip: {pet.microchipNumber}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

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

        {/* Actions Menu */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsSectionTitle}>Actions</Text>
          
          {/* Ownership claim button for non-owners viewing strays */}
          {!pet.claimedOwner && pet.userId._id !== user?._id && pet.status === 'owner_unknown' && (
            <TouchableOpacity
              style={styles.ownerClaimButton}
              onPress={() => setShowOwnerClaimModal(true)}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={styles.ownerClaimButtonText}>I Think This Is My Pet</Text>
            </TouchableOpacity>
          )}

          {/* Owner actions */}
          {pet.claimedOwner && pet.claimedOwner._id === user?._id && (
            <>
              {pet.status === 'active' && (
                <TouchableOpacity
                  style={styles.foundButton}
                  onPress={() => setShowClaimModal(true)}
                >
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text style={styles.foundButtonText}>Confirm Reunification</Text>
                </TouchableOpacity>
              )}
              
              {pet.status === 'active' && (
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={styles.statusButton}
                    onPress={() => handleUpdateStatus('no_longer_sighted')}
                  >
                    <Ionicons name="eye-off" size={16} color="#fff" />
                    <Text style={styles.statusButtonText}>No Longer Sighted</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.statusButton}
                    onPress={() => handleUpdateStatus('transferred_to_shelter')}
                  >
                    <Ionicons name="home" size={16} color="#fff" />
                    <Text style={styles.statusButtonText}>At Shelter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Reporter actions (if not owner or no owner claimed) */}
          {pet.userId._id === user?._id && (!pet.claimedOwner || pet.claimedOwner._id !== user?._id) && pet.status === 'active' && (
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => handleUpdateStatus('no_longer_sighted')}
              >
                <Ionicons name="eye-off" size={16} color="#fff" />
                <Text style={styles.statusButtonText}>No Longer Sighted</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => handleUpdateStatus('transferred_to_shelter')}
              >
                <Ionicons name="home" size={16} color="#fff" />
                <Text style={styles.statusButtonText}>At Shelter</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info for viewers who can't take action */}
          {!pet.claimedOwner && pet.userId._id !== user?._id && pet.status !== 'owner_unknown' && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#6B7280" />
              <Text style={styles.infoCardText}>
                Only the owner can confirm reunification
              </Text>
            </View>
          )}
        </View>

        {/* Found Claims History */}
        {pet.foundClaims && pet.foundClaims.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Safety Claims History</Text>
            {pet.foundClaims.map((claim) => (
              <View key={claim._id} style={styles.claimCard}>
                <Image source={{ uri: claim.photoUrl }} style={styles.claimImage} />
                <View style={styles.claimContent}>
                  <View style={styles.claimHeader}>
                    <Text style={styles.claimStatus}>
                      {claim.status === 'pending' && '⏳ Pending'}
                      {claim.status === 'confirmed' && '✅ Confirmed'}
                      {claim.status === 'disputed' && '❌ Disputed'}
                    </Text>
                    <Text style={styles.claimDate}>
                      {new Date(claim.claimedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.claimUser}>
                    By: {claim.userId?.username || 'Unknown'}
                  </Text>
                  {claim.notes && (
                    <Text style={styles.claimNotes}>{claim.notes}</Text>
                  )}
                  {claim.confirmedBy && (
                    <Text style={styles.claimConfirmed}>
                      {claim.status === 'confirmed' ? 'Confirmed' : 'Disputed'} by:{' '}
                      {claim.confirmedBy.username}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      <ClaimFoundModal
        visible={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSubmit={handleClaimFound}
        petId={id}
      />

      <OwnerClaimModal
        visible={showOwnerClaimModal}
        onClose={() => setShowOwnerClaimModal(false)}
        onSubmit={handleOwnershipClaim}
        petId={id}
      />
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
  petName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    marginBottom: 2,
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
  privateInfoContainer: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  privateInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  privateInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 6,
  },
  privateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  privateInfoText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
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
  foundButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  foundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ownerClaimButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  ownerClaimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  actionsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoCardText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  ownerUnknownBanner: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  bannerText: {
    flex: 1,
    marginLeft: 10,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  bannerDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  claimPreview: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  claimPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  claimPreviewInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  claimUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  claimDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingText: {
    flex: 1,
    marginLeft: 10,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 5,
  },
  pendingDescription: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 10,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disputeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  foundBanner: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  foundText: {
    flex: 1,
    marginLeft: 10,
  },
  foundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 5,
  },
  foundDescription: {
    fontSize: 13,
    color: '#065F46',
  },
  claimCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  claimImage: {
    width: 100,
    height: 100,
  },
  claimContent: {
    flex: 1,
    padding: 10,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  claimStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  claimDate: {
    fontSize: 12,
    color: '#999',
  },
  claimUser: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  claimNotes: {
    fontSize: 12,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  claimConfirmed: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});
