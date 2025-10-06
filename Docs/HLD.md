# High-Level Design (HLD) Document - Mini-Trello Application

## 1. Introduction

This document provides a high-level overview of the Mini-Trello application's architecture, key components, and their interactions. The goal is to develop a collaborative Kanban board system, inspired by Trello, featuring real-time updates and robust user management.

## 2. Goals & Objectives

* To create a MERN stack application demonstrating proficiency in full-stack development.
* To implement core Kanban functionalities: Workspaces, Boards, Lists, and Cards.
* To enable real-time collaboration using WebSockets (Socket.io).
* To ensure secure user authentication and authorization (JWT).
* To design a scalable and maintainable modular architecture.

## 3. Architecture Overview

The Mini-Trello application follows a **Monolithic Architecture** with a clear separation of concerns between Frontend, Backend API, and a Real-time (WebSocket) layer.

**Key Architectural Decisions:**

  * **MERN Stack:** Chosen for its JavaScript-centric ecosystem, simplifying full-stack development.
  * **Express.js:** Provides a fast, unopinionated web framework for the API.
  * **MongoDB:** Flexible, schema-less (though Mongoose enforces schemas) NoSQL database, well-suited for document-oriented data like cards, lists, and activities.
  * **React:** Declarative, component-based UI library for efficient frontend development.
  * **Vite:** Modern build tool for a faster development experience.
  * **Socket.io:** Enables bi-directional, real-time communication for instant updates across clients.
  * **JWT:** Standard for secure, stateless API authentication.

## 4\. Component Breakdown

### 4.1. Frontend (React Application)

  * **Framework:** React with Vite.
  * **Styling:** Tailwind CSS.
  * **API Communication:** `axios` for RESTful calls.
  * **Real-time Communication:** Socket.io client library.
  * **Key Modules:**
      * **Auth Module:** Handles user login, signup, session management (JWT storage).
      * **Workspaces Module:** Displays user's workspaces, allows creation/editing.
      * **Boards Module:** Main Kanban board view, renders lists and cards. Includes search.
      * **ListColumn Component:** Renders individual lists, handles card display and creation forms.
      * **CardItem Component:** Displays individual cards, handles details, comments, and drag-and-drop.
      * **Routing:** React Router for navigation.
      * **State Management:** React Context API for global state (AuthContext, SocketContext) and local component state (`useState`, `useReducer`).

### 4.2. Backend (Node.js/Express.js API)

  * **Framework:** Express.js.
  * **Database ORM/ODM:** Mongoose for MongoDB interaction.
  * **Authentication:** `jsonwebtoken` for JWT handling, `bcryptjs` for password hashing.
  * **Real-time Integration:** Socket.io server.
  * **Key Modules (Controllers & Routes):**
      * **Auth Controller:** `POST /api/auth/register`, `POST /api/auth/login`.
      * **User Controller:** `GET /api/users/:id`, `GET /api/users/search`.
      * **Workspace Controller:** `POST /api/workspaces`, `GET /api/workspaces`, `PUT /api/workspaces/:id`.
      * **Board Controller:** `POST /api/boards`, `GET /api/boards/:id`, `PUT /api/boards/:id`.
      * **List Controller:** `POST /api/lists`, `GET /api/lists/:boardId`, `PUT /api/lists/:id`.
      * **Card Controller:** `POST /api/cards`, `GET /api/cards`, `PUT /api/cards/:id`, `DELETE /api/cards/:id`. Includes fractional positioning logic.
      * **Comment Controller:** `POST /api/cards/:cardId/comments`, `GET /api/cards/:cardId/comments`.
      * **ActivityLog Controller:** `GET /api/boards/:boardId/activity`.
  * **Middleware:**
      * `authMiddleware`: Protects routes requiring authentication.
      * `errorHandler`: Centralized error handling.
      * `loggingMiddleware`: Basic request logging.

### 4.3. Real-time Layer (Socket.io)

  * **Integration:** Runs alongside the Express.js server on the same port.
  * **Key Events:**
      * `io.on('connection', socket => {})`: Handles new client connections.
      * `socket.on('joinBoard', boardId => {})`: Client requests to join a specific board's room. `socket.join(boardId)`.
      * `io.to(boardId).emit('cardUpdate', cardData)`: Emitted by API controllers (e.g., after card save).
      * `io.to(boardId).emit('commentAdded', commentData)`: Emitted after comment save.
      * `io.to(boardId).emit('boardActivity', activityData)`: Emitted for other board-level changes.
  * **Flow:** Backend API controllers emit Socket.io events after a successful database operation. The Socket.io server then broadcasts these events to all clients subscribed to the relevant board room.

### 4.4. Database (MongoDB)

  * **Type:** NoSQL Document Database.
  * **ODM:** Mongoose.
  * **Collections:**
      * `users`: Stores user credentials.
      * `workspaces`: Stores workspace data and references to members.
      * `boards`: Stores board data and references to members.
      * `lists`: Stores list data, references `boardId`.
      * `cards`: Stores card data, references `listId`, `assignees`.
      * `comments`: Stores comment data, references `cardId`, `authorId`.
      * `activitylogs`: Stores audit trail data, references `boardId`, `actorId`.
  * **Indexing & Ordering:** Utilizes **fractional positioning** (`position: Number` field) on `lists` and `cards` for stable and efficient drag-and-drop reordering without full re-indexing.

## 5\. Data Flow & Interactions

1.  **Authentication:**

      * User fills signup/login form on Frontend.
      * Frontend sends `POST /api/auth/register` or `POST /api/auth/login` to Backend.
      * Backend validates credentials, hashes password (if registering), interacts with MongoDB, and returns JWT.
      * Frontend stores JWT (e.g., in `localStorage`) for subsequent authenticated requests.

2.  **Board/List/Card Operations (e.g., Create Card):**

      * User fills "Add Card" form on Frontend.
      * Frontend sends `POST /api/cards` with `title`, `description`, `listId`, `position`, `labels` (priority) and JWT in headers to Backend.
      * Backend authenticates JWT, validates data, interacts with MongoDB to create the card.
      * Backend emits a `cardUpdate` (or `newCard`) Socket.io event to the relevant `boardId` room.
      * Backend sends new card data back to Frontend.
      * Frontend updates its local state to display the new card.
      * Other subscribed clients (via WebSocket) receive the `cardUpdate` event and update their UIs.

3.  **Real-time Updates (e.g., Card Move):**

      * User drags and drops a card on Frontend.
      * Frontend (on `dragEnd` event) calculates new `position` and sends `PUT /api/cards/:id` to Backend.
      * Backend updates card in MongoDB, then emits a `cardMoved` Socket.io event with the updated card data to the board's room.
      * All clients in that room (including the one that initiated the drag) receive `cardMoved` and update their local state to reflect the new card position.

4.  **Search:**

      * User types in search bar on Frontend.
      * Frontend filters its local `allCards` state (or could send a `GET /api/cards?search=...` to Backend for server-side filtering).
      * Filtered cards are displayed.

## 6\. Security Considerations

  * **Authentication:** JWT for stateless, secure API access. Tokens stored securely on the client (e.g., `localStorage` or `HttpOnly` cookies).
  * **Authorization:** Middleware checks if a user is authenticated and is a member/owner of the requested resource (Workspace, Board).
  * **Password Hashing:** `bcryptjs` used for strong, one-way hashing of user passwords.
  * **Input Validation:** Backend validation (Mongoose schema, custom validators) to prevent malicious input and ensure data integrity.
  * **CORS:** Configured to allow requests only from the Frontend origin.

## 7\. Future Enhancements (Out of Scope for HLD)

  * Detailed activity logging for all user actions.
  * User permissions (e.g., read-only access).
  * Notifications system.
  * Advanced drag-and-drop for lists.
  * Integration with external services.
  * More complex card details (attachments, checklists).
