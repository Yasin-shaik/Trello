# Mini-Trello (Kanban) Application by Scaler

This repository contains a full-stack implementation of a simplified Trello-like Kanban board, built using the MERN stack. It features real-time collaboration, JWT authentication, and a robust, modular API design.

## 🌟 Core Features Implemented

* [cite_start]**Full Authentication Flow:** JWT-based signup, login, and protected routes[cite: 7, 17].
* [cite_start]**Real-Time Collaboration:** Live broadcasting of card movements and new comments using **Socket.io**[cite: 24, 26, 75].
* [cite_start]**Kanban Board:** Lists (columns) and Cards with stable ordering via fractional positioning[cite: 8, 9, 14].
* [cite_start]**Search & Filtering:** Text search functionality across card titles, descriptions, and labels within a specific board[cite: 15, 22, 75].
* [cite_start]**Modular Architecture:** Clean separation of concerns (Controllers, Routes, Middleware) for maintainability and scalability[cite: 57].
* [cite_start]**Data Hierarchy:** Implements the core entities: **Users, Workspaces, Boards, Lists, Cards, Comments, and Activity Log**[cite: 6, 7, 8, 9, 10].

---

## [cite_start]🛠️ Tech Stack & Rationale [cite: 40]

### Backend (Node.js/Express)

| Technology | Rationale |
| :--- | :--- |
| **Express.js** | Provides a minimal and flexible foundation for designing RESTful APIs. |
| **MongoDB/Mongoose** | Chosen for its flexible JSON-like document model, matching the unstructured nature of Kanban cards and activities. Mongoose simplifies schema definition and relational mapping. |
| **JWT** | [cite_start]Standard, secure, and stateless authentication method for REST APIs[cite: 12]. |
| **Socket.io** | [cite_start]Protocol chosen for fast, reliable, and bi-directional real-time communication necessary for live collaboration[cite: 25]. |

### Frontend (React/Vite)

| Technology | Rationale |
| :--- | :--- |
| **React** | [cite_start]Component-based architecture for building a dynamic, complex user interface (UI)[cite: 58]. |
| **Vite** | Modern, fast build tool chosen for rapid development and optimized asset bundling, offering significant speed advantages over older tools like Webpack/CRA. |
| **Tailwind CSS** | [cite_start]Utility-first CSS framework for rapid, atomic styling and easy component composition[cite: 58]. |
| **axios** | Promise-based HTTP client for cleaner, simpler API interaction. |

---

## [cite_start]⚙️ Local Setup and Run Steps [cite: 41]

These instructions assume you have Node.js (v16+) and a running MongoDB instance (local or Atlas) available.

### [cite_start]1. Database and Environment Setup [cite: 43]

1.  **Clone the Repository:**
    ```bash
    git clone [REPO_URL]
    cd [REPO_NAME]
    ```
2.  **Create `.env`:** In the **`Backend`** folder, create a file named `.env` and populate it using the example below:

    ```env
    # .env (in Backend folder)
    PORT=5000
    MONGO_URI="mongodb://localhost:27017/trello_clone_db" 
    JWT_SECRET="YOUR_SUPER_SECURE_RANDOM_STRING_HERE_12345"
    ```

### 2. Backend Initialization (API Server)

1.  Navigate to the backend directory:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server (uses `nodemon` for development):
    ```bash
    npm run dev
    ```
    *(The API server will be running on `http://localhost:5000`)*

### 3. Frontend Initialization (React App)

1.  Navigate to the frontend directory:
    ```bash
    cd ../Frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the client:
    ```bash
    npm run dev
    ```
    *(The application will be running on `http://localhost:5173`)*

---

## [cite_start]📊 Schema Overview and Key Entities [cite: 44]

The application models a strict data hierarchy, essential for security and complex queries.

| Entity | Purpose | Key Relationships & Fields |
| :--- | :--- | :--- |
| **User** | Authentication & identity | [cite_start]`name`, `email`, `password` (hashed)[cite: 7]. |
| **Workspace** | High-level organizational unit (Team/Org) | [cite_start]`owner` (User), `members` (Array of Users)[cite: 7]. |
| **Board** | The Kanban surface | [cite_start]`workspaceId` (Workspace), `owner` (User), `members` (Array of Users)[cite: 7]. |
| **List** | Ordered column | [cite_start]`boardId` (Board), **`position`** (Float for ordering)[cite: 8, 14]. |
| **Card** | Individual task item | [cite_start]`listId` (List), `assignees` (User array), **`position`** (Float), `labels`[cite: 9, 14]. |
| **Comment** | Discussion thread on a card | [cite_start]`cardId` (Card), `authorId` (User)[cite: 9]. |
| **ActivityLog** | Audit trail of board actions | [cite_start]`boardId`, `actorId`, `type`, `metadata`[cite: 10]. |

### [cite_start]Indexing & Ordering Strategy [cite: 48, 62]

To ensure stable ordering of lists and cards even during drag-and-drop, we use a **fractional positioning strategy**. The `position` field on both the `List` and `Card` models is a floating-point number.

* When a new item is created, its position is set to `(last_item_position + 1000)`.
* When an item is moved between two existing items (e.g., pos A=1000, pos B=2000), the new position is calculated as the average: `(A + B) / 2 = 1500`.
* [cite_start]This avoids expensive full collection reindexing ("reindex storms")[cite: 62].

---

## [cite_start]🚀 Final Steps & Verification [cite: 72]

You can verify the system is fully functional by performing the following checks:

1.  **Authentication:** Register a new user and confirm login redirects to `/workspaces`.
2.  [cite_start]**Creation:** Create a new Workspace and then create a new Board within it[cite: 73].
3.  **Real-Time Check:** Open the board in two different browser tabs. [cite_start]Move a card and confirm the change appears immediately in the second tab[cite: 75].
4.  [cite_start]**Data Integrity:** Verify that clicking a board in the sidebar correctly loads the corresponding Kanban view by checking the URL parameter[cite: 73].
5.  [cite_start]**Search:** Use the search bar to filter cards by title, status (labels), or user email[cite: 75].