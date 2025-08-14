# Role-Based Access Control System

This document describes the new role-based access control system implemented in the Decibel project.

## User Roles

### 1. Admin
- **Full system access**: Can manage all districts, sites, sirens, and users
- **User management**: Can create, update, and delete users (admins, managers, operators)
- **District management**: Can create, update, and delete districts
- **Site management**: Can create, update, and delete sites within districts
- **Siren management**: Can create, update, and delete sirens within sites

### 2. Manager
- **Limited access**: Can only access assigned districts and their sites/sirens
- **Siren operations**: Can view and control sirens in their assigned districts
- **No user management**: Cannot create or manage users
- **No structural changes**: Cannot create, update, or delete districts/sites

### 3. Operator
- **Limited access**: Can only access assigned districts and their sites/sirens
- **Siren operations**: Can view and control sirens in their assigned districts
- **No user management**: Cannot create or manage users
- **No structural changes**: Cannot create, update, or delete districts/sites

## System Hierarchy

```
Admin
├── Creates Districts
│   └── Creates Sites within Districts
│       └── Creates Sirens within Sites
├── Creates Users (Managers/Operators)
└── Assigns Districts to Users

Manager/Operator
├── Views assigned Districts only
├── Views Sites in assigned Districts only
└── Views/Controls Sirens in assigned Districts only
```

## API Endpoints

### Authentication & User Management
- `GET /api/auth` - Get current user info
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Public user registration
- `GET /api/auth/users` - Get all users (Admin only)
- `POST /api/auth/users` - Create new user (Admin only)
- `PUT /api/auth/users/:id` - Update user (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### District Management
- `GET /api/districts` - Get districts (filtered by access)
- `POST /api/districts` - Create district (Admin only)
- `PUT /api/districts/:id` - Update district (Admin only)
- `DELETE /api/districts/:id` - Delete district (Admin only)
- `GET /api/districts/:id/sites` - Get sites in district (with access control)

### Site Management
- `GET /api/sites` - Get sites (filtered by access)
- `POST /api/sites` - Create site (Admin only)
- `PUT /api/sites/:id` - Update site (Admin only)
- `DELETE /api/sites/:id` - Delete site (Admin only)
- `GET /api/sites/:id` - Get specific site (with access control)

### Siren Management
- `GET /api/sirens/all` - Get sirens (filtered by access)
- `GET /api/sirens/:id` - Get specific siren (with access control)
- `POST /api/sirens/create` - Create siren (Admin only)
- `PATCH /api/sirens/:id` - Update siren (Admin only)
- `DELETE /api/sirens/:id` - Delete siren (Admin only)
- `POST /api/sirens/add_many` - Add multiple sirens (Admin only)

## Access Control Middleware

### `requireAdmin`
- Ensures user is an admin
- Used for admin-only operations

### `requireAdminOrManager`
- Ensures user is admin or manager
- Used for operations that require elevated privileges

### `checkDistrictAccess`
- Checks if user has access to a specific district
- Admins have access to all districts
- Managers/Operators only have access to assigned districts

### `checkSiteAccess`
- Checks if user has access to a specific site
- Admins have access to all sites
- Managers/Operators only have access to sites in their assigned districts

## Data Models

### User Model
```typescript
interface IUser {
  email: string;
  name: string;
  userName?: string;
  password: string;
  emailVerified: boolean;
  avatar?: string;
  userType: 'admin' | 'manager' | 'operator';
  assignedDistricts: ObjectId[]; // Only for managers and operators
  createdBy?: ObjectId; // Reference to admin who created this user
}
```

### District Model
```typescript
interface IDistrict {
  id: string;
  name: string;
  blocks: string[];
  sites: ObjectId[]; // Reference to sites
  createdBy: ObjectId; // Reference to admin who created this district
}
```

### Site Model
```typescript
interface ISite {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  district: ObjectId; // Reference to district
  block: string;
  description?: string;
  status: 'active' | 'inactive';
  createdBy: ObjectId; // Reference to admin who created this site
}
```

### Siren Model (Updated)
```typescript
interface ISiren {
  // ... existing fields ...
  site: ObjectId; // Reference to site (NEW)
  district: string; // Keep for backward compatibility
  // ... rest of existing fields ...
}
```

## Migration

To migrate existing data to the new role-based system:

1. Run the migration script:
   ```bash
   node backend/scripts/migrate-to-role-based.js
   ```

2. This will create:
   - A default admin user (admin@decibel.company / admin123)
   - A default district
   - A default site
   - Update existing sirens to reference the default site

3. After migration:
   - Login as the admin user
   - Create proper districts and sites
   - Create manager and operator users
   - Assign districts to users as needed

## Security Features

1. **Role-based access control**: Users can only access resources they're authorized for
2. **District isolation**: Managers and operators are isolated to their assigned districts
3. **Audit trail**: All resources track who created them
4. **Input validation**: All endpoints validate input data
5. **Error handling**: Consistent error responses across all endpoints

## Frontend Integration

The frontend should:

1. **Check user role** on login and store it in context/state
2. **Show/hide UI elements** based on user role
3. **Filter data** based on user's assigned districts
4. **Handle access denied errors** gracefully
5. **Provide admin interfaces** for user, district, and site management

## Example Usage

### Creating a Manager User (Admin)
```javascript
const managerData = {
  name: "John Manager",
  email: "john.manager@company.com",
  password: "securepassword123",
  userType: "manager",
  assignedDistricts: ["district1Id", "district2Id"]
};

await fetch('/api/auth/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': adminToken
  },
  body: JSON.stringify(managerData)
});
```

### Getting Sirens (Manager/Operator)
```javascript
// This will automatically filter to only show sirens in assigned districts
const sirens = await fetch('/api/sirens/all', {
  headers: {
    'x-auth-token': userToken
  }
});
```
