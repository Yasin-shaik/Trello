# Low-Level Design (LLD) Document - Mini-Trello Application

## 1. Introduction

This Low-Level Design (LLD) document details the granular components, module structures, data schemas, API specifications, and key algorithms for the Mini-Trello application. It serves as a comprehensive guide for developers during the implementation phase.

## 2. Backend LLD

### 2.1. Folder Structure

```
Backend/
├── config/
│   └── db.js                 # MongoDB connection setup
├── controllers/
│   ├── authController.js     # User authentication logic (register, login)
│   ├── userController.js     # User-related actions (get user, search users)
│   ├── workspaceController.js # Workspace CRUD operations
│   ├── boardController.js    # Board CRUD operations and member management
│   ├── listController.js     # List CRUD operations, position updates
│   ├── cardController.js     # Card CRUD operations, position updates, labels, assignees
│   ├── commentController.js  # Comment CRUD operations
│   └── activityController.js # Activity log fetching
├── middleware/
│   ├── authMiddleware.js     # JWT authentication middleware
│   ├── errorHandler.js       # Centralized error handling
│   └── advancedResults.js    # For API filtering, sorting (if implemented)
├── models/
│   ├── User.js               # Mongoose Schema for User
│   ├── Workspace.js          # Mongoose Schema for Workspace
│   ├── Board.js              # Mongoose Schema for Board
│   ├── List.js               # Mongoose Schema for List
│   ├── Card.js               # Mongoose Schema for Card
│   ├── Comment.js            # Mongoose Schema for Comment
│   └── ActivityLog.js        # Mongoose Schema for ActivityLog
├── routes/
│   ├── authRoutes.js         # API routes for authentication
│   ├── userRoutes.js         # API routes for users
│   ├── workspaceRoutes.js    # API routes for workspaces
│   ├── boardRoutes.js        # API routes for boards
│   ├── listRoutes.js         # API routes for lists
│   ├── cardRoutes.js         # API routes for cards (and nested comments)
│   └── activityRoutes.js     # API routes for activity log
├── server.js                 # Main server entry point, Express app setup, Socket.io setup
└── utils/
    ├── jwt.js                # JWT token generation helper
    └── AppError.js           # Custom error class
```

### 2.2. Mongoose Schemas (Refined Details)

*(Self-correcting: Since we have the exact schemas, I'll provide a concise overview here and refer to the `models/` files for full details.)*

* **User Schema (`models/User.js`)**
    * `name`: String, required
    * `email`: String, required, unique, lowercase, validated
    * `password`: String, required, minlength, select: false (for security)
    * `createdAt`: Date, default: `Date.now`
    * `updatedAt`: Date (timestamps: true)
    * **Pre-save hook:** Hash password using `bcryptjs`.
    * **Method:** `getSignedJwtToken()` for JWT generation.
    * **Method:** `matchPassword()` for password comparison.

* **Workspace Schema (`models/Workspace.js`)**
    * `title`: String, required, trim
    * `description`: String, default ''
    * `owner`: `ObjectId` (ref: 'User'), required
    * `members`: [`ObjectId`] (ref: 'User'), default `[owner]`
    * `boards`: [`ObjectId`] (ref: 'Board'), virtual pop.
    * `createdAt`, `updatedAt`

* **Board Schema (`models/Board.js`)**
    * `title`: String, required, trim
    * `description`: String, default ''
    * `workspaceId`: `ObjectId` (ref: 'Workspace'), required
    * `owner`: `ObjectId` (ref: 'User'), required
    * `members`: [`ObjectId`] (ref: 'User'), default `[owner]`
    * `lists`: [`ObjectId`] (ref: 'List'), virtual pop.
    * `activityLog`: [`ObjectId`] (ref: 'ActivityLog'), virtual pop.
    * `createdAt`, `updatedAt`

* **List Schema (`models/List.js`)**
    * `title`: String, required, trim
    * `boardId`: `ObjectId` (ref: 'Board'), required
    * `position`: Number, required (fractional positioning)
    * `cards`: [`ObjectId`] (ref: 'Card'), virtual pop.
    * `priority`: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' (as discussed in latest updates)
    * `createdAt`, `updatedAt`

* **Card Schema (`models/Card.js`)**
    * `title`: String, required, trim
    * `description`: String, default ''
    * `labels`: [`String`], trim (e.g., for 'high', 'medium', 'low' priority)
    * `assignees`: [`ObjectId`] (ref: 'User')
    * `dueDate`: Date, default `null`
    * `listId`: `ObjectId` (ref: 'List'), required
    * `boardId`: `ObjectId` (virtual, populated from list's boardId)
    * `position`: Number, required (fractional positioning)
    * `comments`: [`ObjectId`] (ref: 'Comment'), virtual pop.
    * `attachments`: [`String`] (URLs/paths to files, if implemented)
    * `checklists`: [Object] (if implemented, e.g., `{ title: String, items: [{ text: String, checked: Boolean }] }`)
    * `createdAt`, `updatedAt`

* **Comment Schema (`models/Comment.js`)**
    * `text`: String, required
    * `cardId`: `ObjectId` (ref: 'Card'), required
    * `authorId`: `ObjectId` (ref: 'User'), required
    * `createdAt`, `updatedAt`

* **ActivityLog Schema (`models/ActivityLog.js`)**
    * `boardId`: `ObjectId` (ref: 'Board'), required
    * `actorId`: `ObjectId` (ref: 'User'), required
    * `type`: String, required (e.g., 'card-created', 'card-moved', 'member-added', 'comment-added')
    * `metadata`: Object (stores contextual data, e.g., `{ cardTitle: String, fromList: String, toList: String }`)
    * `createdAt`, `updatedAt`

### 2.3. API Endpoints (Detailed)

All endpoints require JWT authentication unless specified. Errors return `4xx` or `5xx` with JSON `{ success: false, message: "Error details" }`. Success returns `2xx` with JSON `{ success: true, data: ... }`.

#### Authentication (`/api/auth`)

* `POST /register`
    * **Body:** `{ name, email, password }`
    * **Returns:** `{ token: String, user: { _id, name, email } }`
* `POST /login`
    * **Body:** `{ email, password }`
    * **Returns:** `{ token: String, user: { _id, name, email } }`

#### Users (`/api/users`)

* `GET /me` (Protected)
    * **Returns:** Authenticated User object.
* `GET /search` (Protected, Query: `?q=searchterm`)
    * **Returns:** Array of matching Users (e.g., by name/email).

#### Workspaces (`/api/workspaces`)

* `POST /` (Protected)
    * **Body:** `{ title, description }`
    * **Returns:** New Workspace object.
* `GET /` (Protected)
    * **Returns:** Array of Workspaces the user is a member of.
* `GET /:id` (Protected, User must be member)
    * **Returns:** Single Workspace object.
* `PUT /:id/members` (Protected, User must be Workspace Owner)
    * **Body:** `{ userId: String, action: 'add' | 'remove' }`
    * **Returns:** Updated Workspace object.

#### Boards (`/api/boards`)

* `POST /` (Protected)
    * **Body:** `{ title, description, workspaceId }`
    * **Returns:** New Board object.
* `GET /:id` (Protected, User must be member)
    * **Returns:** Single Board object (populated with lists, cards, members).
* `PUT /:id` (Protected, User must be Board Member)
    * **Body:** `{ title?, description? }`
    * **Returns:** Updated Board object.
* `PUT /:id/members` (Protected, User must be Board Owner)
    * **Body:** `{ userId: String, action: 'add' | 'remove' }`
    * **Returns:** Updated Board object.

#### Lists (`/api/lists`)

* `POST /` (Protected, User must be Board Member)
    * **Body:** `{ title, boardId, priority, position? }`
    * **Returns:** New List object. (`position` calculated on backend if not provided).
* `GET /:boardId` (Protected, User must be Board Member)
    * **Returns:** Array of Lists for the given board, sorted by `position`.
* `PUT /:id` (Protected, User must be Board Member)
    * **Body:** `{ title?, position?, boardId? }` (allows moving lists between boards)
    * **Returns:** Updated List object.

#### Cards (`/api/cards`)

* `POST /` (Protected, User must be List's Board Member)
    * **Body:** `{ title, description?, labels?, assignees?, dueDate?, listId, position? }`
    * **Returns:** New Card object. (`position` calculated on backend if not provided).
* `GET /?listId=...&search=...` (Protected, User must be Board Member)
    * **Returns:** Array of Cards (filtered by `listId`, `search` term, etc.), sorted by `position`.
* `GET /:id` (Protected, User must be Card's Board Member)
    * **Returns:** Single Card object.
* `PUT /:id` (Protected, User must be Card's Board Member)
    * **Body:** `{ title?, description?, labels?, assignees?, dueDate?, listId?, position? }`
    * **Returns:** Updated Card object. (Handles moving between lists by updating `listId` and `position`).
* `DELETE /:id` (Protected, User must be Card's Board Member)
    * **Returns:** `{ success: true, message: 'Card deleted' }`

#### Comments (`/api/cards/:cardId/comments`)

* `POST /` (Protected, User must be Card's Board Member)
    * **Body:** `{ text }`
    * **Returns:** New Comment object.
* `GET /` (Protected, User must be Card's Board Member)
    * **Returns:** Array of Comments for the given card.

#### Activity Log (`/api/boards/:boardId/activity`)

* `GET /` (Protected, User must be Board Member)
    * **Returns:** Array of ActivityLog entries for the given board, sorted by `createdAt` descending.

### 2.4. Core Algorithms

#### 2.4.1. Fractional Positioning

* **Purpose:** To enable efficient reordering of lists and cards in a Kanban board without requiring a full re-indexing of all items whenever one is moved.
* **Mechanism:**
    1.  Each `List` and `Card` has a `position` field of type `Number` (float).
    2.  **Creation:** When a new item is added to the end of a sequence, its position is set to `(last_item_position + 1000)`. If it's the first item, `1000`.
    3.  **Moving:** When an item is moved between two existing items `A` and `B`:
        * Its new `position` is calculated as the average: `(A.position + B.position) / 2`.
        * If moved to the beginning (before A), new position = `A.position / 2`.
        * If moved to the end (after B), new position = `B.position + 1000`.
    4.  **Floating Point Precision:** This method works for a very large number of moves. Eventually, precision can become an issue (e.g., `1.0000000000000001` vs `1.0000000000000002`). This is a rare edge case in typical usage but can be handled by a periodic "re-normalization" of positions on the server if needed.

#### 2.4.2. JWT Authentication Flow

1.  **User Login/Register:**
    * Client sends `email` and `password` to backend.
    * Backend hashes password (if register) / compares (if login) using `bcryptjs`.
    * If successful, `jwt.sign()` generates a token using `user._id` and `JWT_SECRET`.
    * Token is sent back to client.
2.  **Protected Routes:**
    * Client sends JWT in `Authorization: Bearer <token>` header with every request.
    * `authMiddleware` extracts token, `jwt.verify()` authenticates it.
    * `req.user` is populated with the authenticated user's ID.
    * If token invalid or missing, request is rejected (`401 Unauthorized`).

### 2.5. Socket.io Event Specification

* **Server-side (`server.js` or `socketHandler.js`)**
    * `io.on('connection', socket => {})`: Handles new client connections.
    * `socket.on('joinBoard', boardId => {})`: Client requests to join a specific board's room. `socket.join(boardId)`.
    * `io.to(boardId).emit('cardUpdate', cardData)`: Emitted by API controllers (e.g., after card save).
    * `io.to(boardId).emit('commentAdded', commentData)`: Emitted after comment save.
    * `io.to(boardId).emit('boardActivity', activityData)`: Emitted for other board-level changes.
* **Client-side (`App.js` or `BoardView.jsx`)**
    * `socket = io(API_URL)`: Connect to Socket.io server.
    * `socket.emit('joinBoard', boardId)`: On `BoardView` mount.
    * `socket.on('cardUpdate', data => {})`: Update local state with new/updated card.
    * `socket.on('commentAdded', data => {})`: Add new comment to UI.
    * `socket.on('boardActivity', data => {})`: Update activity feed.

## 3. Frontend LLD

### 3.1. Folder Structure

```
Frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── common/         # Reusable UI components (e.g., Button, Modal, Spinner)
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── boards/
│   │   │   ├── BoardHeader.jsx
│   │   │   ├── BoardView.jsx # Main board view, orchestrates lists and cards
│   │   │   ├── ListColumn.jsx # Renders a single list, contains NewCardForm
│   │   │   ├── NewListForm.jsx
│   │   │   ├── NewCardForm.jsx # Includes title, description, priority (labels)
│   │   │   └── PriorityDisplay.jsx # Helper for styling priority labels
│   │   └── workspaces/
│   │       ├── WorkspaceList.jsx
│   │       └── WorkspaceItem.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Global Auth state & API URL
│   │   └── SocketContext.jsx # Global Socket.io instance
│   ├── hooks/
│   │   └── useAuth.js        # Custom hook for auth logic
│   ├── pages/
│   │   ├── LandingPage.jsx   # Public landing page
│   │   ├── WorkspacesPage.jsx
│   │   └── BoardPage.jsx     # Container for BoardView
│   ├── App.jsx             # Main application component, Router setup
│   ├── main.jsx            # React root rendering
│   └── index.css           # Tailwind CSS directives & custom styles
```

### 3.2. Component Specification (Key Components)

#### 3.2.1. `App.jsx`

* **Responsibility:**
    * Sets up React Router.
    * Provides `AuthContext` and `SocketContext` to the entire application.
    * Handles JWT token initialization and Socket.io connection on mount.
* **State:** Global `user` object, `token`, `isAuthenticated`, `socket` instance.
* **Interactions:** Listens to `socket.on('connect')`, `socket.on('disconnect')`.

#### 3.2.2. `BoardView.jsx`

* **Responsibility:**
    * Fetches all board data (board details, lists, cards) on mount.
    * Manages state for `board`, `lists`, `allCards`, `filteredCards`.
    * Handles search input and filters cards.
    * Renders `BoardHeader` and `ListColumn` components.
    * Emits `joinBoard` socket event.
    * Subscribes to real-time events (`cardUpdate`, `commentAdded`, etc.).
* **Props:** None (uses `useParams` for `boardId`).
* **State:** `board`, `lists`, `allCards`, `filteredCards`, `searchTerm`, `loading`, `error`, `showNewListForm`.
* **Functions:**
    * `fetchBoardData()`: Async, fetches board, lists, and cards from API.
    * `handleListCreate(newList)`: Updates `lists` state.
    * `handleCardCreate(newCard)`: Updates `allCards` state.
    * `groupCardsByList(cards)`: Helper to group cards for rendering.

#### 3.2.3. `ListColumn.jsx`

* **Responsibility:**
    * Renders a single list title and its associated cards.
    * Manages state for showing/hiding the `NewCardForm`.
    * Passes `onCardCreate` down to `NewCardForm`.
* **Props:** `list` (object), `cards` (array), `onCardCreate` (function from `BoardView`).
* **State:** `showNewCardForm`.
* **Functions:**
    * `handleNewCard(newCard)`: Calls `onCardCreate` prop.

#### 3.2.4. `NewCardForm.jsx`

* **Responsibility:**
    * Provides input fields for card `title`, `description`, and `priority` (as a label).
    * Handles form submission to create a new card via API.
    * Calculates `position` for the new card.
* **Props:** `listId`, `cards` (for position calculation), `onCardCreate`, `onCancel`.
* **State:** `title`, `description`, `priorityLabel`, `loading`, `error`.
* **Functions:**
    * `handleSubmit(e)`: Async, sends `POST /api/cards` request, calls `onCardCreate` on success.

#### 3.2.5. `PriorityDisplay.jsx`

* **Responsibility:** Renders a styled priority tag based on a given label string.
* **Props:** `priorityLabel` (String, e.g., 'high', 'medium', 'low').
* **Logic:** Determines background color and display text based on `priorityLabel`.

### 3.3. State Management Strategy

* **Global State:**
    * `AuthContext`: User authentication status (`user`, `token`, `isAuthenticated`), `API_URL`.
    * `SocketContext`: The active Socket.io client instance.
* **Component-Level State:** `useState` is used extensively for UI-related state (e.g., form inputs, toggles like `showNewCardForm`, `loading` indicators, `error` messages).
* **Data Flow:** Data flows top-down via props. Actions (e.g., creating a card) flow bottom-up via callback functions (`onCardCreate`). Real-time updates directly modify central states in `BoardView` when received via Socket.io.

## 4. Error Handling

* **Frontend:**
    * Uses `try-catch` blocks in async operations (e.g., API calls).
    * `error` state variables display user-friendly messages in forms/components.
    * Redirects on unauthorized access (`401`) using `react-router-dom`.
* **Backend:**
    * Centralized `errorHandler` middleware catches all `AppError` instances (custom error class for operational errors).
    * Catches Mongoose validation errors (`400 Bad Request`).
    * Sends appropriate HTTP status codes and JSON error responses.

## 5. Security Details

* **JWT Storage:** JWT tokens are stored in `localStorage` on the client. For a production-grade application, `HttpOnly` cookies would be preferred to mitigate XSS attacks.
* **CORS:** Backend is configured to accept requests only from the frontend's domain.
* **Data Validation:** Extensive schema validation in Mongoose ensures data integrity and prevents common injection attacks.
* **Role-Based Authorization:** Basic authorization logic is implemented to ensure only board members/owners can perform certain actions (e.g., adding members, editing board details).