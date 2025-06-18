# CRM Pro - Professional CRM Platform

## Overview

CRM Pro is a modern Customer Relationship Management platform built with enterprise-grade architecture. The application combines Airtable's intuitive grid interface with Pipedrive's visual pipeline management, enhanced with secure authentication and a stunning landing page experience. Built for modern sales teams who demand simplicity without sacrificing power.

## System Architecture

The system follows a production-ready monorepo structure with comprehensive authentication and database persistence:

- **Frontend**: React with TypeScript, using Vite for lightning-fast builds
- **Backend**: Express.js with TypeScript for secure API endpoints  
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **Authentication**: Replit Auth with OpenID Connect for secure user management
- **Styling**: Tailwind CSS with shadcn/ui component library and custom gradients
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React Router**: Using Wouter for lightweight client-side routing
- **Component Library**: shadcn/ui for consistent, accessible UI components
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design tokens for CRM-specific colors
- **Build Tool**: Vite with hot module replacement for development

### Backend Architecture
- **Express.js**: RESTful API server with middleware for logging and error handling
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Handling**: Multer for CSV import functionality
- **Session Management**: Basic session handling with connect-pg-simple

### Database Schema
The system uses a comprehensive schema with user isolation and authentication:
- **Users**: Secure user profiles with Replit Auth integration
- **Sessions**: Persistent session management for authentication state
- **Contacts**: User-scoped contact information with status tracking and deal values
- **Notes**: Timestamped notes with contact associations
- **Tasks**: Task management with due dates and completion tracking  
- **Activities**: Comprehensive activity logging for contact interactions

### UI Components
- **Grid View**: Airtable-style data table with in-place editing, sorting, and filtering
- **Pipeline View**: Kanban-style board for visual deal tracking with drag-and-drop
- **Contact Modal**: Detailed contact view with notes, tasks, and activity history
- **Sidebar Navigation**: Clean navigation between different views and features

## Data Flow

1. **Client Requests**: React components make API calls through TanStack Query
2. **API Layer**: Express routes handle CRUD operations and business logic
3. **Database Operations**: Drizzle ORM executes type-safe database queries
4. **Response Handling**: Structured JSON responses with proper error handling
5. **UI Updates**: TanStack Query manages cache invalidation and optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives for shadcn/ui components
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Static type checking across the entire codebase
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

### File Processing
- **multer**: File upload handling for CSV imports
- **csv-parser**: CSV parsing for contact import functionality
- **json2csv**: CSV export functionality

## Deployment Strategy

The application is configured for Replit deployment with:
- **Development Mode**: `npm run dev` starts both frontend and backend with hot reloading
- **Production Build**: `npm run build` creates optimized bundles
- **Production Server**: `npm run start` serves the built application
- **Database Management**: `npm run db:push` for schema migrations using Drizzle Kit

The Replit configuration includes:
- PostgreSQL module for database support
- Node.js 20 runtime environment
- Autoscale deployment target for production
- Port 5000 for local development with external port 80

## Recent Changes

### June 18, 2025 - Major Platform Enhancement
- ✓ Converted from in-memory to PostgreSQL database with Drizzle ORM
- ✓ Integrated Replit Authentication with OpenID Connect  
- ✓ Created stunning gradient-based landing page with hero sections
- ✓ Added user-scoped data isolation and security
- ✓ Implemented comprehensive session management
- ✓ Enhanced UI with modern gradients and professional branding
- ✓ Added user profiles with avatars and logout functionality
- ✓ Secured all API endpoints with authentication middleware
- ✓ Enhanced CSV import with error handling and sample files
- ✓ Added table customization with column visibility and page size controls
- ✓ Implemented persistent table settings with local storage
- ✓ Created comprehensive import help modal with format guide
- ✓ Advanced inline editing with field-specific input types
- ✓ Smart row actions menu with contextual operations
- ✓ Comprehensive filtering system with multiple criteria
- ✓ Visual enhancements with conditional formatting and status indicators
- ✓ Enhanced UX with hover states, visual cues, and smart interactions
- ✓ Bulk actions system with multi-select operations
- ✓ Column analytics with pipeline metrics and data insights
- ✓ Advanced table functionality matching enterprise CRM standards
- ✓ Custom table builder with dynamic column types and configurations
- ✓ Dynamic table rendering with field-specific input widgets
- ✓ User-defined schemas with JSON storage for flexible data models

### Architecture Improvements
- Database migration from MemStorage to DatabaseStorage
- Authentication flow with automatic redirects
- User-specific data access patterns
- Professional landing page with feature showcase
- Enhanced error handling and unauthorized request management

## User Preferences

Preferred communication style: Simple, everyday language.