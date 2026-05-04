# CRISIS CONNECT 🚨

**Crisis Connect** is a hyper-local, real-time mutual aid network designed to bridge the gap between a crisis occurring and formal emergency services arriving. It transforms bystanders into "Guardians" through a tactical, mission-oriented interface.

## 🚀 Key Features

- **Instant SOS Broadcast**: One-tap emergency signaling that triggers immediate alerts to all nearby verified Guardians.
- **Tactical Telemetry**: Real-time tracking of responders and victims using high-precision geolocation.
- **Safety Circles**: Private, encrypted sub-networks for families, neighborhood watch groups, or hiking teams.
- **Guardian Dashboard**: A Command-and-Control style interface for real-time telemetry, network health, and mission management.
- **Verified Identity**: Integration with Google Auth ensures a community of real, accountable individuals.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Mobile-optimized, high-contrast UI)
- **Backend/Realtime**: Firebase Firestore & Firebase Auth
- **Animations**: Motion (motion/react) for tactile feedback
- **Geospatial Logic**: Haversine Formula for low-latency distance calculations

## 🔐 Security & Privacy

- **Attribute-Based Access Control (ABAC)**: Proprietary Firestore security rules ensure data is only visible to active responders.
- **Identity Integrity**: Mandatory email verification to prevent bot-generated false alarms.
- **PII Protection**: Sensitive data is isolated and only revealed during active mission engagement.

## 📱 Mobile Optimization

- **Safe-Area Awareness**: Full support for iOS/Android notches and gesture bars.
- **Battery-Efficient UI**: Dark-themed dashboard designed for OLED efficiency during emergencies.
- **Touch-First UX**: 44px+ touch targets for high-stress reliability.

## 💻 Development

### Setup
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with your Firebase configuration.
4. Run `npm run dev`

---
*Created with focus on Public Safety and Community Resilience.*
