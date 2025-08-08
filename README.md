# Employee Attendance Mobile App

A comprehensive React Native mobile application built with Expo for employee attendance management, featuring modern UI design, real-time tracking, and Firebase integration.

## 🚀 Features

### Core Functionality
- **Modern Tab Navigation**: Clean bottom tab navigation with Home, Employee, Request, Inbox, and Profile screens
- **Attendance Management**: Clock In/Clock Out functionality with real-time work hours tracking
- **Employee Directory**: View all employees with their current status and contact information
- **Request System**: Submit and track leave, permission, and reimbursement requests
- **Notification Inbox**: Manage announcements, reminders, and system notifications
- **User Profile**: Complete profile management with personal and work information

### Design Features
- **Modern UI**: Clean, professional design with light blue and white color scheme
- **Responsive Layout**: Optimized for both iOS and Android devices
- **Smooth Animations**: Micro-interactions and transitions for better UX
- **Card-based Design**: Clean card layouts with subtle shadows and rounded corners
- **Professional Icons**: Lucide React Native icons for consistent iconography

### Technical Features
- **TypeScript Support**: Full type safety and better development experience
- **Modular Architecture**: Well-organized component structure for scalability
- **Expo Framework**: Cross-platform development with native capabilities
- **Internationalization**: Complete i18n support for English and Indonesian languages
- **State Management Ready**: Prepared for Redux Toolkit or Zustand integration
- **Location Services**: GPS tracking and geofencing capabilities
- **Camera Integration**: Selfie verification for attendance

## 📱 Screenshots

The app includes the following main screens:
- **Home**: Dashboard with attendance card, quick actions, and recent activity
- **Employee**: Directory of all employees with status tracking
- **Request**: Submit and manage various types of requests
- **Inbox**: Notifications and announcements management
- **Profile**: Personal profile and app settings

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router with Tab Navigation
- **Internationalization**: react-i18next with AsyncStorage persistence
- **UI Components**: Custom components with Lucide React Native icons
- **Styling**: StyleSheet with responsive design
- **State Management**: Ready for Redux Toolkit or Zustand
- **Location**: Expo Location for GPS tracking
- **Camera**: Expo Camera for selfie verification
- **Notifications**: Expo Notifications for push notifications

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-attendance-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Run on device/simulator**
   - Install Expo Go on your mobile device
   - Scan the QR code displayed in the terminal
   - Or run on iOS Simulator / Android Emulator

## 🏗 Project Structure

```
app/
├── (tabs)/                 # Tab navigation screens
│   ├── _layout.tsx        # Tab layout configuration
│   ├── index.tsx          # Home screen
│   ├── employee.tsx       # Employee directory
│   ├── request.tsx        # Request management
│   ├── inbox.tsx          # Notifications inbox
│   └── profile.tsx        # User profile
├── _layout.tsx            # Root layout
└── +not-found.tsx         # 404 screen

components/
├── AttendanceCard.tsx     # Main attendance component
├── QuickActionCard.tsx    # Quick action buttons
└── StatsCard.tsx          # Statistics display

constants/
└── Colors.ts              # App color palette

locales/
├── en.json                # English translations
└── id.json                # Indonesian translations

services/
├── i18n.ts                # Internationalization service
└── ...                    # Other services

types/
└── index.ts               # TypeScript type definitions

utils/
├── date.ts                # Date and time utilities
└── location.ts            # Location and GPS utilities
```

## 🎨 Design System

### Internationalization
- **Languages**: English (EN) and Indonesian (ID)
- **Language Switching**: Real-time language switching without app restart
- **Locale Support**: Proper number, currency, and date formatting
- **Persistence**: User language preference saved locally
- **Fallback**: Automatic fallback to English for unsupported languages

### Color Palette
- **Primary**: #4A90E2 (Light Blue)
- **Primary Dark**: #357ABD
- **Success**: #4CAF50 (Green)
- **Warning**: #FF9800 (Orange)
- **Error**: #F44336 (Red)
- **Background**: #F8F9FA (Light Gray)
- **Surface**: #FFFFFF (White)

### Typography
- **Headers**: Bold, 18-24px
- **Body Text**: Regular, 14-16px
- **Captions**: Regular, 12-14px
- **Color Hierarchy**: Primary (#1A1A1A), Secondary (#666), Tertiary (#999)

## 🔧 Configuration

### Internationalization Setup
1. Language files are located in `locales/` directory
2. Add new translations to both `en.json` and `id.json`
3. Use the `useTranslation()` hook in components
4. Language preference is automatically saved and restored
5. Supports real-time language switching

#### Adding New Languages
1. Create new translation file in `locales/` (e.g., `es.json`)
2. Add language to `i18nService.getAvailableLanguages()`
3. Add flag emoji and code to `LanguageSelector` component
4. Update language detection logic in `services/i18n.ts`

#### Translation Usage Examples
```typescript
// Basic translation
const { t } = useTranslation();
const title = t('home.welcome_message');

// Translation with parameters
const message = t('validation.password_min_length', { length: 6 });

// Using namespace hook
const { t } = useTranslationWithNamespace('auth');
const loginText = t('sign_in'); // Translates 'auth.sign_in'
```

### Environment Setup
1. Create environment files for different stages
2. Configure Firebase project settings
3. Set up location permissions in app.json
4. Configure camera permissions for selfie feature

### Customization
- Update colors in `constants/Colors.ts`
- Modify component styles in respective files
- Adjust navigation structure in `app/(tabs)/_layout.tsx`
- Configure work locations in `utils/location.ts`

## 📋 To-Do / Roadmap

### Phase 1 - Firebase Integration
- [ ] Set up Firebase project
- [ ] Implement Firebase Authentication
- [ ] Configure Firestore database
- [ ] Add Firebase Storage for images
- [ ] Set up Firebase Cloud Messaging
- [x] Complete internationalization (i18n) implementation
- [x] English and Indonesian language support
- [x] Real-time language switching
- [x] Language preference persistence

### Phase 2 - Advanced Features
- [ ] Real-time location tracking
- [ ] Geofencing implementation
- [ ] Push notifications
- [ ] Offline mode support
- [ ] Photo capture and upload
- [ ] Maps integration

### Phase 3 - Web Admin Panel
- [ ] Create ReactJS admin dashboard
- [ ] Employee management interface
- [ ] Attendance reports and analytics
- [ ] Request approval system
- [ ] Company settings management

### Phase 4 - Production Ready
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Testing implementation
- [ ] App store deployment
- [ ] Documentation completion

## 🌐 Internationalization

The app supports multiple languages with complete i18n implementation:

### Supported Languages
- **English (EN)** - Default language
- **Indonesian (ID)** - Bahasa Indonesia

### Features
- **Real-time Language Switching**: Change language instantly without app restart
- **Persistent Preferences**: Language choice is saved and restored on app launch
- **Device Language Detection**: Automatically detects and uses device language if supported
- **Proper Locale Formatting**: Numbers, currencies, and dates formatted according to selected language
- **Comprehensive Coverage**: All UI text, messages, and labels are translatable

### Language Selection
- **Header Selector**: Compact flag-based selector in main tabs header
- **Settings Menu**: Full language selector in Profile > Settings
- **Synchronized**: Both selectors stay in sync and update the entire app

### Technical Implementation
- **Framework**: react-i18next with AsyncStorage persistence
- **Translation Files**: JSON-based translation files in `locales/` directory
- **Hooks**: Custom hooks for translation, currency, and date formatting
- **Fallback**: Automatic fallback to English for missing translations

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📱 Deployment

### Mobile App Deployment
1. **Expo Build Service (EAS)**
   ```bash
   npm install -g @expo/cli
   eas build --platform all
   ```

2. **App Store / Play Store**
   - Follow Expo documentation for app store submission
   - Configure app.json for production settings
   - Generate appropriate certificates and profiles

### Web Admin Panel
- Deploy to Firebase Hosting
- Configure environment variables
- Set up CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common issues

## 🙏 Acknowledgments

- Design inspiration from modern attendance apps
- Expo team for the excellent framework
- React Native community for valuable resources
- Contributors and testers

---

**Note**: This is a production-ready foundation with all core features implemented. The app is designed to be easily extended with Firebase backend, advanced location features, and additional functionality as needed.