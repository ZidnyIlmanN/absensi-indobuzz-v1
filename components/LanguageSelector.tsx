import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe, Check, X } from 'lucide-react-native';
import { i18nService } from '@/services/i18n';

interface LanguageSelectorProps {
  style?: any;
  showLabel?: boolean;
  compact?: boolean;
  onLanguageChange?: (languageCode: string) => void;
}

const LANGUAGE_CODES = {
  en: 'EN',
  id: 'ID',
};

const UKFlag = () => (
  <View style={styles.flagCircle}>
    <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#0A3161' }} />
    <View style={{ position: 'absolute', width: '120%', height: 4, backgroundColor: 'white', top: '50%', left: '-10%', marginTop: -2, transform: [{ rotate: '45deg' }] }} />
    <View style={{ position: 'absolute', width: '120%', height: 4, backgroundColor: 'white', top: '50%', left: '-10%', marginTop: -2, transform: [{ rotate: '-45deg' }] }} />
    <View style={{ position: 'absolute', width: '120%', height: 2, backgroundColor: '#E0162B', top: '50%', left: '-10%', marginTop: -1, transform: [{ rotate: '45deg' }] }} />
    <View style={{ position: 'absolute', width: '120%', height: 2, backgroundColor: '#E0162B', top: '50%', left: '-10%', marginTop: -1, transform: [{ rotate: '-45deg' }] }} />
    <View style={{ position: 'absolute', width: '100%', height: 4, backgroundColor: 'white', top: '50%', marginTop: -2 }} />
    <View style={{ position: 'absolute', height: '100%', width: 4, backgroundColor: 'white', left: '50%', marginLeft: -2 }} />
    <View style={{ position: 'absolute', width: '100%', height: 2, backgroundColor: '#E0162B', top: '50%', marginTop: -1 }} />
    <View style={{ position: 'absolute', height: '100%', width: 2, backgroundColor: '#E0162B', left: '50%', marginLeft: -1 }} />
  </View>
);

const IndonesiaFlag = () => (
  <View style={styles.flagCircle}>
    <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
  </View>
);

const Flag = ({ languageCode }: { languageCode: string }) => {
  switch (languageCode) {
    case 'en':
      return <UKFlag />;
    case 'id':
      return <IndonesiaFlag />;
    default:
      return null;
  }
};

export function LanguageSelector({ 
  style, 
  showLabel = false, 
  compact = false,
  onLanguageChange 
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = i18n.language || 'en';
  const availableLanguages = i18nService.getAvailableLanguages();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setShowModal(false);
      return;
    }

    setIsChanging(true);
    
    try {
      await i18nService.changeLanguage(languageCode);
      onLanguageChange?.(languageCode);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to change language:', error);
      // Could show an error alert here
    } finally {
      setIsChanging(false);
    }
  };

  const renderCompactSelector = () => (
    <TouchableOpacity
      style={[styles.compactButton, style]}
      onPress={() => setShowModal(true)}
      activeOpacity={0.7}
    >
      <Flag languageCode={currentLanguage} />
      <Text style={styles.languageCode}>
        {LANGUAGE_CODES[currentLanguage as keyof typeof LANGUAGE_CODES]}
      </Text>
    </TouchableOpacity>
  );

  const renderFullSelector = () => (
    <TouchableOpacity
      style={[styles.fullButton, style]}
      onPress={() => setShowModal(true)}
      activeOpacity={0.7}
    >
      <View style={styles.fullButtonContent}>
        <Globe size={20} color="#4A90E2" />
        <View style={styles.languageInfo}>
          <Text style={styles.languageLabel}>
            {showLabel ? t('language.language') : ''}
          </Text>
          <Text style={styles.languageName}>
            {i18nService.getLanguageDisplayName(currentLanguage)}
          </Text>
        </View>
        <View style={styles.flagContainer}>
          <Flag languageCode={currentLanguage} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {compact ? renderCompactSelector() : renderFullSelector()}

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language.select_language')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === language.code && styles.selectedLanguageOption
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                >
                  <View style={styles.languageOptionContent}>
                    <Flag languageCode={language.code} />
                    <View style={styles.languageDetails}>
                      <Text style={styles.languageNativeName}>
                        {language.nativeName}
                      </Text>
                      <Text style={styles.languageEnglishName}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  
                  {currentLanguage === language.code && (
                    <Check size={20} color="#4A90E2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.footerNote}>
                {t('language.change_language')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 50,
  },
  flagCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    overflow: 'hidden',
  },
  languageCode: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  fullButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fullButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  languageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  flagContainer: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedLanguageOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageDetails: {
    flex: 1,
    marginLeft: 16,
  },
  languageNativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: 12,
    color: '#666',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});