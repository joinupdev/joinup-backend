# JoinUp Backend

A robust backend service for JoinUp - a platform connecting designers and developers through events, meetups, and networking opportunities.

## Features

- 🔐 Authentication & Authorization
- 👥 User Management
- 📧 Email Verification
- 🎫 Event Management
- 🎤 Speaker Management
- 💰 Booking System
- 📱 Mobile Verification
- 🔄 Session Management
- 📊 User Profiles

## Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Resend (Email Service)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/achhayapathak/joinup-backend.git
cd joinup-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/joinup?schema=v1"
PORT=3000
FRONTEND_ORIGIN="http://localhost:5173"
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
EMAIL_SENDER="your_email"
NODE_ENV="development"
RESEND_API_KEY="your_resend_api_key"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- User & UserProfile
- Event & Speaker
- Booking
- Session
- VerificationCode

## API Documentation

The API is RESTful and follows these conventions:

- Authentication: JWT-based with refresh tokens
- Response Format: JSON
- Status Codes: Standard HTTP status codes
- Rate Limiting: Implemented for security

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. This project follows semantic versioning, please see https://semver.org/ before contributing.
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request to the dev branch!

## Code Style

- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting
- Follow REST API best practices

## Security

- JWT for authentication
- Password hashing with bcrypt
- Rate limiting
- CORS enabled
- Input validation with Zod
- Environment variable protection

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email achhaya@joinup.website or open an issue in the GitHub repository. 