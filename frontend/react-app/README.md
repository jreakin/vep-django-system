# React Frontend Development Guide

## Overview
This React application is a modern frontend for the Political Campaign Management System. It communicates with the existing Django REST API backend and provides a responsive, mobile-first user interface.

## Technology Stack
- **React 19** with TypeScript
- **Vite** for build tooling and development
- **Material-UI (MUI)** for UI components and theming
- **Redux Toolkit** for state management
- **React Router v7** for client-side routing
- **Axios** for API communication
- **React Hook Form** for form handling
- **TanStack Query** for server state management

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Django backend running on port 8000

### Installation
```bash
cd frontend/react-app
npm install
```

### Development Server
```bash
npm run dev
```
This starts the development server on http://localhost:5173

### Build for Production
```bash
npm run build
```

## Features Implemented

### ✅ Phase 1: Foundation
- [x] React application setup with Vite and TypeScript
- [x] Material-UI theming and components
- [x] Redux Toolkit state management
- [x] React Router navigation
- [x] API service layer with axios
- [x] CORS configuration for Django backend

### ✅ Phase 2: Authentication
- [x] Phone-based login interface
- [x] PIN verification flow
- [x] Authentication state management
- [x] Protected routes and layout
- [x] Token-based API authentication

### ✅ Phase 3: Core Features
- [x] Dashboard with metrics and overview
- [x] Campaign management interface
- [x] Voter data management with search
- [x] Responsive design for mobile and desktop

### 🚧 Phase 4: Advanced Features (Future)
- [ ] Real API integration with Django endpoints
- [ ] Advanced charts and analytics
- [ ] File upload functionality
- [ ] Billing management interface
- [ ] Canvassing tools
- [ ] Integrations management

## Architecture

### API Integration
- Authentication flow with phone/PIN verification
- JWT token management
- Axios interceptors for auth and error handling
- API service layer for clean separation

### State Management
- Redux Toolkit for global application state
- Auth slice for user authentication
- TanStack Query for server state

### Component Structure
- Responsive layout with sidebar navigation
- Reusable metric cards and data tables
- Mobile-friendly design patterns
- Material-UI theming and components