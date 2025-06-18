# CRM Tool

## Overview

This is a modern Customer Relationship Management (CRM) tool built with a full-stack architecture combining React frontend with Express.js backend. The application features a hybrid UI design inspired by Airtable's grid functionality and Pipedrive's pipeline visualization, providing both tabular data management and visual sales funnel tracking.

## System Architecture

The system follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
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
The system uses four main entities:
- **Contacts**: Core contact information with status tracking and deal values
- **Notes**: Timestamped notes associated with contacts
- **Tasks**: Task management with due dates and completion status
- **Activities**: Activity logging for contact interactions and status changes

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

## Changelog
- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.