# Niveshya Lead Management System

A comprehensive investment tracking and lead management system built with FastAPI (Python) backend and React (TypeScript) frontend, using MongoDB for flexible data storage.

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)

- **FastAPI**: Modern, fast Python web framework with automatic API documentation
- **MongoDB**: NoSQL database perfect for flexible JSON-based data structures
- **Beanie ODM**: Async MongoDB object document mapper built on Pydantic
- **SOLID Principles**: Clean architecture with dependency injection

### Frontend (React + TypeScript + TailwindCSS)

- **React 18**: Modern React with TypeScript for type safety
- **TailwindCSS**: Utility-first CSS framework for rapid development
- **Following 21st.dev principles**: Modern web development best practices

## 📊 Data Models

Based on your existing JSON data structure:

### 1. **Contacts** (`rearrangedContacts.json`)

- External organization contacts
- Personal details, contact information
- Geographic and organizational data

### 2. **Fundraising** (`summary_FR.json`)

- Investment tracking with stages
- Financial amounts and commitments
- Process tracking (meetings, due diligence, etc.)

### 3. **Users** (`users.json`)

- Niveshya team members
- Authentication and role management
- Employee information

### 4. **Opportunities**

- Business opportunities tracking
- Probability and value estimates
- Status and priority management

### 5. **Tasks**

- Activity and follow-up tracking
- Due dates and assignments
- Integration with contacts/opportunities

### 6. **Tracker**

- Flexible tracking for miscellaneous data
- JSON storage for varied data types

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Docker Setup (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd funds-trackon
   ```

2. **Configure environment**:
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

3. **Start the application**:
   ```bash
   # Make scripts executable (first time only)
   chmod +x start.sh stop.sh

   # Start all services
   ./start.sh
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup (Alternative)

### Manual Setup Requirements

- Python 3.8+
- Node.js 16+
- MongoDB 4.4+

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start the server
python main_simple.py
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
PORT=3001 npm start
```

#### MongoDB Setup

```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Or use MongoDB Atlas (cloud) - update .env accordingly
```

## 🔧 Configuration

### Backend Configuration (`backend/.env`)

```env
# MongoDB settings
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=trackon_lead_management

# JWT settings
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS settings
CORS_ORIGINS=["http://localhost:3001", "http://127.0.0.1:3001"]

# Environment
ENVIRONMENT=development
DEBUG=true
```

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>

### Key Endpoints

#### Contacts

- `GET /api/contacts/` - List contacts
- `POST /api/contacts/` - Create contact
- `GET /api/contacts/{id}` - Get contact details
- `PUT /api/contacts/{id}` - Update contact
- `DELETE /api/contacts/{id}` - Delete contact
- `GET /api/contacts/search/?q={query}` - Search contacts

#### More endpoints for Fundraising, Users, Opportunities, Tasks, Tracker

## 🎯 Features

### ✅ Completed Features

- FastAPI backend with MongoDB integration
- Pydantic models based on your JSON structure
- React frontend with TailwindCSS styling
- Contact management API
- Type-safe models with validation
- CORS configuration for frontend-backend communication

### 🚧 Next Development Phase

- Complete all CRUD controllers (Fundraising, Users, etc.)
- Authentication & authorization system
- React components for each data model
- Dashboard with analytics
- Data import from your existing JSON files
- Real-time updates with WebSocket
- Advanced search and filtering
- Export capabilities (PDF, Excel)

## 🏛️ Project Structure

```text
new-trackon/
├── backend/
│   ├── app/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/          # Pydantic/Beanie data models
│   │   ├── services/        # Business logic layer
│   │   ├── repositories/    # Data access layer
│   │   └── utils/           # Configuration and utilities
│   ├── main.py             # FastAPI application
│   ├── main_simple.py      # Simplified startup
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client services
│   │   └── utils/          # Utilities and helpers
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── .github/
    └── copilot-instructions.md
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Pydantic
- Environment-based configuration

## 📱 Frontend Features

- Responsive design with TailwindCSS
- TypeScript for type safety
- Modern React hooks and patterns
- API client with axios
- Form handling and validation

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

## 📈 Development Workflow

1. **Start MongoDB**: Ensure MongoDB is running locally or use Atlas
2. **Backend Development**: Run `python main_simple.py` in backend/
3. **Frontend Development**: Run `PORT=3001 npm start` in frontend/
4. **API Testing**: Use the Swagger UI at <http://localhost:8000/docs>
5. **Frontend Testing**: Access the app at <http://localhost:3001>

## 🚀 Deployment

### Backend Deployment

- Use Docker containers
- Deploy to AWS/GCP/Azure
- Use managed MongoDB (Atlas)
- Set environment variables

### Frontend Deployment

- Build: `npm run build`
- Deploy to Netlify/Vercel/S3
- Configure API base URL

## ⚙️ Centralized port settings (.env)

The Docker setup reads ports and CORS from the root `.env` file:

- `FRONTEND_PORT` (default 3002)
- `BACKEND_PORT` (default 8001; container still serves 8000 internally)
- `MONGO_PORT` (default 27019; container port remains 27017)
- `CORS_ORIGINS` JSON array (e.g., `["http://localhost:3002","http://127.0.0.1:3002"]`)

To change ports:

1. Edit `.env` at the repository root
2. Recreate the stack

```bash
docker compose down
docker compose up -d --build
```

Then access:

- Frontend: <http://localhost:${FRONTEND_PORT}>
- Backend API docs: <http://localhost:${BACKEND_PORT}/docs>

## 🤝 Contributing

1. Follow SOLID principles for backend development
2. Use TypeScript for type safety in frontend
3. Follow TailwindCSS conventions for styling
4. Write tests for new features
5. Update documentation

## 📞 Support

For questions about the Lead Management System, please contact the Niveshya development team.

---

### Built with ❤️ for Niveshya Investment Management
