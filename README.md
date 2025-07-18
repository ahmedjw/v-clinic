# Virtual Clinic PWA - Client-Side Only

A client-side virtual clinic management system with PWA capabilities, using IndexedDB for local data storage and in-memory mock authentication.

## Features

### 🏥 **For Doctors**
- Complete patient management system
- Appointment scheduling and tracking
- Medical record creation with prescriptions and vitals
- Patient search and filtering
- Comprehensive patient profiles

### 👤 **For Patients**
- Personal health dashboard
- Appointment viewing and requests
- Medical record access
- Health metrics tracking
- Profile management

### 🔐 **Authentication (Mock)**
- In-memory user registration and login (resets on page refresh)
- Role-based access control
- Demo accounts for quick testing

### 📱 **PWA Features**
- Offline functionality (via Service Worker and IndexedDB)
- Mobile-first responsive design
- App installation capability
- Service worker caching

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Data Storage**: IndexedDB (client-side persistence)
- **Authentication**: In-memory mock (client-side)
- **PWA**: Service Workers, Web App Manifest

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Development

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` and test:
- Login with: `doctor@clinic.com` / `doctor123`
- Or: `patient@clinic.com` / `patient123`
- You can also register new accounts, but they will reset on page refresh.

### 3. Production Deployment

This is a purely client-side application, so deployment is straightforward:

#### Deploy to Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy (no environment variables or database setup needed)

## Data Persistence

- **User Authentication**: Handled in-memory. User sessions will reset if the browser tab is closed or the page is refreshed.
- **Patient, Appointment, Medical Record Data**: Stored locally in your browser's IndexedDB. This data will persist across browser sessions for the same user on the same device.

## Mobile Features

- Responsive design optimized for mobile
- Touch-friendly interface
- PWA installation
- Offline functionality
- Mobile navigation patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
