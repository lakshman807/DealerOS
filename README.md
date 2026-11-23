# DealerOS – Multi-Tenant Reconciliation Platform

**DealerOS** is a full-stack, multi-tenant reconciliation platform designed to compare financial transaction records from two different systems. It identifies matching transactions, mismatches, missing records, duplicate entries, and split transactions while maintaining strict organization-based data isolation.

The platform helps businesses identify discrepancies between financial records, monitor reconciliation activities, and generate detailed reports through an interactive dashboard.

## Live Application

- **Live Application:** https://dealerosj.netlify.app/
- **Backend API:** https://dealeros-cugb.onrender.com/
- **GitHub Repository:** https://github.com/lakshman807/DealerOS

## Features

### Authentication and Security
- User authentication using JWT.
- Secure login and logout functionality.
- Organization-based authentication.
- Protected API endpoints.
- Organization-level data isolation.
- Prevention of unauthorized cross-organization data access.

### Dashboard
- Interactive dashboard with reconciliation statistics.
- Organization-specific transaction summaries.
- Data visualization using interactive charts.
- Overview of matching and mismatching transactions.

### Reconciliation
- Transaction reconciliation between System A and System B.
- Automatic identification of matching records.
- Detection of mismatched transactions.
- Identification of missing records.
- Duplicate transaction detection.
- Split transaction identification.
- Search and filter functionality.
- Date-based filtering.

### Reports and Analytics
- Interactive charts and analytics.
- Reconciliation reports.
- CSV report export.
- PDF report generation.
- Filter-based report analysis.

## Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router DOM
- Recharts
- Lucide React
- jsPDF

### Backend
- Python
- Django
- Django REST Framework
- Django REST Framework Simple JWT
- Gunicorn
- WhiteNoise

### Database
- PostgreSQL – Production database.
- SQLite – Local development database.

### Deployment and Hosting
- **Frontend:** Netlify
- **Backend:** Render
- **Database Hosting:** Render PostgreSQL
- **Version Control:** Git and GitHub

## System Architecture

DealerOS follows a client-server architecture.

```text
                 USER
                   |
                   |
                   v
          React.js Frontend
              (Netlify)
                   |
                   | HTTPS / REST API
                   |
                   v
           Django Backend
               (Render)
                   |
                   |
          JWT Authentication
                   |
                   |
          Organization Access
               Validation
                   |
                   v
          PostgreSQL Database
               (Render)
                   |
                   |
                   v
          Reconciliation Engine
                   |
          +--------+--------+
          |                 |
          v                 v
       System A           System B
          |                 |
          +--------+--------+
                   |
                   v
          Reconciliation Results
                   |
                   v
          Dashboard and Reports
```

## Project Structure

```text
DealerOS/
│
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── reconcile/
│   │
│   ├── data/
│   │
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   │
│   ├── package.json
│   ├── index.html
│   └── netlify.toml
│
├── README.md
└── .gitignore
```

## Installation and Setup

Follow these instructions to run DealerOS locally.

### Prerequisites

Make sure you have installed:

- Python
- Node.js and npm
- Git
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/lakshman807/DealerOS.git
```

Navigate into the project directory:

```bash
cd DealerOS
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment on Windows:

```bash
..\.venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Apply database migrations:

```bash
python manage.py migrate
```

Start the Django development server:

```bash
python manage.py runserver
```

Backend runs at:

```text
http://127.0.0.1:8000/
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Frontend runs at the local URL displayed by Vite, usually:

```text
http://localhost:5173/
```

### 4. Environment Configuration

For production deployment, configure the following environment variables.

**Backend – Render**

| Variable | Description |
|---|---|
| `DEBUG` | Production debug setting (`False`) |
| `DJANGO_SECRET_KEY` | Secure Django secret key |
| `ALLOWED_HOSTS` | Allowed backend domain |
| `DATABASE_URL` | PostgreSQL connection URL |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origin |

**Frontend – Netlify**

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://dealeros-cugb.onrender.com/api/` |

Never commit secret keys, database credentials, or other sensitive environment variables to GitHub.

## Application Workflow

1. Users log in using their organization credentials.
2. The backend authenticates users using JWT.
3. The backend identifies the user's organization.
4. Organization-level authorization ensures users can access only their permitted data.
5. The application retrieves the authorized organization's records.
6. System A and System B transactions are compared.
7. Matching and mismatching transactions are identified.
8. Reconciliation results are displayed on the dashboard.
9. Users can search, filter, analyze, and export reports.

## Multi-Tenant Data Isolation

One of the important features of DealerOS is organization-based data isolation.

The application supports multiple organizations within the same platform.

For example:

- ORG-A users can access ORG-A records.
- ORG-B users can access ORG-B records.
- ORG-A users cannot access ORG-B records.
- ORG-B users cannot access ORG-A records.

The backend validates organization access before returning reconciliation data.

This prevents unauthorized access to another organization's information.

## Deployment

DealerOS is deployed using cloud hosting services.

| Component | Platform |
|---|---|
| React Frontend | Netlify |
| Django Backend | Render |
| PostgreSQL Database | Render PostgreSQL |
| Source Code | GitHub |

### Live Deployment Links

**Frontend:**

https://dealerosj.netlify.app/

**Backend:**

https://dealeros-cugb.onrender.com/

**Source Code:**

https://github.com/lakshman807/DealerOS

## Future Enhancements

- Automated scheduled reconciliation.
- Email notifications for mismatched transactions.
- Advanced financial analytics.
- Real-time reconciliation status updates.
- Role-based access control.
- Advanced report customization.
- Bulk transaction uploads.
- Improved reconciliation performance.

## Author

**Lakshman Kumar Jakkamsetti**

- **GitHub:** https://github.com/lakshman807
- **LinkedIn:** https://www.linkedin.com/in/lakshman-kumar-jakkamsetti-038435367

---

⭐ If you find this project interesting, consider giving the repository a star!
