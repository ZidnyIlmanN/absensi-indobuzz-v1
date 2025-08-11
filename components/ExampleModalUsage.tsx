import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Calendar, Clock, User, Mail, Phone } from 'lucide-react-native';
import { DraggableModal } from './DraggableModal';

export function ExampleModalUsage() {
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  // Example form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleFormSubmit = () => {
    console.log('Form submitted:', formData);
    setShowFormModal(false);
    // Reset form
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const sampleListData = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is a description for item ${i + 1}`,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Draggable Modal Examples</Text>
      <Text style={styles.subtitle}>
        Each modal is set to 95% viewport height and can be dragged down to dismiss
      </Text>

      {/* Example Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.exampleButton}
          onPress={() => setShowModal(true)}
        >
          <Calendar size={20} color="white" />
          <Text style={styles.buttonText}>Simple Modal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exampleButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => setShowFormModal(true)}
        >
          <User size={20} color="white" />
          <Text style={styles.buttonText}>Form Modal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exampleButton, { backgroundColor: '#FF9800' }]}
          onPress={() => setShowListModal(true)}
        >
          <Clock size={20} color="white" />
          <Text style={styles.buttonText}>Scrollable List</Text>
        </TouchableOpacity>
      </View>

      {/* Simple Modal Example */}
      <DraggableModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Simple Draggable Modal"
        showCloseButton={true}
        showDragIndicator={true}
        enableDrag={true}
        dismissThreshold={0.25}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Welcome to the Draggable Modal!</Text>
          <Text style={styles.modalText}>
            This modal demonstrates the draggable functionality. You can:
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Drag from the header area to move the modal</Text>
            <Text style={styles.featureItem}>• Drag down to the bottom to auto-dismiss</Text>
            <Text style={styles.featureItem}>• The modal height is exactly 95% of the viewport</Text>
            <Text style={styles.featureItem}>• Smooth animations during drag operations</Text>
            <Text style={styles.featureItem}>• Works on both mobile and desktop</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.actionButtonText}>Close Modal</Text>
          </TouchableOpacity>
        </View>
      </DraggableModal>

      {/* Form Modal Example */}
      <DraggableModal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Contact Form"
        showCloseButton={true}
        showDragIndicator={true}
        enableDrag={true}
        dismissThreshold={0.3}
        backgroundColor="#F8F9FA"
      >
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>Get in Touch</Text>
          <Text style={styles.formSubtitle}>
            Fill out this form and we'll get back to you soon.
          </Text>

          {/* Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Phone Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Message Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter your message..."
              value={formData.message}
              onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowFormModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleFormSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </DraggableModal>

      {/* Scrollable List Modal Example */}
      <DraggableModal
        visible={showListModal}
        onClose={() => setShowListModal(false)}
        title="Scrollable Content"
        showCloseButton={true}
        showDragIndicator={true}
        enableDrag={true}
        dismissThreshold={0.2}
      >
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Sample List Items</Text>
          <Text style={styles.listSubtitle}>
            This demonstrates how scrollable content works within the draggable modal.
          </Text>

          {sampleListData.map((item) => (
            <TouchableOpacity key={item.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.title}</Text>
                <Text style={styles.listItemDescription}>{item.description}</Text>
                <Text style={styles.listItemDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </DraggableModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 16,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 120,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  listSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  listItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  listItemDate: {
    fontSize: 12,
    color: '#999',
  },
});