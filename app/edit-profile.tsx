import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface FormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  position: string;
  department: string;
  location: string;
  joinDate: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(state.user?.avatar || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: state.user?.name || '',
    email: state.user?.email || '',
    phone: state.user?.phone || '',
    bio: 'Passionate software engineer with 5+ years of experience in mobile and web development.',
    position: state.user?.position || '',
    department: state.user?.department || '',
    location: state.user?.location || '',
    joinDate: state.user?.joinDate || '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => {
            setProfileImage('https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=200');
            setHasChanges(true);
          }
        },
        { 
          text: 'Gallery', 
          onPress: () => {
            setProfileImage('https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=200');
            setHasChanges(true);
          }
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user data in context
      const updatedUser = {
        ...state.user!,
        ...formData,
        avatar: profileImage,
      };
      
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      setHasChanges(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 2000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.back()
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <Save size={20} color={hasChanges ? "white" : "rgba(255,255,255,0.5)"} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success Message */}
        {showSuccess && (
          <View style={styles.successMessage}>
            <Check size={20} color="#4CAF50" />
            <Text style={styles.successText}>Profile updated successfully!</Text>
          </View>
        )}

        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleImagePicker}
            >
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.imageHint}>Tap to change profile picture</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <User size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>
            {errors.name && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#F44336" />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email Address *</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Mail size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#F44336" />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Phone size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#F44336" />
                <Text style={styles.errorText}>{errors.phone}</Text>
              </View>
            )}
          </View>

          {/* Position Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Position</Text>
            <View style={styles.inputContainer}>
              <Briefcase size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.position}
                onChangeText={(value) => handleInputChange('position', value)}
                placeholder="Enter your position"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Department Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Department</Text>
            <View style={styles.inputContainer}>
              <Briefcase size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.department}
                onChangeText={(value) => handleInputChange('department', value)}
                placeholder="Enter your department"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Location Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Enter your location"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Join Date Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Join Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={formData.joinDate}
                onChangeText={(value) => handleInputChange('joinDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Bio Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer, errors.bio && styles.inputError]}>
              <Edit3 size={20} color="#666" style={styles.textAreaIcon} />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.characterCount}>
              {formData.bio.length}/500 characters
            </Text>
            {errors.bio && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color="#F44336" />
                <Text style={styles.errorText}>{errors.bio}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveActionButton, (!hasChanges || isSaving) && styles.saveActionButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text style={styles.saveActionButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '500',
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingVertical: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
  },
  saveActionButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveActionButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});