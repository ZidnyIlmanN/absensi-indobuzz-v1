import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { secureStorage, STORAGE_KEYS } from './secureStorage';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: string[];
  isEnrolled: boolean;
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;

  public static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric authentication is available and configured
   */
  async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      if (Platform.OS === 'web') {
        return {
          isAvailable: false,
          supportedTypes: [],
          isEnrolled: false,
        };
      }

      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const typeNames = supportedTypes.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biometric';
        }
      });

      return {
        isAvailable: isAvailable && isEnrolled,
        supportedTypes: typeNames,
        isEnrolled,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        supportedTypes: [],
        isEnrolled: false,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticateWithBiometrics(
    promptMessage: string = 'Authenticate to access your account'
  ): Promise<BiometricAuthResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: 'Biometric authentication not available on web',
        };
      }

      const capabilities = await this.getBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available or not enrolled',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType: capabilities.supportedTypes[0],
        };
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication error',
      };
    }
  }

  /**
   * Enable biometric authentication for the user
   */
  async enableBiometricAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      const capabilities = await this.getBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Test biometric authentication
      const authResult = await this.authenticateWithBiometrics(
        'Enable biometric authentication for quick access'
      );

      if (authResult.success) {
        await secureStorage.setSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
        return { success: true };
      } else {
        return {
          success: false,
          error: authResult.error || 'Failed to enable biometric authentication',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable biometric authentication',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometricAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      await secureStorage.removeSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable biometric authentication',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled by user
   */
  async isBiometricAuthEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Quick biometric login (if enabled)
   */
  async quickBiometricLogin(): Promise<{ success: boolean; error?: string }> {
    try {
      const isEnabled = await this.isBiometricAuthEnabled();
      
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication not enabled',
        };
      }

      const authResult = await this.authenticateWithBiometrics(
        'Use biometric authentication to sign in'
      );

      return {
        success: authResult.success,
        error: authResult.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric login failed',
      };
    }
  }
}

// Convenience instance
export const biometricAuth = BiometricAuthService.getInstance();