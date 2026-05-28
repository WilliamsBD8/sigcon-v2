# Manual de desarrollador — SIGCON

Guía técnica para instalar, extender y mantener el sistema SIGCON (backend Spring Boot + frontend React).

---

## Tabla de contenidos

1. [Visión técnica](#1-visión-técnica)
2. [Entorno de desarrollo](#2-entorno-de-desarrollo)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Backend — arquitectura](#4-backend--arquitectura)
5. [Backend — capas y convenciones](#5-backend--capas-y-convenciones)
6. [Backend — seguridad y permisos](#6-backend--seguridad-y-permisos)
7. [Backend — base de datos](#7-backend--base-de-datos)
8. [Backend — API REST](#8-backend--api-rest)
9. [Dominios principales](#9-dominios-principales)
10. [Frontend — arquitectura](#10-frontend--arquitectura)
11. [Frontend — menú y rutas](#11-frontend--menú-y-rutas)
12. [Frontend — consumo del API](#12-frontend--consumo-del-api)
13. [Agregar un nuevo módulo](#13-agregar-un-nuevo-módulo)
14. [Asistente IA](#14-asistente-ia)
15. [Tests y calidad](#15-tests-y-calidad)
16. [Despliegue](#16-despliegue)
17. [Solución de problemas](#17-solución-de-problemas)
18. [Referencias](#18-referencias)

---

## 1. Visión técnica

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | React 18, Vite, Redux | UI, rutas, estado de sesión |
| API | Spring Boot 3.5, Java 17 | Reglas de negocio, persistencia, seguridad |
| Datos | PostgreSQL 14+ | Almacenamiento relacional |
| Auth | JWT (stateless) | Autenticación y autorización por permisos |

Principio arquitectónico: **hexagonal (Ports & Adapters)** en backend — la lógica de negocio vive en `domain`, los DTOs en `application`, los adaptadores HTTP en `interfaces` (controllers).

---

## 2. Entorno de desarrollo

### 2.1 Herramientas

- JDK 17
- Maven (incluido `mvnw` en `backend/`)
- Node.js 18+ y npm (para `Frontend/`)
- Docker Desktop (opcional, recomendado para PostgreSQL)
- IDE: IntelliJ IDEA / VS Code + extensiones Java y ESLint

### 2.2 Clonar y levantar

```bash
git clone <URL_REPOSITORIO>
cd dev
```

**Con Docker (raíz):**

```bash
docker compose -f docker-compose.local.yml --env-file backend/.env up --build -d
```

**Backend local:**

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE = "dev"
.\mvnw.cmd spring-boot:run
```

**Frontend local:**

```bash
cd Frontend
npm install
npm run dev
```

### 2.3 Usuario de prueba (solo desarrollo)

Tras el primer arranque, `DataInitializer` puede crear:

| Campo | Valor (entorno dev) |
|-------|---------------------|
| Email | `superadmin@gmail.com` |
| Contraseña | `123456` |
| Rol | `SUPERADMIN` |

No use estas credenciales en producción.

### 2.4 URLs locales

| Servicio | URL |
|----------|-----|
| API | http://localhost:8080 |
| Swagger (perfil `dev`) | http://localhost:8080/swagger-ui.html |
| Frontend | http://localhost:5173 |
| Adminer | http://localhost:8081 |

---

## 3. Estructura del repositorio

```
dev/
├── backend/
│   ├── src/main/java/com/sigcon/backend/
│   │   ├── {dominio}/          # Un paquete por bounded context
│   │   │   ├── application/      # DTOs, requests
│   │   │   ├── domain/
│   │   │   │   ├── model/
│   │   │   │   ├── repository/
│   │   │   │   └── service/
│   │   │   └── interfaces/     # @RestController
│   │   ├── general/            # Security, config, OpenAPI
│   │   └── utils/              # UserUtil, DataTable, respuestas JSON
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-dev.properties
│   │   ├── db/seeds/           # Datos iniciales SQL
│   │   └── db/migration/       # Migraciones Flyway/manual
│   ├── pom.xml
│   └── docker-compose.yml
├── Frontend/
│   ├── src/
│   │   ├── pages/              # Pantallas por módulo
│   │   ├── components/         # atoms, molecules, organism, templates
│   │   ├── utils/              # fetch, map_menu, functions
│   │   └── routes/
│   └── vite.config.js
├── docs/
│   ├── MANUAL_USUARIO.md
│   └── MANUAL_DESARROLLADOR.md
└── README.md
```

---

## 4. Backend — arquitectura

```
  HTTP Request
       │
       ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Controller   │────►│ Domain Service  │────►│ Repository (JPA) │
│ (interfaces) │     │ (domain/service)│     │                  │
└──────────────┘     └────────┬────────┘     └──────────────────┘
                              │
                              ▼
                     Otros servicios / utils
                     (UserUtil, DiaryBookService, …)
```

- **No** poner lógica de negocio en controllers.
- **Sí** usar `@Transactional` en servicios que modifican varias entidades.
- DTOs de entrada/salida en `application`, no exponer entidades JPA directamente en la API.

---

## 5. Backend — capas y convenciones

### 5.1 Entidades JPA

- Ubicación: `domain/model/`
- Soft delete: `@SQLDelete` + `@Where(clause = "deleted_at IS NULL")`
- Auditoría: `createdAt`, `updatedAt`, `deletedAt` con `@PrePersist` / `@PreUpdate`

### 5.2 Repositorios

- Extienden `JpaRepository` y, si hay filtros dinámicos, `JpaSpecificationExecutor`
- Consultas complejas: `@Query` JPQL en la interfaz

### 5.3 Servicios de dominio

- `@Service` + `@RequiredArgsConstructor` (Lombok)
- Inyección de repositorios y otros servicios
- Usuario actual: `UserUtil.getUser()` → entidad `User` con `Company`

### 5.4 DTOs y respuestas

Respuesta estándar exitosa:

```java
SuccessRespondJson.getSuccessRespondMessage(
    Optional.of("Mensaje"),
    Optional.of(datos)
);
```

Error:

```java
ErrorRespondJson.getErrorRespondMessage(Optional.of("Descripción del error"));
```

### 5.5 DataTables (listados paginados)

- Request: `DataTableRequest` (start, length, draw, columns, search)
- Response: `DataTableResponse.from(page.map(this::toDto), draw)`
- Filtros: `DataTableSpecificationBuilder<T>`

Ejemplo en `VoucherService.getVouchers`.

---

## 6. Backend — seguridad y permisos

### 6.1 Flujo JWT

1. `POST /auth/login` → token + objeto `user` (incluye permisos).
2. Cliente envía `Authorization: Bearer <token>` en cada petición.
3. `SecurityFilterChain` valida JWT; `BlackListFilter` rechaza tokens revocados.

Configuración: `general/security/SecurityConfig.java`, `JwtService.java`.

### 6.2 Permisos en endpoints

```java
@PreAuthorize("hasAuthority('PERM_CREATE_VOUCHER') or hasAuthority('ROLE_SUPERADMIN')")
```

- En base de datos el código del permiso es `CREATE_VOUCHER` (sin prefijo).
- Spring expone la authority como `PERM_CREATE_VOUCHER` (ver `User.getAuthorities()`).

### 6.3 Alcance por empresa

La mayoría de servicios filtran por `user.getCompany()`:

```java
User user = userUtil.getUser();
Company company = user.getCompany();
```

`DashboardService` distingue `SUPERADMIN` (alcance global) vs usuario de empresa.

---

## 7. Backend — base de datos

### 7.1 Motor y configuración

- PostgreSQL
- Variables en `backend/.env` → `application.properties`
- Hibernate: `spring.jpa.hibernate.ddl-auto=update` (desarrollo)

### 7.2 Seeds y migraciones

| Ruta | Uso |
|------|-----|
| `db/seeds/*.sql` | Datos maestros (menús, permisos, tipos de comprobante, PUC base) |
| `db/indexes/*.sql` | Índices |
| `db/migration/V*.sql` | Cambios incrementales (permisos, columnas) |

`DataInitializer` ejecuta scripts al arranque en entornos configurados.

### 7.3 Entidades transversales

- **Periodos contables:** `books` → `GeneralLedger`, `DiaryBook`, `AccountingPeriod`
- **Asientos:** `accounting_entry` → `AccountingEntry`, `AccountingEntryLine`
- **Comprobantes:** `vouchers` → `VouchersEntity`, `VoucherTypesEntity`

---

## 8. Backend — API REST

### 8.1 Prefijo y versionado

Base: `/api/v1/{recurso}`

Ejemplos:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/vouchers/search` | Listado DataTable |
| POST | `/api/v1/vouchers/create` | Crear comprobante |
| GET | `/api/v1/vouchers/{id}` | Detalle |
| GET | `/api/v1/vouchers/types` | Tipos de comprobante |
| POST | `/api/v1/vouchers/accounting-accounts/filter` | Cuentas filtradas por tipo |
| POST | `/api/v1/accounting-accounts` | Listado cuentas contables |
| GET | `/api/v1/dashboard/overview` | KPIs dashboard |
| POST | `/api/v1/assistant/chat` | Asistente IA |

Documentación interactiva: **Swagger UI** (perfil `dev`).

### 8.2 Cuerpo de comprobante (`Transaction`)

Paquete: `invoices.application.requests.dataInvoices.Transaction`

Campos relevantes:

- `valuePayment`, `paymentFormId`, `methodPaymentId`
- `bankAccount`, `cashAccount`, `check`
- `invoiceId`, `voucherTypeId`
- `lines` → lista de `AccountingEntryLineRequest` (cuentas manuales)

---

## 9. Dominios principales

| Paquete | Responsabilidad |
|---------|-----------------|
| `parametrization` | Usuarios, roles, permisos, empresas, menús |
| `lists_accounting` | PUC, cuentas contables, centros de costo, impuestos |
| `invoices` | FC, OC, líneas, estados |
| `vouchers` | Comprobantes, tipos, filtro de cuentas, asientos |
| `accounting_entry` | Creación de asientos y líneas |
| `books` | Libro diario, periodos |
| `banks` | Bancos, cuentas, cheques, conciliación, movimientos |
| `assets` | Activos, depreciación, NIIF |
| `third_parties` | Terceros y segmentación |
| `dashboard` | Indicadores agregados |
| `assistant` | Integración OpenAI con contexto de sesión |
| `products` | Catálogo de productos |

### 9.1 Comprobantes — lógica contable

`VoucherService.createAccountingEntry`:

- Con **factura FC** + tipo `PAYMENT`: asiento automático (proveedores vs banco/caja).
- Con **factura OC** + tipo `RECEIPT`: asiento automático (banco/caja vs cartera).
- Sin factura o tipos `PAYROLL`, `SERVICE_*`: usa `request.getLines()` validadas por `VoucherAccountingAccountFilterService`.

Filtro de cuentas: `VoucherAccountingAccountFilterService` — reglas por `voucherTypeCode` + `DEBIT`/`CREDIT` y prefijos PUC.

### 9.2 Resolución de tipo de comprobante

`VoucherService.resolveVoucherTypeId`:

1. `request.voucherTypeId` si viene informado.
2. Si hay `invoiceId`: FC → `PAYMENT`, OC → `RECEIPT`.
3. Si no, error: debe seleccionar tipo.

---

## 10. Frontend — arquitectura

```
src/
├── components/
│   ├── templates/     # MainTemplate, AuthTemplate
│   ├── organism/      # DataTable, MenuNav, AssistantChat
│   └── molecules/     # Inputs, AlertPage
├── pages/             # Una carpeta por módulo de negocio
├── utils/
│   ├── fetch.jsx      # fetchHelper + JWT
│   ├── map_menu.jsx   # COMPONENT_MAP + getMenu()
│   └── functions.jsx  # base_url, formatPrice, formatDate
└── routes/routes.jsx  # Rutas dinámicas según menú API
```

Estado global Redux:

- `user`: usuario y token
- `modules`: árbol de menú desde API

---

## 11. Frontend — menú y rutas

### 11.1 Menú dinámico

1. `getMenu()` llama `GET /api/modules/menu`.
2. Construye árbol con `buildMenuTree`.
3. `routes.jsx` genera `<Route>` por cada ítem con `componentName`.

### 11.2 Registrar un componente

En `utils/map_menu.jsx`:

```javascript
import MiPantalla from "../pages/mi-modulo/index";

// Dentro de COMPONENT_MAP:
{ id: "MI_COMPONENTE", name: "Mi pantalla", component: MiPantalla },
```

El `component` en BD (tabla `menus`) debe coincidir con `id` en `COMPONENT_MAP`.

### 11.3 Rutas anidadas

`renderMenuRoutesFlat` concatena `parentPath` + `menu.path` para URLs como `/cash-and-banks/bank-accounts`.

---

## 12. Frontend — consumo del API

### 12.1 fetchHelper

```javascript
import { fetchHelper } from '@/utils/fetch';
import { base_url } from '@/utils/functions';

// GET con token
await fetchHelper.get(base_url(['api', 'v1', 'vouchers', id]), {}, 0, false);

// POST
await fetchHelper.post(base_url(['api', 'v1', 'vouchers', 'create']), payload, {}, 0, false);
```

- `time = 0` desactiva overlay Swal de carga.
- `showErrorAlert = false` evita alerta automática (manejo manual).
- Token: `localStorage.getItem('token')` automático.

### 12.2 DataTable con servidor

```javascript
<DataTableReference
  url_api={['api', 'v1', 'vouchers', 'search']}
  columns={columns}
  tableRef={tableRef}
  dataTableRef={dataTableRef}
  buttons={buttons}
/>
```

### 12.3 Permisos en UI

```javascript
const userPermissions = user.permissions?.filter(p => p.code.includes('VOUCHER')) || [];
const canCreate = userPermissions.includes('CREATE_VOUCHER') || user.isAdmin;
```

Los códigos en el objeto `user` del login **no** llevan prefijo `PERM_`.

---

## 13. Agregar un nuevo módulo

### Checklist backend

1. Crear paquete `com.sigcon.backend.{modulo}` con `model`, `repository`, `service`, `interfaces`.
2. Definir entidad JPA y repositorio.
3. Implementar servicio con reglas y `UserUtil` para empresa.
4. Exponer controller bajo `/api/v1/{recurso}`.
5. Anotar con `@PreAuthorize` y permisos nuevos.
6. Insertar permisos y menú en `db/seeds` o migración SQL.
7. Documentar en Swagger con `@Operation`.

### Checklist frontend

1. Crear `pages/{modulo}/index.jsx` (y formularios si aplica).
2. Registrar en `COMPONENT_MAP`.
3. Insertar menú en BD con `component` igual al `id` del mapa.
4. Asignar permisos al rol vía UI de parametrización o seed.
5. Probar flujo completo con usuario sin SUPERADMIN.

---

## 14. Asistente IA

| Archivo / ruta | Rol |
|----------------|-----|
| `assistant/config/AssistantProperties` | `OPENAI_API_KEY`, modelo, URL |
| `assistant/domain/service/AssistantContextService` | Prompt + KPIs sesión |
| `assistant/domain/client/OpenAiChatClient` | Llamada HTTP OpenAI |
| `assistant/interfaces/AssistantController` | `/api/v1/assistant/*` |
| `Frontend/.../AssistantChat.jsx` | Widget flotante |

Variables (`application.properties`):

```properties
app.assistant.api-key=${OPENAI_API_KEY:}
app.assistant.model=${OPENAI_MODEL:gpt-4o-mini}
```

---

## 15. Tests y calidad

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd -Dspring.profiles.active=dev test
```

Frontend:

```bash
cd Frontend
npm run lint
npm run build   # verifica compilación
```

Recomendaciones:

- Probar endpoints críticos en Swagger antes del PR.
- Validar permisos con usuario no administrador.
- Verificar que asientos cuadren (débito = crédito) en comprobantes manuales.

---

## 16. Despliegue

### Backend

```powershell
.\mvnw.cmd -DskipTests clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

O imagen Docker (`backend/Dockerfile`).

### Frontend

```bash
npm run build
```

Artefacto en `dist/`. Servir con Nginx (`Frontend/docker-compose` modo producción).

Variables importantes producción:

- `SPRING_PROFILES_ACTIVE` sin exposición de Swagger
- `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`
- Secretos JWT y BD fuera del repositorio

---

## 17. Solución de problemas

| Síntoma | Verificación |
|---------|----------------|
| 401 en todas las peticiones | Token expirado, header Authorization, blacklist |
| 403 en un módulo | Permiso faltante en rol; authority `PERM_{code}` |
| Menú vacío tras login | `GET /api/modules/menu`, permisos de menú, `COMPONENT_MAP` |
| Swagger no carga | Perfil `dev`, `SecurityConfig` permite `/swagger-ui/**` |
| CORS | `CORS_ALLOWED_ORIGINS` y configuración en `SecurityConfig` |
| Asiento no cuadra | `validateManualAccountingLines`, filtro de cuentas |
| Periodo cerrado | `AccountingPeriodStatus.CLOSED` en `DiaryBook` |

Logs backend (dev):

```properties
logging.level.com.sigcon.backend=DEBUG
```

---

## 18. Referencias

| Documento | Ubicación |
|---------|-----------|
| README general | [../README.md](../README.md) |
| Manual de usuario | [MANUAL_USUARIO.md](MANUAL_USUARIO.md) |
| Backend (instalación) | [../backend/readme.md](../backend/readme.md) |
| Frontend (Docker) | [../Frontend/README.md](../Frontend/README.md) |
| Swagger | http://localhost:8080/swagger-ui.html (dev) |

Repositorios históricos:

- https://github.com/WilliamsBD8/sigcon-backend
- https://github.com/WilliamsBD8/sigcon-frontend

---

*Documento mantenido por el equipo de desarrollo SIGCON — USCO 2026-1.*
