# 2D Metaverse Platform

A TypeScript-based 2D Metaverse platform with authentication, user management, and real-time communication.

## Project Structure

```
src/
├── types/         # TypeScript interfaces and types
├── services/      # Business logic services
│   └── auth.ts    # Authentication service
├── index.ts       # Main application file
└── ...            # Other components
```

## Features

- User authentication (signup/signin)
- User metadata management
- Space information management
- Real-time communication via WebSocket
- Admin endpoints
- Arena management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Testing

Run tests using:
```bash
npm test
```

## Environment Variables

- `PORT`: HTTP server port (default: 3000)
- `WS_PORT`: WebSocket server port (default: 3001)
- `JWT_SECRET`: JWT secret for token signing

## Vercel Deployment

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Login to your Vercel account:
```bash
vercel login
```

3. Deploy the project:
```bash
vercel
```

4. During deployment, you'll be prompted to add the following environment variables:
   - `JWT_SECRET`: Your JWT secret key

5. After deployment, Vercel will provide you with a deployment URL that you can use to access your application.

## Notes for Vercel Deployment

- The project uses TypeScript and needs to be built before deployment
- WebSocket functionality is supported by Vercel's platform
- Make sure to set the `JWT_SECRET` environment variable in Vercel's dashboard
- The application will run on Node.js 18 or higher
- The main entry point is `dist/index.js` after building the TypeScript code

## Tech Stack

- TypeScript
- Node.js
- Express
- Socket.io
- JSON Web Tokens
- bcryptjs
- Jest (for testing)
