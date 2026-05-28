# SIGCON — Sistema de Gestión Contable y Financiera

SIGCON es una aplicación web para la gestión contable, financiera y operativa de empresas. Integra facturación, comprobantes, tesorería (bancos y caja), activos fijos, terceros, listas contables (PUC), reportes y un asistente con IA contextualizado por sesión.

Proyecto desarrollado en el marco del **Proyecto Integrador** (USCO, 2026-1), con arquitectura **hexagonal (Ports & Adapters)** en backend y frontend organizado por capas.

---

## Tabla de contenidos

- [Características principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos previos](#requisitos-previos)
- [Inicio rápido con Docker](#inicio-rápido-con-docker)
- [Desarrollo local](#desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Documentación de la API](#documentación-de-la-api)
- [Asistente con IA (opcional)](#asistente-con-ia-opcional)
- [Tests](#tests)
- [Repositorios relacionados](#repositorios-relacionados)
- [Documentación](#documentación)
- [Licencia](#licencia)

---

## Características principales

| Módulo | Descripción |
|--------|-------------|
| **Parametrización** | Usuarios, roles, permisos, empresas, menús y módulos |
| **Listas contables** | PUC, cuentas contables, centros de costo, reglas tributarias, tasas de cambio |
| **Facturación** | Facturas de compra (FC), órdenes de compra (OC), pagos vinculados |
| **Comprobantes** | Egresos/ingresos con asiento automático o manual según tipo |
| **Tesorería** | Bancos, cuentas, chequeras, cheques, caja, conciliación |
| **Activos fijos** | Registro, depreciación, bajas, kardex, alertas NIIF |
| **Contabilidad** | Libro diario, asientos, periodos contables |
| **Reportes** | Balance de comprobación, libro mayor, auxiliares, estados financieros |
| **Dashboard** | KPIs por empresa o vista global (superadmin) |
| **Asistente IA** | Chat con contexto de sesión (usuario, empresa, indicadores) |

---

## Arquitectura

```
┌─────────────────┐     JWT / REST      ┌──────────────────────────────┐
│  Frontend       │ ◄──────────────────► │  Backend (Spring Boot)       │
│  React + Vite   │                      │  Arquitectura hexagonal      │
│  Redux          │                      │  domain · application ·      │
└─────────────────┘                      │  interfaces (controllers)    │
                                         └──────────────┬───────────────┘
                                                        │
                                                        ▼
                                         ┌──────────────────────────────┐
                                         │  PostgreSQL                  │
                                         └──────────────────────────────┘
```

- **Backend**: paquetes por dominio (`vouchers`, `invoices`, `banks`, `assets`, etc.) con servicios de dominio, DTOs de aplicación y controladores REST.
- **Frontend**: páginas por módulo, componentes reutilizables, menú dinámico según permisos del usuario autenticado.
- **Seguridad**: autenticación stateless con JWT; autorización por permisos (`@PreAuthorize`).

---

## Stack tecnológico

### Backend (`backend/`)

- Java 17 · Spring Boot 3.5.x
- Spring Security + JWT · Spring Data JPA
- PostgreSQL · Springdoc OpenAPI (Swagger)
- Lombok · Docker

### Frontend (`Frontend/`)

- React 18 · Vite · React Router
- Redux · DataTables · Bootstrap (plantilla Sneat)
- TypeScript (módulos de facturación) · Docker / Nginx (producción)

---

## Estructura del repositorio

```
.
├── backend/                 # API REST (Spring Boot)
│   ├── src/main/java/com/sigcon/backend/
│   ├── src/main/resources/  # application.properties, seeds, migraciones
│   ├── docker-compose.yml
│   └── readme.md            # Documentación detallada del backend
├── Frontend/                # Cliente web (React)
│   ├── src/pages/           # Vistas por módulo
│   ├── src/components/      # Componentes UI
│   └── README.md            # Documentación del frontend
├── docker-compose.local.yml # Orquestación local (API + DB + frontend)
└── README.md                # Este archivo
```

---

## Requisitos previos

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) y Docker Compose
- *(Opcional)* Java 17 y Maven Wrapper (`backend/mvnw`) para ejecutar el API sin Docker
- *(Opcional)* Node.js 18+ para ejecutar el frontend sin Docker

---

## Inicio rápido con Docker

1. **Clonar el repositorio**

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd dev
```

2. **Configurar variables de entorno**

Configura el archivo de entorno del backend a partir de la plantilla en `backend/.env` (ajusta host, puertos y secretos; no subas credenciales reales al repositorio).

3. **Levantar servicios (desarrollo)**

Desde la raíz del proyecto, con el compose local:

```bash
docker compose -f docker-compose.local.yml --env-file backend/.env up --build -d
```

O solo el backend (ver `backend/readme.md`):

```bash
cd backend
docker compose up --build -d
```

4. **Acceder a la aplicación**

| Servicio | URL (por defecto) |
|----------|-------------------|
| API Backend | http://localhost:8080 |
| Swagger UI (perfil `dev`) | http://localhost:8080/swagger-ui.html |
| Adminer (DB) | http://localhost:8081 |
| Frontend (compose local) | http://localhost:5173 |

---

## Desarrollo local

### Backend

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE = "dev"
.\mvnw.cmd spring-boot:run
```

Más opciones y scripts: [`backend/readme.md`](backend/readme.md).

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Configura la URL del API en las variables de Vite (por ejemplo `VITE_API_URL` según tu `.env` del frontend).

Documentación adicional: [`Frontend/README.md`](Frontend/README.md).

---

## Variables de entorno

Principales variables del **backend** (`backend/.env`):

| Variable | Descripción |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | Perfil Spring (`dev`, `DEVELOPMENT`, etc.) |
| `backend_host` / `backend_port_db_dev` | Host y puerto de PostgreSQL |
| `backend_user` / `backend_password` / `backend_database` | Credenciales de BD |
| `backend_port_api` | Puerto del API (ej. `8080`) |
| `FRONTEND_URL` | URL del frontend (CORS / enlaces en correos) |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos para CORS |
| `SPRING_SECURITY_JWT_SECRET` | Secreto para firmar tokens JWT |
| `OPENAI_API_KEY` | *(Opcional)* Clave para el asistente IA |

> No subas archivos `.env` con secretos reales al repositorio. Usa `.gitignore` y plantillas sin credenciales.

---

## Documentación de la API

Con el perfil **`dev`** activo:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

La UI de Swagger está deshabilitada en producción por seguridad.

---

## Asistente con IA (opcional)

El módulo `assistant` expone endpoints autenticados que responden usando el contexto de la sesión (usuario, empresa, KPIs del dashboard).

Para habilitarlo, define en el backend:

```env
OPENAI_API_KEY=sk-tu-clave
OPENAI_MODEL=gpt-4o-mini
```

Sin clave configurada, el frontend muestra un aviso y el chat no llama al proveedor externo.

---

## Tests

```powershell
cd backend
.\mvnw.cmd test
```

Con perfil dev:

```powershell
.\mvnw.cmd -Dspring.profiles.active=dev test
```

---

## Documentación

| Documento | Audiencia | Enlace |
|-----------|-----------|--------|
| Manual de usuario | Contadores, tesoreros, operadores | [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) |
| Manual de desarrollador | Desarrolladores y administradores técnicos | [docs/MANUAL_DESARROLLADOR.md](docs/MANUAL_DESARROLLADOR.md) |
| Backend (instalación) | DevOps / backend | [backend/readme.md](backend/readme.md) |
| Frontend (Docker) | DevOps / frontend | [Frontend/README.md](Frontend/README.md) |

---

## Repositorios relacionados

Si el monorepo se publica separado en GitHub:

| Componente | Repositorio |
|------------|-------------|
| Backend | [WilliamsBD8/sigcon-backend](https://github.com/WilliamsBD8/sigcon-backend) |
| Frontend | [WilliamsBD8/sigcon-frontend](https://github.com/WilliamsBD8/sigcon-frontend) |

---

## Contribución

1. Crea una rama desde `main` o `develop`.
2. Realiza cambios acotados por módulo.
3. Ejecuta tests del backend antes del PR.
4. Describe en el PR qué módulo afecta (facturas, comprobantes, bancos, etc.).

---

## Licencia

Este proyecto es de uso académico e institucional. Consulta con el equipo docente o los mantenedores antes de redistribuir o usar en producción sin autorización.

---

## Equipo

Proyecto Integrador 4 — Ingeniería de Sistemas, USCO.

Para dudas técnicas del backend o del frontend, revisa primero `backend/readme.md` y `Frontend/README.md`.
