# Visitor & Parcel Management System (VPMS)

A comprehensive web-based management system designed for residential complexes and gated communities to efficiently manage visitor entries, parcel deliveries, and resident approvals.

## 🌟 Features

### Visitor Management

- **Visitor Registration**: Guards can log visitor details including name, phone, purpose, vehicle information, and expected entry/exit times
- **Resident Approval**: Residents receive notifications for pending visitor approvals
- **Real-time Status Tracking**: Track visitor status from registration to approval/rejection to entry/exit
- **Visitor History**: Complete historical records of all visitor activities
- **Photo & ID Proof Upload**: Optional document uploads for enhanced security

### Parcel Management

- **Parcel Logging**: Guards can register incoming parcels with sender details, tracking numbers, and descriptions
- **Resident Notifications**: Automated notifications to residents upon parcel arrival
- **Pickup Tracking**: Track parcel status from arrival to pickup
- **Parcel History**: Comprehensive parcel delivery history for residents

### User Management

- **Role-Based Access Control**: Three user roles with distinct permissions
  - **Admin**: Full system access, user management, system configuration
  - **Guard**: Visitor and parcel logging, status updates
  - **Resident**: Visitor approval, parcel pickup, history viewing
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **User Profile Management**: Update personal information and passwords

### Dashboard & Analytics

- **Admin Dashboard**: System-wide statistics and user management
- **Guard Dashboard**: Quick access to visitor/parcel logging
- **Resident Dashboard**: Pending approvals and notifications

## 🚀 Technology Stack

### Frontend

- **Framework**: Angular 16+
- **UI Library**: Angular Material Design
- **Styling**: SCSS with custom themes
- **HTTP Client**: Angular HttpClient with interceptors
- **State Management**: RxJS Observables
- **Routing**: Angular Router with route guards
- **Forms**: Reactive Forms with validation

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 8.0+
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **API Architecture**: RESTful API

### Additional Technologies

- **CORS**: Enabled for cross-origin requests
- **Environment Management**: dotenv for configuration
- **SQL Query Builder**: mysql2 with named parameters
- **Body Parser**: Express built-in JSON parser

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.x or higher ([Download](https://nodejs.org/))
- **npm**: v8.x or higher (comes with Node.js)
- **MySQL**: v8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **Angular CLI**: v16.x or higher
  ```bash
  npm install -g @angular/cli
  ```

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "project managment system"
```

### 2. Database Setup

1. **Create Database**:

   ```sql
   CREATE DATABASE vpms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Run Migration Script**:

   ```bash
   cd backend
   mysql -u root -p vpms_db < database/schema.sql
   ```

   Or execute the following SQL manually:

   ```sql
   -- Users table
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     full_name VARCHAR(255) NOT NULL,
     phone VARCHAR(20),
     role ENUM('admin', 'guard', 'resident') NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   -- Visitors and Parcels table (unified)
   CREATE TABLE visitors_parcels (
     id INT AUTO_INCREMENT PRIMARY KEY,
     record_type ENUM('visitor', 'parcel') NOT NULL,
     resident_id INT NOT NULL,
     full_name VARCHAR(255),
     phone VARCHAR(20),
     purpose TEXT,
     status ENUM('new', 'waiting_approval', 'approved', 'rejected', 'checked_in', 'checked_out', 'delivered', 'picked_up') NOT NULL DEFAULT 'new',
     expected_at DATETIME,
     arrived_at DATETIME,
     checked_in_at DATETIME,
     checked_out_at DATETIME,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (resident_id) REFERENCES users(id)
   );

   -- Insert default admin user (password: admin123)
   INSERT INTO users (email, password_hash, full_name, role)
   VALUES ('admin@vpms.com', '$2b$10$YourHashedPasswordHere', 'System Admin', 'admin');
   ```

### 3. Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `backend` directory:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=vpms_db

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_in_production
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:4200
   ```

4. **Build and run**:

   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production build
   npm run build
   npm start
   ```

   The backend server will start at `http://localhost:3000`

### 4. Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment**:
   Update `frontend/src/environments/environment.ts`:

   ```typescript
   export const environment = {
     production: false,
     apiUrl: "http://localhost:3000/api",
   };
   ```

4. **Run development server**:

   ```bash
   npm start
   ```

   The application will open at `http://localhost:4200`

## 🚢 Deploying to Vercel (serverless)

1. **Project linking**: From the repo root run `vercel` and select the project; Vercel reads `vercel.json` for build and routing.
2. **Environment variables**: In Vercel Project Settings → Environment Variables, add the values shown in [backend/.env.example](backend/.env.example): `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.
3. **Database**: Point the DB variables to a hosted MySQL instance that allows external connections (e.g., PlanetScale, RDS). Ensure the user has privileges and SSL if required.
4. **Deploy**: Push to the connected branch or run `vercel --prod`; Vercel will install and build both workspaces and expose the API at `/api` with the Angular app served statically.
5. **Health check**: After deploy, hit `/health` to confirm DB connectivity.

## 🎯 Usage

### Default Credentials

After setting up the database, you can log in with:

**Admin Account**:

- Email: `admin@vpms.com`
- Password: `admin123`

### Creating Additional Users

1. Log in as admin
2. Navigate to "User Management"
3. Click "Add New User"
4. Fill in user details and assign role (Guard/Resident)
5. User will receive credentials to log in

### Visitor Workflow

1. **Guard logs visitor**:

   - Navigate to "Log Visitor"
   - Enter visitor details (name, phone, purpose)
   - Select resident being visited
   - Optionally add vehicle info and expected entry/exit time
   - Submit

2. **Resident approves/rejects**:

   - Log in as resident
   - Navigate to "Visitor Management"
   - View pending approvals
   - Approve or reject visitor

3. **Guard checks in/out**:
   - View visitor list
   - Update status when visitor enters/exits

### Parcel Workflow

1. **Guard logs parcel**:

   - Navigate to "Log Parcel"
   - Enter parcel details (sender, tracking, description)
   - Select recipient resident
   - Submit

2. **Resident receives notification**:

   - Resident sees pending parcel in dashboard
   - Can view parcel details

3. **Guard marks as picked up**:
   - When resident collects parcel
   - Update status to "Picked Up"

## 📁 Project Structure

```
project managment system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                 # Database configuration
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Authentication logic
│   │   │   ├── parcelController.ts   # Parcel management
│   │   │   ├── userController.ts     # User management
│   │   │   └── visitorController.ts  # Visitor management
│   │   ├── middlewares/
│   │   │   ├── auth.ts               # JWT authentication middleware
│   │   │   └── roleGuard.ts          # Role-based access control
│   │   ├── models/
│   │   │   ├── parcel.ts             # Parcel model
│   │   │   ├── parcelRepository.ts   # Parcel data access
│   │   │   ├── user.ts               # User model
│   │   │   ├── userRepository.ts     # User data access
│   │   │   ├── visitor.ts            # Visitor model
│   │   │   └── visitorRepository.ts  # Visitor data access
│   │   ├── routes/
│   │   │   ├── authRoutes.ts         # Authentication endpoints
│   │   │   ├── parcelRoutes.ts       # Parcel endpoints
│   │   │   ├── userRoutes.ts         # User endpoints
│   │   │   └── visitorRoutes.ts      # Visitor endpoints
│   │   └── server.ts                 # Express server setup
│   ├── .env                          # Environment variables (create this)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── admin/            # Admin dashboard
│   │   │   │   ├── auth/             # Login/Register
│   │   │   │   ├── dashboard/        # Main dashboard
│   │   │   │   ├── landing/          # Landing page
│   │   │   │   ├── parcel/           # Parcel components
│   │   │   │   │   ├── parcel-log/
│   │   │   │   │   └── resident-parcel/
│   │   │   │   ├── shared/           # Shared components
│   │   │   │   ├── user/             # User management
│   │   │   │   └── visitor/          # Visitor components
│   │   │   │       ├── resident-approval/
│   │   │   │       └── visitor-log/
│   │   │   ├── guards/               # Route guards
│   │   │   ├── interceptors/         # HTTP interceptors
│   │   │   ├── models/               # TypeScript interfaces
│   │   │   ├── services/             # API services
│   │   │   ├── app-routing.module.ts
│   │   │   └── app.module.ts
│   │   ├── environments/
│   │   │   ├── environment.ts        # Dev environment
│   │   │   └── environment.prod.ts   # Prod environment
│   │   ├── index.html
│   │   └── styles.scss
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/residents` - Get all residents

### Visitors

- `POST /api/visitors` - Create visitor entry (Guard/Admin)
- `GET /api/visitors` - Get all visitors with filters (Guard/Admin)
- `GET /api/visitors/:id` - Get specific visitor
- `GET /api/visitors/pending/:residentId` - Get pending visitors for resident
- `GET /api/visitors/history/:residentId` - Get visitor history for resident
- `GET /api/visitors/pending-count/:residentId` - Get pending count
- `PUT /api/visitors/:id/status` - Update visitor status

### Parcels

- `POST /api/parcels` - Create parcel entry (Guard/Admin)
- `GET /api/parcels` - Get all parcels with filters (Guard/Admin)
- `GET /api/parcels/:id` - Get specific parcel
- `GET /api/parcels/pending/resident/:residentId` - Get pending parcels
- `GET /api/parcels/history/resident/:residentId` - Get parcel history
- `PUT /api/parcels/:id/status` - Update parcel status

### Users (Admin only)

- `POST /api/users` - Create new user
- `GET /api/users` - Get all users with filters
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user details
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/password` - Change user password

## 👥 User Roles & Permissions

### Admin

- Full system access
- Create, read, update, delete users
- View all visitors and parcels
- System configuration
- Analytics and reports

### Guard

- Log visitor entries
- Log parcel arrivals
- Update visitor/parcel status
- View all visitors and parcels
- Cannot manage users

### Resident

- Approve/reject visitor requests
- View own visitor history
- View pending parcels
- Mark parcels as picked up
- Update own profile
- Cannot access other residents' data

## 🎨 Features in Detail

### Professional Landing Page

- Modern, animated hero section
- SVG building illustration with floating particles
- Feature showcase with icons
- Responsive design for all devices
- Call-to-action buttons

### Visitor Management System

- Complete visitor lifecycle tracking
- Phone number integration for easy contact
- Expected entry and exit time recording
- Vehicle information tracking
- Document upload support (photos, ID proofs)
- Real-time approval workflow
- Status badges with color coding

### Parcel Management System

- Sender and tracking number recording
- Parcel description and notes
- Delivery status tracking
- Resident notification system
- Pickup confirmation
- Historical records

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Route guards for protected pages
- HTTP interceptors for token management
- Automatic token refresh
- Session timeout handling

## 🔍 Troubleshooting

### Backend Issues

**Database connection failed**:

- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env` file
- Ensure database `vpms_db` exists
- Check firewall settings

**Port 3000 already in use**:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Frontend Issues

**Angular CLI not found**:

```bash
npm install -g @angular/cli@16
```

**Module not found errors**:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**CORS errors**:

- Check `CORS_ORIGIN` in backend `.env`
- Ensure it matches frontend URL (default: `http://localhost:4200`)

## 🚀 Deployment

### Backend Deployment

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Set production environment variables**:

   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   JWT_SECRET=strong_production_secret
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Start with PM2** (recommended):
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name vpms-backend
   pm2 save
   pm2 startup
   ```

### Frontend Deployment

1. **Build for production**:

   ```bash
   ng build --configuration production
   ```

2. **Deploy `dist/` folder** to:

   - Static hosting (Netlify, Vercel, GitHub Pages)
   - Web servers (Apache, Nginx)
   - Cloud platforms (AWS S3, Azure, Google Cloud)

3. **Configure server** for Angular routing:

   - All routes should redirect to `index.html`

   **Nginx example**:

   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

## 📄 License

This project is developed for residential complex management. All rights reserved.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@vpms.com or create an issue in the repository.

## 🙏 Acknowledgments

- Angular Material for UI components
- Express.js for backend framework
- MySQL for reliable data storage
- All contributors and testers

---

**Built with ❤️ for making residential management seamless and efficient**
