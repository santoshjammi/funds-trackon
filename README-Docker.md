# Deploy with Docker

This repo includes Dockerfiles and docker-compose for a production-style setup.

## Services

- mongo: MongoDB 7, persisted volume `mongo_data`
- backend: FastAPI (Uvicorn) serving at :8000
- web: React static site served by nginx at :8080

## One-time build and run

```bash
# from repo root
docker compose build
docker compose up -d
```

Then open:

- Frontend: <http://localhost:8080>
- Backend API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>

## Volumes

- uploads: persisted at /app/uploads in backend container
- mongo_data: MongoDB data

## Environment

The backend reads environment variables (see `backend/app/utils/config.py`). docker-compose sets:

- mongodb_url=mongodb://mongo:27017
- database_name=trackon_lead_management
- environment=production
- debug=false
- write_compat_tnifmc_fields=true
- response_include_both_field_names=true

Adjust as needed in `docker-compose.yml`.

## Rebuild on code changes

```bash
docker compose build backend web
docker compose up -d
```

## Logs and troubleshooting

```bash
docker compose logs -f backend
# or
docker compose logs -f web
```

Common issues:

- CORS: Frontend served at :8080 is allowed by default. Update CORS in `Settings` if you change ports.
- Mongo connection: ensure `mongo` container is healthy; `docker compose ps`.
- Permissions: uploads volume is created automatically; ensure the Docker user can write.
