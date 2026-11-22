# DealerOS – Multi-Tenant Reconciliation Platform

DealerOS is a full-stack web application designed to reconcile financial transaction records from two different systems. It identifies matching transactions, mismatches, missing records, duplicate entries, and split transactions while maintaining organization-based data isolation.

## Features

- User authentication using JWT.
- Organization-based data access and isolation.
- Dashboard with reconciliation statistics.
- Transaction reconciliation between System A and System B.
- Automatic identification of matching and mismatching records.
- Detection of duplicate and missing transactions.
- Search and filter transactions.
- Date-based filtering.
- Interactive charts and analytics.
- CSV report export.
- PDF report generation.
- Logout functionality.

## Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router
- Recharts
- Lucide React
- jsPDF

### Backend
- Python
- Django
- Django REST Framework
- JWT Authentication

### Database
- SQLite

## Project Structure

```text
DealerOS/
│
├── backend/
│   ├── config/
│   ├── reconcile/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   └── index.html
│
├── README.md
└── .gitignore
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd dealeros
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Apply migrations:

```bash
python manage.py migrate
```

Start the backend server:

```bash
python manage.py runserver
```

Backend runs at:

`http://127.0.0.1:8000/`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at the local address displayed by Vite.

## Application Workflow

1. Users log in with their credentials.
2. The backend identifies the user's organization.
3. The application retrieves only the authorized organization's reconciliation records.
4. System A and System B transactions are compared.
5. Differences and reconciliation statuses are displayed.
6. Users can filter, analyze, and export reports.

## Security

- JWT-based authentication.
- Protected API endpoints.
- Organization-level authorization.
- Prevention of cross-organization data access.

## Future Enhancements

- PostgreSQL database integration.
- Automated scheduled reconciliation.
- Email notifications for mismatches.
- Advanced analytics and reporting.
- Cloud deployment.

## Author

**Lakshman Kumar Jakkamsetti**

GitHub:https://github.com/lakshman807
LinkedIn: www.linkedin.com/in/lakshman-kumar-jakkamsetti-038435367