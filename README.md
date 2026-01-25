# Nurse Learning Corner (NLC) - Student App

Nurse Learning Corner is a premium mobile application designed to provide nursing students with a comprehensive, specialized, and offline-ready academic curriculum.

## 🚀 Key Features

-   **Specialized Curriculum**: Content tailored specifically for programs like Registered Nursing, Midwifery, Published Health Nursing, Mental Health, Oncology, and Paediatrics.
-   **Offline Study**: Download study materials (PDFs, Audio Guides) and access them anywhere, even without an internet connection.
-   **Persistent Caching**: Recent library data and subscription status are cached locally for a seamless experience in low-connectivity environments.
-   **Modern Auth & Security**: Secure login/registration with device binding and email OTP verification.
-   **Premium Access**: Subscription-based content access with easy activation codes.
-   **In-App Notifications**: Stay updated with new content alerts and system notifications.
-   **Sleek UI/UX**: Built with React Native and NativeWind, featuring smooth animations, toast notifications, and a premium "Nursing Excellence" aesthetic.

## 🛠 Tech Stack

-   **Framework**: [Expo](https://expo.dev/) (React Native)
-   **Styling**: [NativeWind](https://nativewind.dev/) (Tailwind CSS for React Native)
-   **Backend**: [Appwrite](https://appwrite.io/) (Authentication, Database, Storage, and Edge Functions)
-   **Navigation**: [React Navigation](https://reactnavigation.org/)
-   **Notifications**: [react-native-toast-message](https://github.com/calintamas/react-native-toast-message)
-   **Persistence**: [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/) & [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/secure-store/)

## 📦 Getting Started

### Prerequisites
-   Node.js & npm
-   Expo Go app on your mobile device (for development)
-   EAS CLI (`npm install -g eas-cli`)

### Installation
1.  Clone the repository
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npx expo start
    ```

## 🏗 Distribution (Android/APK)

For detailed information on how to build the APK and push Over-the-Air (OTA) updates to users, refer to the:
👉 **[APK Distribution Guide](./APK_DISTRIBUTION_GUIDE.md)**

### Quick Commands
-   **Build APK**: `npx eas build --profile preview --platform android`
-   **Push Update**: `npx eas update --branch preview --message "Your message"`

## 📄 Documentation

-   [Appwrite Setup](./APPWRITE_SETUP.md) - Configuration for backend services.
-   [Integration Guide](./INTEGRATION_UPDATE.md) - Details on backend-frontend connectivity.
-   [APK Distribution Guide](./APK_DISTRIBUTION_GUIDE.md) - Build and update workflow.

## 👨‍⚕️ "Empowering the next generation of Nursing Excellence."
