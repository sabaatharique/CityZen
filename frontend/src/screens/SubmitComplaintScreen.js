import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { useComplaint } from '../context/ComplaintContext';
import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL;
const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_SERVICE_URL;

export default function SubmitComplaintScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const {
    images,
    location,
    title,
    setTitle,
    description,
    setDescription,
    selectedCategory,
  } = useComplaint();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const newErrors = {};
    if (!title) newErrors.title = 'Title is required.';
    if (images.length === 0) newErrors.image = 'Evidence photos are mandatory.';
    if (!selectedCategory) newErrors.category = 'Category is required.';
    if (!location?.latitude || !location?.longitude) newErrors.location = 'GPS location is required.';

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join('\n');
      Alert.alert('Missing Info', errorMessages);
      setErrors(newErrors);
      return;
  const [recommendedAuthorities, setRecommendedAuthorities] = useState([]);
  const [chosenAuthorities, setChosenAuthorities] = useState([]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const handleChooseAuthority = (authorityId) => {
    setChosenAuthorities(prev => {
      if (prev.includes(authorityId)) {
        return prev.filter(id => id !== authorityId); // Deselect
      } else {
        return [...prev, authorityId]; // Select
      }
    });
  };



  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/complaints/categories`, {
          timeout: 30000, // 30-second timeout
          headers: {
            'bypass-tunnel-reminder': 'true'
          }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        Alert.alert('Error', 'Failed to load categories.');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (aiResult && categories.length > 0) {
      const roadCategory = categories.find(cat =>
        cat.name.toLowerCase().includes("road")
      );

      if (roadCategory) {
        setSelectedCategory(roadCategory);
      }
    }

    setIsSubmitting(true);
    setErrors({});
  useEffect(() => {
    const fetchRecommendedAuthority = async () => {
      if (selectedCategory && location.latitude && location.longitude && description) {
        setLoadingRecommendation(true);
        try {
          const response = await axios.get(`${API_URL}/api/complaints/recommend-authorities`, {
            params: {
              category: selectedCategory.name,
              description,
              latitude: location.latitude,
              longitude: location.longitude,
              location_string: location.fullAddress,
            },
            headers: {
              'bypass-tunnel-reminder': 'true'
            }
          });
          setRecommendedAuthorities(response.data);
        } catch (error) {
          console.error('Error fetching recommended authority:', error);
        } finally {
          setLoadingRecommendation(false);
        }
      }
    };

    // Debounce the fetch
    const handler = setTimeout(() => {
        fetchRecommendedAuthority();
    }, 1000); // 1 second debounce

    return () => {
        clearTimeout(handler);
    };
  }, [selectedCategory, location, description]);

useEffect(() => {
    const generateComplaintText = async () => {
      if (aiResult && aiResult.confidence > 60 && location.latitude && location.longitude) {
        try {
          const response = await axios.post(`${OPENROUTER_API_URL}/generate_complaint_text`, {
            category: aiResult.label,
            confidence: aiResult.confidence,
            latitude: location.latitude,
            longitude: location.longitude,
            location_string: location.fullAddress,
          });

          if (response.data.title) {
            setTitle(response.data.title);
          }
          if (response.data.description) {
            setDescription(response.data.description);
          }
        } catch (error) {
          console.error("Error generating complaint text with OpenRouter:", error);
          Alert.alert("Generation Failed", "Could not generate complaint details. Please check your connection or try again.");
        }
      }
    };

    generateComplaintText();
  }, [aiResult, location]);

  //Permissions
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('citizenUid', auth.currentUser?.uid);
    formData.append('categoryId', selectedCategory.id);

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'Could not identify user. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    images.forEach((imageUri, index) => {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('images', {
        uri: imageUri,
        name: filename,
        type: type,
      });
    });

    try {
      const response = await axios.post(`${API_URL}/api/complaints`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'bypass-tunnel-reminder': 'true'
        }
      });

      if (response.status === 201) {
        Alert.alert("Success", "Complaint Submitted Successfully!");
        navigation.navigate('SubmittedComplaint');
      } else {
        Alert.alert('Error', 'Failed to submit complaint. Please try again.');
      }
    } catch (error) {
      console.error('Submit Complaint Error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'An unexpected error occurred.';
      Alert.alert('Submission Failed', message);
    if (ref === 'S' || ref === 'W') dec = -dec;
    return dec;
  };

  const extractLocationFromExif = (exif) => {
    if (!exif) return null;

    const latitude = exif.GPSLatitude
      ? Array.isArray(exif.GPSLatitude)
        ? convertDMSToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef)
        : exif.GPSLatitudeRef === 'S' ? -exif.GPSLatitude : exif.GPSLatitude
      : null;

    const longitude = exif.GPSLongitude
      ? Array.isArray(exif.GPSLongitude)
        ? convertDMSToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef)
        : exif.GPSLongitudeRef === 'W' ? -exif.GPSLongitude : exif.GPSLongitude
      : null;

    if (latitude !== null && longitude !== null) return { latitude, longitude };
    return null;
};

const updateLocationWithAddress = async (latitude, longitude) => {
  setLocating(true);

  try {
    const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude, localeIdentifier: 'en-US' });

    const areaName = addr.name || addr.street || addr.subregion || addr.city || 'Unknown area';
    const district = addr.district || addr.city || '';
    const region = addr.region || '';

    setLocation({
      latitude,
      longitude,
      areaName,
      district,
      region,
      fullAddress: `${areaName}, ${district}, ${region}`,
    });

    setLocationTime(new Date().toLocaleString());
  } catch (err) {
    console.warn('Reverse geocode failed', err);
    setLocation({
      latitude,
      longitude,
      fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    });
    setLocationTime(new Date().toLocaleString());
  } finally {
    setLocating(false);
  }
};

  const runAiDetection = async (imageUri) => {
    setAiLoading(true);
    setAiResult(null);

    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: "photo.jpg",
      type: "image/jpeg",
    });

    try {
      const res = await fetch(`${AI_SERVICE_URL || 'http://localhost:8000'}/detect`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setAiResult(data);

      // Set a temporary title/description based on detection
      /*if (data.label && data.confidence) {
          setTitle(`${data.label} Detected`);
          setDescription(
              `AI detected a ${data.label} with ${data.confidence}% confidence.`
          );
      }*/
    } catch (err) {
      Alert.alert("AI Error", "Failed to analyze image");
    } finally {
      setIsSubmitting(false);
    }

    navigation.navigate('SubmittedComplaint');
  };

  const handleBack = () => {
    navigation.goBack();
  };

      const handleGPSDetect = async () => {
        setLocating(true);
        try {
          const hasLocationPerm = await requestLocationPermission();
          if (!hasLocationPerm) throw new Error('Location permission denied');

          const gps = await Location.getCurrentPositionAsync({});
          await updateLocationWithAddress(gps.coords.latitude, gps.coords.longitude);
        } catch (err) {
          Alert.alert('Error', 'Unable to detect location.');
        } finally {
          setLocating(false);
        }
      };

      const handleSubmit = async () => {

      if (aiResult && !aiApproved) {
        Alert.alert(
          "Please add clearer images or retake the photo."
        );
        return;
      }

      
      const newErrors = {};
      if (images.length === 0) newErrors.image = 'Evidence photos are mandatory.'; // Update validation
      if (!title) newErrors.title = 'Title is required.';
      if (!selectedCategory) newErrors.category = 'Category is required.';
      if (!location.latitude || !location.longitude) newErrors.location = 'GPS location is required.';
  
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        Alert.alert('Missing Info', 'Please fill in all required fields.');
        return;
      }
  
      setIsSubmitting(true);
      setErrors({});
  
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('citizenUid', auth.currentUser?.uid);
      formData.append('categoryId', selectedCategory.id);
      formData.append('chosenAuthorities', JSON.stringify(chosenAuthorities));
  
      if (!auth.currentUser?.uid) {
        Alert.alert('Error', 'Could not identify user. Please log in again.');
        setIsSubmitting(false);
        return;
      }
  
      // Loop through multiple images and append to FormData
      images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('images', { // Append each image with the field name 'images'
          uri: imageUri,
          name: filename,
          type: type,
        });
      });
      
      try {
        const response = await axios.post(`${API_URL}/api/complaints`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'bypass-tunnel-reminder': 'true'
          }
        });
  
        if (response.status === 201) {
          Alert.alert("Success", "Complaint Submitted Successfully!");
          navigation.navigate('Feed');
        } else {
          Alert.alert('Error', 'Failed to submit complaint. Please try again.');
        }
      } catch (error) {
        console.error('Submit Complaint Error:', error);
        const message = error.response?.data?.message || 'An unexpected error occurred.';
        Alert.alert('Submission Failed', message);
      } finally {
        setIsSubmitting(false);
      }
    };
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Select Authority</Text>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.label, darkMode && styles.textWhite]}>Title <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark, errors.title && styles.errorBorder]}
            placeholder="e.g. Large Pothole on Main St"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, darkMode && styles.textWhite, { marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }, darkMode && styles.inputDark]}
            placeholder="Add any additional details (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
            >
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit</Text>}
            </TouchableOpacity>
          </View>
              <Sparkles
                size={16}
                color={aiApproved ? "#059669" : "#DC2626"}
              />
              <Text
                style={[
                  styles.aiText,
                  { color: aiApproved ? "#059669" : "#DC2626" },
                ]}
              >
                AI detected: "{aiResult.label}" — Confidence: {aiConfidence}%
              </Text>
            </View>
          )}


           {/* 2. Category Dropdown */}
           <Text style={[styles.label, darkMode && styles.textWhite]}>Category <Text style={styles.req}>*</Text></Text>
           <TouchableOpacity 
             onPress={() => setIsDropdownOpen(!isDropdownOpen)}
             style={[styles.dropdownHeader, darkMode && styles.inputDark, errors.category && styles.errorBorder]}
           >
             <Text style={[styles.dropdownText, !selectedCategory && styles.placeholderText, darkMode && styles.textWhite]}>
               {selectedCategory ? selectedCategory.name : "Select a Category"}
             </Text>
             {isDropdownOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
           </TouchableOpacity>
           
           {isDropdownOpen && (
             <View style={[styles.dropdownList, darkMode && styles.cardDark]}>
               {categories.map((cat, index) => (
                 <TouchableOpacity 
                   key={cat.id} 
                   style={[styles.dropdownItem, darkMode && styles.dropdownItemDark]}
                   onPress={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                 >
                   <Text style={[styles.dropdownItemText, darkMode && styles.textWhite]}>{cat.name}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           )}

           {/* 2. Title */}
           <Text style={[styles.label, darkMode && styles.textWhite]}>Title <Text style={styles.req}>*</Text></Text>
           <TextInput 
             style={[styles.input, darkMode && styles.inputDark, errors.title && styles.errorBorder]} 
             placeholder="e.g. Broken Street Light" 
             placeholderTextColor="#9CA3AF"
             value={title}
             onChangeText={setTitle}
           />

           {/* 4. Description */}
           <Text style={[styles.label, darkMode && styles.textWhite, { marginTop: 12 }]}>Description</Text>
           <TextInput 
             style={[styles.input, { height: 80, textAlignVertical: 'top' }, darkMode && styles.inputDark]} 
             placeholder="Additional details (Optional)..." 
             placeholderTextColor="#9CA3AF"
             multiline
             value={description}
             onChangeText={setDescription}
           />

           {/* AI Recommended Authorities */}
           {loadingRecommendation && <ActivityIndicator style={{ marginVertical: 16 }} color="#1E88E5" />}
           {recommendedAuthorities.length > 0 && (
             <View style={{ marginTop: 16 }}>
               <Text style={[styles.label, darkMode && styles.textWhite]}>AI Recommended Authorities</Text>
               {recommendedAuthorities.map((authority, index) => (
                 <TouchableOpacity 
                    key={index} 
                    onPress={() => handleChooseAuthority(authority.authorityCompanyId)}
                    style={[
                        styles.card, 
                        darkMode && styles.cardDark, 
                        { padding: 16, marginBottom: 12 },
                        chosenAuthorities.includes(authority.authorityCompanyId) && styles.selectedCard
                    ]}
                  >
                   <Text style={[styles.dropdownText, darkMode && styles.textWhite, { fontWeight: 'bold' }]}>
                     {authority.authorityName}
                   </Text>
                   <Text style={[styles.readOnlyLabel, darkMode && styles.textGray, { marginTop: 4 }]}>
                     {authority.reason}
                    </Text>
                   {/*<Text style={[styles.readOnlyLabel, darkMode && styles.textGray, { marginTop: 4, fontStyle: 'italic' }]}>
                     Confidence: {(authority.confidence * 100).toFixed(0)}%
                    </Text>*/}
                 </TouchableOpacity>
               ))}
             </View>
           )}

           

           {/* 5. Location */}
            <View style={styles.locationSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.label, darkMode && styles.textWhite, { marginBottom: 0 }]}>
                  Location Details <Text style={styles.req}>*</Text>
                </Text>

                <TouchableOpacity onPress={handleGPSDetect} style={styles.refreshBtn}>
                  <RefreshCw size={14} color="#1E88E5" />
                  <Text style={styles.refreshText}>Refresh GPS</Text>
                </TouchableOpacity>
              </View>

              {locating ? (
                <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { alignItems: 'center', justifyContent: 'center' }]}>
                  <ActivityIndicator color="#1E88E5" />
                  <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
                    Detecting location...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Location Coordinates */}
                  <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MapPin size={16} color="#1E88E5" />
                      <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
                        Detected Coordinates
                      </Text>
                    </View>

                    <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>
                      {location.fullAddress
                        ? location.fullAddress
                        : location.latitude && location.longitude
                          ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                          : 'No location detected'}
                    </Text>

                  </View>

                  {/* Timestamp */}
                  <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { marginTop: 8 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Clock size={16} color="#1E88E5" />
                      <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
                        Timestamp
                      </Text>
                    </View>

                    <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>
                      {locationTime || '—'}
                    </Text>
                  </View>
                </>
              )}
            </View>


           {/* 6. Privacy & Submit */}
           <TouchableOpacity onPress={() => setPrivacyEnabled(!privacyEnabled)} style={styles.privacyRow}>
             <View style={[styles.checkbox, privacyEnabled && styles.checkboxActive]}>
               {privacyEnabled && <CheckCircle size={14} color="white" />}
             </View>
             <Text style={[styles.privacyText, darkMode && styles.textGray]}>Blur faces or license plates (Privacy)</Text>
             <Shield size={16} color="#6B7280" style={{ marginLeft: 'auto' }} />
           </TouchableOpacity>

           <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting || (aiResult && !aiApproved)}
            style={[
              styles.submitBtn,
              (isSubmitting || (aiResult && !aiApproved)) && styles.btnDisabled
            ]}
          >

             {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
           </TouchableOpacity>

        </View>
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
  textWhite: { color: 'white' },
  req: { color: '#EF4444' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedCard: {
    borderColor: '#1E88E5',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  label: { marginBottom: 8, fontWeight: '600', color: '#374151', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#1F2937' },
  inputDark: { borderColor: '#374151', color: 'white', backgroundColor: '#374151' },
  errorBorder: { borderColor: '#EF4444' },
  submitBtn: {
    backgroundColor: '#1E88E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1, // Make it take equal space
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 16 },
  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1, // Make it take equal space
  },
  backButtonText: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  },
});

