# Real-Time Collaborative Kanban System

A production-grade, highly optimized concurrent Kanban task board utilizing a decoupled event-driven architecture. This system leverages WebSockets for instantaneous multi-client state synchronization, sub-millisecond layout manipulation, and state caching mechanisms to minimize costly component re-renders.

## 🚀 Architectural Highlights & Tech Stack

* **Frontend Core:** React 18+ (Vite) for declarative UI rendering.
* **State & Optimization:** React Hooks (`useCallback`, `useState`, `useEffect`) implementing memoization boundaries to maintain optimal framerates during rendering cycles.
* **Drag-and-Drop Engine:** `@hello-pangea/dnd` leveraging programmatic DOM abstractions for flawless spatial transitions.
* **Networking Layer:** `Socket.io` & `Socket.io-client` establishing persistent, bi-directional TCP communication channels.
* **Backend Services:** Node.js + Express handling concurrent event streams, CORS negotiation, and real-time state orchestration.

---

## 🛠️ System Design & Engineering Decisions

### 1. Decoupled State & Network Separation of Concerns
To eliminate race conditions and rendering locks during fast client inputs, local drag-and-drop computations are strategically separated from network sync streams. 
* **Local UI Mutation:** Handled instantly via custom splicing algorithms within a memoized execution scope.
* **Network Sync:** Broadcasts the mutated baseline layout data model globally, which is ingested by secondary clients via a isolated synchronization handler (`updateBoardFromNetwork`), preventing UI stutter or state-chasing loops.

### 2. Rendering Optimization via Memoization Boundaries
To counter performance degradation common in deeply nested lists, the system locks structural functions into memory using the `useCallback` hook. By tracking strict dependencies, the application restricts unnecessary component lifecycles, ensuring layout mutations occur at a stable 60 FPS.

### 3. Server-Driven Volatile Persistence
The backend acts as an air-traffic controller and the transient single source of truth (SSOT). When a client establishes a connection handshake, the server emits the current active board layout instantly, enabling persistence across standard browser refreshes without initial payload gaps.

---

## 📦 Local Installation & Setup

### Prerequisites
* Node.js (v18.x or higher)
* npm (v9.x or higher)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone [https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git)
cd YOUR_REPO_NAME

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
