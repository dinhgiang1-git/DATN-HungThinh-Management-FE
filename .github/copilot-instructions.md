# Copilot Instructions - HungThinh Management Frontend

## Project Overview

**HungThinh Management** is a React 19 + Vite property management system frontend that provides a dashboard for managing apartments, residents, devices, notifications, feedback, maintenance tasks, and invoices.

- **Tech Stack**: React 19, Vite, Tailwind CSS 4, React Router 7, Axios, React Context API
- **Build Tool**: Vite (dev: `npm run dev`, build: `npm run build`)
- **API Backend**: Spring Boot at `http://localhost:8081`
- **Language**: Vietnamese UI with English code comments

---

## Architecture Patterns

### 1. Project Structure

```
src/
├── components/layout/        # Reusable layout components (Header, Sidebar, Layout wrapper)
├── pages/                     # Route-level pages (one per feature area)
├── services/                  # API service layer (api.js + feature-specific services)
├── contexts/                  # React Context (AuthContext for auth state)
└── assets/                    # Static assets (images, icons)
```

### 2. Authentication & Authorization

**Pattern**: Context-based auth with localStorage persistence

- **File**: [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)
- **Usage**: Wrap app with `<AuthProvider>`, access via `useAuth()` hook
- **Auth State**: `user`, `token`, `isAuthenticated`, `loading`
- **Key Methods**: `login(userData, authToken)`, `logout()`

**Protected Routes**: Use `<PrivateRoute>` wrapper in [src/App.jsx](src/App.jsx)

### 3. API Layer

**Pattern**: Axios-based centralized API with interceptors

- **Base Config**: [src/services/api.js](src/services/api.js) - creates axios instance with:
  - Base URL: `http://localhost:8081`
  - Request interceptor: Auto-injects `Authorization: Bearer {token}` header
  - Response interceptor: Redirects to `/login` on 401, clears auth state

- **Feature Services**: Each feature has dedicated service (e.g., `apartmentService.js`, `userService.js`)
  - Import base `api` instance and export functions that call specific endpoints
  - Naming convention: `function${Operation}()` (e.g., `fetchApartments()`, `createMaintenance()`)

### 4. UI Components & Styling

**Pattern**: Tailwind CSS 4 with inline utilities + custom CSS for complex layouts

- **Layout**: [src/components/layout/Layout.jsx](src/components/layout/Layout.jsx) provides Page wrapper with Header + Sidebar
- **Icons**: Inline SVG components (see Icon patterns in pages like [src/pages/ApartmentsPage.jsx](src/pages/ApartmentsPage.jsx))
- **Notifications**: `react-toastify` - use `toast.success()`, `toast.error()`, `toast.info()` from `'react-toastify'`

### 5. Page Component Pattern

Each page follows this structure:
- **State Management**: `useState` for local UI state (filters, pagination, form data)
- **Data Fetching**: `useEffect` + service calls + error handling with toast notifications
- **Constants**: Define at top (status enums, labels, colors, icons)
- **Render**: Split large renders into sections with clear comment dividers (`/* ─── section name ─── */`)

---

## Common Development Tasks

### Adding a New Page

1. Create page file: `src/pages/NewFeaturePage.jsx`
2. Create service file: `src/services/newFeatureService.js`
3. Import page in [src/App.jsx](src/App.jsx)
4. Add route: `<Route path="/new-feature" element={<PrivateRoute><NewFeaturePage /></PrivateRoute>} />`
5. Add menu item in [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx)

### Adding a New API Service

1. Create file: `src/services/featureService.js`
2. Import base `api` instance: `import api from './api.js'`
3. Export async functions:
   ```javascript
   export async function fetchItems() {
     const response = await api.get('/api/items');
     return response.data;
   }
   ```

### Error Handling

- Wrap API calls in try/catch
- Show user-facing errors via `toast.error('Thao tác thất bại')`
- Log unexpected errors to console for debugging

### Form Handling

- Use `useState` for form state
- Handle submit with async handler + try/catch
- Display loading state during submission (disable button, show spinner)

---

## Conventions

### Naming
- **Pages**: PascalCase + "Page" suffix (`ApartmentsPage.jsx`)
- **Services**: camelCase + "Service" suffix (`apartmentService.js`)
- **Functions**: `fetch${Resource}()`, `create${Resource}()`, `update${Resource}()`, `delete${Resource}()`
- **UI Constants**: SCREAMING_SNAKE_CASE for static arrays/objects

### Code Organization
- Constants (enums, labels, colors, icons) → top of file
- Hooks and fetching logic → middle
- JSX render → bottom
- Inline comments divide major sections: `/* ─── section name ─── */`

### Styling
- Use Tailwind utility classes for spacing, colors, layout
- Flex layouts: `flex items-center justify-center`
- Responsive: `sm:`, `md:`, `lg:` prefixes
- Custom CSS in `index.css` only for global styles or complex pseudo-states

### Localization
- UI text in **Vietnamese** 🇻🇳
- Code comments in **English**
- Common phrases: "Đang tải..." (loading), "Thao tác thất bại" (operation failed)

---

## Build & Development Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production (dist/)
npm run lint      # Run ESLint checks
npm run preview   # Preview production build locally
```

**Dev Environment Requirements**:
- Node.js 18+
- Backend API running on `http://localhost:8081`
- No environment config needed (baseURL hardcoded in [src/services/api.js](src/services/api.js))

### API Documentation

The backend Spring Boot API is documented via OpenAPI 3.1.0 at `http://localhost:8081/swagger-ui.html` (when available).

**Key Endpoints**:
- `POST /api/auth/login` - Login with username/password, returns `{ token, user, role }`
- `GET /api/v1/{resource}` - List resources with pagination (page, size, filters, sorting)
- `POST /api/v1/{resource}` - Create resource
- `PATCH /api/v1/{resource}/{id}` - Update resource
- `DELETE /api/v1/{resource}/{id}` - Delete resource
- Resources: `apartments`, `residents`, `users`, `devices`, `maintenances`, `notifications`, `feedbacks`, `invoices`, `tablefees`

**Pagination Pattern**: All list endpoints return `{ content: [], page, size, totalElements, totalPages }`

**Fee Table API** (`/api/v1/tablefees`):
- GET: List all fee tables (no pagination)
- POST: Create with query params `{ title, electricFee, waterFee, managementFee, parkingFee, otherFee }`
- PATCH: Update with query params (same as POST)
- DELETE: Remove fee table

---

## Key Dependencies & Their Roles

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.4 | UI framework |
| `vite` | ^8.0.1 | Build tool |
| `tailwindcss` | ^4.2.2 | Styling |
| `react-router-dom` | ^7.14.0 | Page routing |
| `axios` | ^1.14.0 | HTTP client |
| `react-toastify` | ^11.0.5 | Toast notifications |
| `@tailwindcss/vite` | ^4.2.2 | Tailwind Vite plugin |

---

## Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| **401 Unauthorized errors after auth** | Ensure backend `/login` endpoint returns `{ token, user }` matching expected shape in [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx) |
| **API calls hang or timeout** | Verify backend is running on `:8081` and CORS is configured |
| **Page components re-fetch on every render** | Use dependency array in `useEffect` to prevent infinite loops |
| **Styling not applying** | Clear Vite cache: `rm -rf node_modules/.vite` and rebuild |
| **Auth redirects to login unexpectedly** | Check if response is 401; likely auth token expired or invalid |
| **Modal functions undefined (e.g., `applyTableFee`, `fetchTableFees`)** | Ensure all handler functions are defined as `useCallback` or regular functions before being used in JSX |
| **`activeFee` undefined in InvoicesPage** | Must be derived from `tableFees[0]` after fetching: `const activeFee = tableFees?.[0] \|\| null` |

---

## Recent Fixes (April 2026)

### InvoicesPage.jsx Issues Fixed
1. **Added missing `fetchTableFees` function** - Loads fee table from API when component mounts
2. **Added missing `activeFee` definition** - Extracts first fee table entry for use in modals
3. **Added missing `applyTableFee` handler** - Applies selected fee table values to invoice form

### tableFeeService.js Updates
- Verified API uses query parameters for `create` and `update` methods (per OpenAPI spec)

---

## Related Documentation

- [README.md](../../README.md) - Project setup (Vite + React template)
- [package.json](../../package.json) - Dependencies and scripts
- [vite.config.js](../../vite.config.js) - Vite configuration (React + Tailwind plugins)

---

## AI Agent Guidance

When working in this codebase, **Copilot should**:

1. **Follow the service layer pattern** — Always access data through feature-specific services, never make axios calls directly in components
2. **Respect auth context** — Access auth state via `useAuth()`, never bypass with manual token handling
3. **Use toast for feedback** — Show success/error/info messages to users via `toast.*()` instead of console logs
4. **Match existing page structure** — New pages should follow the pattern in existing pages (constants → hooks → render)
5. **Verify backend compatibility** — When adding new features, coordinate endpoint expectations with backend Spring Boot API
6. **Keep UI in Vietnamese** — User-facing text should match localization in existing pages
7. **Test with dev server** — Validate changes by running `npm run dev` and testing locally before suggesting deploy
8. **Define all handler functions** — In page components using modals, ensure all event handlers (`applyTableFee`, `fetchTableFees`, etc.) are defined before use

---

## Example: Adding a New CRUD Feature

### Step 1: Create Service
File: `src/services/exampleService.js`
```javascript
import api from './api.js';

export async function fetchExamples() {
  const response = await api.get('/api/examples');
  return response.data;
}

export async function createExample(data) {
  const response = await api.post('/api/examples', data);
  return response.data;
}
```

### Step 2: Create Page
File: `src/pages/ExamplesPage.jsx` - Use [src/pages/ApartmentsPage.jsx](src/pages/ApartmentsPage.jsx) as template

### Step 3: Integrate Routes
Update [src/App.jsx](src/App.jsx) to add route and [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx) to add menu item

---

**Last Updated**: April 2026  
**Maintained By**: HungThinh Development Team
