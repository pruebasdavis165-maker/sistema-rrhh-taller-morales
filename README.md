# Sistema de Gestión de Recursos Humanos — Taller de Torno Morales López

> **Plataforma Web Integral** para la gestión de contratos laborales, control de vacaciones remuneradas, expedientes digitales y analítica de personal para el taller de torno y mecanizado industrial **Morales López** (Managua, Nicaragua).

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Cumplimiento Legal (Ley No. 185 - Nicaragua)](#-cumplimiento-legal-ley-no-185---nicaragua)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Requisitos Previos](#-requisitos-previos)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Instrucciones de Despliegue](#-instrucciones-de-despliegue)
   - [Opción A: Despliegue con Docker y Docker Compose (Recomendado)](#opción-a-despliegue-con-docker-y-docker-compose-recomendado)
   - [Opción B: Ejecución Tradicional para Desarrollo Local](#opción-b-ejecución-tradicional-para-desarrollo-local)
8. [Credenciales Preconfiguradas (Seed)](#-credenciales-preconfiguradas-seed)
9. [Seguridad y 2FA (TOTP)](#-seguridad-y-2fa-totp)
10. [Pruebas Automatizadas](#-pruebas-automatizadas)
    - [Pruebas Unitarias del Backend (.NET 9)](#pruebas-unitarias-del-backend-net-9)
    - [Pruebas End-to-End del Frontend (Playwright)](#pruebas-end-to-end-del-frontend-playwright)

---

## 🚀 Características Principales

- **Gestión Contractual Anti-solapamiento (RF-0005):** Validación matemática en dominio y base de datos que imposibilita la concurrencia o solapamiento temporal de contratos vigentes para un mismo operario.
- **Control y Cómputo de Vacaciones (RF-0004):** Cálculo exacto de descansos devengados conforme a ley (2.5 días por mes / 30 días anuales) con verificación en tiempo real del saldo disponible antes de aprobar cualquier solicitud.
- **Analítica Ejecutiva y Métricas Operativas (Fase 2):** Gráficos interactivos en Recharts que exponen la distribución de personal por especialidad mecánica, costo y evolución mensual de planilla en Córdobas (NIO) y métricas de ausentismo.
- **Sistema de Alertas Preventivas:** Detección anticipada de contratos próximos a expirar (≤ 30 días) y monitoreo crítico de cumplimiento del período de prueba.
- **Seguridad Endurecida para Producción (Fase 3):**
  - **Rate Limiting nativo:** Protección contra ataques de fuerza bruta mediante ventana deslizante (*sliding window*) de 5 intentos cada 15 min en autenticación.
  - **Autenticación 2FA con TOTP (RFC 6238):** Obligatoria para roles `Administrador` y `RRHH`, compatible con Google Authenticator, Authy y Microsoft Authenticator.
  - **Cookies HTTP-Only & SameSite=Strict:** Almacenamiento seguro del token JWT sin exposición en `localStorage`, mitigando riesgos de Cross-Site Scripting (XSS).
- **Trazabilidad y Auditoría Permanente (RF-0006):** Bitácora digital que registra todas las operaciones sensibles (creación, edición, aprobación, rechazo con motivo) vinculadas al expediente de cada trabajador.

---

## 🛠 Arquitectura y Stack Tecnológico

### Backend (.NET 9)
- **Arquitectura Hexagonal (Ports & Adapters) / Clean Architecture:**
  - `TornoMorales.Domain`: Entidades ricas, reglas invariantes de negocio, servicios de dominio puros y excepciones tipadas.
  - `TornoMorales.Application`: Casos de uso, DTOs, interfaces de puertos de entrada/salida y servicios orquestadores.
  - `TornoMorales.Infrastructure`: Persistencia con Entity Framework Core 9, repositorios PostgreSQL y migraciones.
  - `TornoMorales.Api`: Controladores REST, autenticación JWT, Rate Limiter, manejo global de errores y Swagger UI.
- **Base de Datos:** PostgreSQL 16 (PostgreSQL-only).
- **Librerías Clave:** `Npgsql.EntityFrameworkCore.PostgreSQL`, `Otp.NET`, `Microsoft.AspNetCore.Authentication.JwtBearer`.

### Frontend (Next.js 16 + React 19)
- **Framework:** Next.js 16 (App Router + Turbopack).
- **Estilos:** Tailwind CSS 4 con diseño corporativo industrial (*UI/UX Pro Max*).
- **Visualización de Datos:** Recharts para gráficos de área, barras y rosca (*PieChart*).
- **Iconografía:** Lucide React.
- **Modo Docker:** Standalone output optimizado para contenedores mínimos.

---

## ⚖ Cumplimiento Legal (Ley No. 185 - Nicaragua)

El sistema codifica directamente los preceptos del **Código del Trabajo de la República de Nicaragua**:
- **Art. 28 (Período de Prueba):** Validación estricta que prohíbe contratos de período de prueba con duración superior a **30 días calendarios**.
- **Art. 45 (Indemnización por Antigüedad):** Cálculo legal de indemnización por años continuos de servicio (1 mes de salario por cada uno de los primeros 3 años; 20 días por año a partir del cuarto año, con tope de 5 meses).
- **Art. 48 (Preaviso Obligatorio):** Notificación previa de 15 días para trabajadores con menos de 3 años de servicio, o 30 días para 3 años o más.
- **Continuidad Contractual:** La transición entre contratos temporales y tiempo indeterminado reconoce la antigüedad total acumulada para el cálculo de vacaciones y beneficios laborales.

---

## 📂 Estructura del Proyecto

```text
torno-morales-rrhh/
├── .env.example                 # Plantilla de variables de entorno para Docker
├── docker-compose.yml           # Orquestación de PostgreSQL, Backend y Frontend
├── README.md                    # Documentación técnica completa
├── backend/
│   ├── Dockerfile               # Build multi-etapa .NET 9
│   ├── TornoMorales.sln         # Solución completa de .NET
│   ├── src/
│   │   ├── TornoMorales.Domain/          # Entidades y servicios puros de Ley 185
│   │   ├── TornoMorales.Application/     # Casos de uso, DTOs y lógica TOTP
│   │   ├── TornoMorales.Infrastructure/  # EF Core, PostgreSQL y migraciones
│   │   └── TornoMorales.Api/             # Controladores, JWT, Rate Limiting
│   └── tests/
│       ├── TornoMorales.Domain.Tests/    # 26 pruebas unitarias de dominio
│       └── TornoMorales.Application.Tests/ # 15 pruebas de aplicación (TOTP, Contratos, etc.)
└── frontend/
    ├── Dockerfile               # Build multi-etapa Next.js 16 (standalone)
    ├── playwright.config.ts     # Configuración de pruebas E2E
    ├── package.json
    ├── src/
    │   ├── app/                 # Rutas del App Router (/login, /contratos, /vacaciones, etc.)
    │   ├── components/          # Modales, widgets, Header, StatusBadge
    │   ├── context/             # AuthContext con gestión de cookies y 2FA
    │   ├── lib/                 # Cliente HTTP fetch con credentials: 'include'
    │   └── types/               # Tipos TypeScript compartidos
    └── tests/
        └── e2e/                 # Pruebas automatizadas Playwright
```

---

## ⚙ Requisitos Previos

- **Para despliegue con Docker:**
  - Docker Desktop 4.x o Docker Engine 24+ con soporte para Docker Compose v2.
- **Para desarrollo local sin Docker:**
  - [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
  - [Node.js 20 LTS o 22 LTS](https://nodejs.org/) y `npm`
  - [PostgreSQL 15+](https://www.postgresql.org/) corriendo localmente
  - Herramienta global de migraciones: `dotnet tool install --global dotnet-ef`

---

## 🔐 Variables de Entorno

Copia el archivo `.env.example` en la raíz del proyecto para crear tu archivo `.env`:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor por Defecto / Ejemplo |
|---|---|---|
| `POSTGRES_DB` | Nombre de la base de datos PostgreSQL | `tornomorales_rrhh` |
| `POSTGRES_USER` | Usuario administrador de PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `TornoMorales2026SecurePass!` |
| `POSTGRES_PORT` | Puerto expuesto del host para PostgreSQL | `5432` |
| `JWT_SECRET_KEY` | Clave simétrica de firma JWT (mín. 32 caracteres) | `TornoMorales_SecretKey_RRHH_Nicaragua_2026_AdvancedEnterpriseSecurityKey!` |
| `BACKEND_PORT` | Puerto expuesto del host para el backend .NET | `5076` |
| `FRONTEND_PORT` | Puerto expuesto del host para Next.js | `3000` |
| `NEXT_PUBLIC_API_URL` | URL accesible de la API REST para el cliente | `http://localhost:5076/api` |

---

## 🚢 Instrucciones de Despliegue

### Opción A: Despliegue con Docker y Docker Compose (Recomendado)

Esta opción levanta automáticamente la base de datos PostgreSQL 16, aplica las migraciones y datos semilla, y levanta el backend y frontend en contenedores aislados.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/pruebasdavis165-maker/sistema-rrhh-taller-morales.git
   cd sistema-rrhh-taller-morales
   ```

2. **Preparar el entorno:**
   ```bash
   cp .env.example .env
   ```

3. **Construir y levantar todos los servicios:**
   ```bash
   docker compose up --build -d
   ```

4. **Verificar el estado de los contenedores:**
   ```bash
   docker compose ps
   ```

5. **Acceder a las aplicaciones:**
   - **Frontend Web:** [http://localhost:3000](http://localhost:3000)
   - **Swagger / API REST:** [http://localhost:5076](http://localhost:5076)
   - **Base de Datos PostgreSQL:** `localhost:5432` (Base de datos: `tornomorales_rrhh`)

6. **Detener los servicios:**
   ```bash
   docker compose down
   # Para eliminar también los volúmenes de datos:
   docker compose down -v
   ```

---

### Opción B: Ejecución Tradicional para Desarrollo Local

#### 1. Configurar y Levantar la Base de Datos PostgreSQL
Asegúrate de que PostgreSQL esté corriendo en el puerto `5432` y crea la base de datos:
```sql
CREATE DATABASE tornomorales_rrhh;
```

Asegúrate de configurar la cadena de conexión en `backend/src/TornoMorales.Api/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=tornomorales_rrhh;Username=postgres;Password=TU_PASSWORD"
  }
}
```

#### 2. Levantar el Backend (.NET 9)
```bash
cd backend

# Restaurar paquetes NuGet
dotnet restore

# Aplicar migraciones a la base de datos
dotnet ef database update --project src/TornoMorales.Infrastructure --startup-project src/TornoMorales.Api

# Ejecutar el servidor API
cd src/TornoMorales.Api
dotnet run
```
*El backend quedará escuchando en `http://localhost:5076` y aplicará el seed inicial automáticamente.*

#### 3. Levantar el Frontend (Next.js 16)
En una nueva terminal:
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con Turbopack
npm run dev
```
*El frontend estará disponible en [http://localhost:3000](http://localhost:3000).*

---

## 👤 Credenciales Preconfiguradas (Seed)

El sistema incluye cuentas de prueba generadas en el seeder inicial (`DbInitializer.cs`):

| Rol | Usuario | Contraseña | Política 2FA |
|---|---|---|---|
| **Administrador** | `admin` | `Admin123*` | Obligatorio (TOTP) |
| **RRHH** | `dayerling.rrhh` | `Rrhh123*` | Obligatorio (TOTP) |
| **Supervisor de Taller** | `supervisor.taller` | `Taller123*` | Opcional |

> **Nota:** La pantalla de inicio de sesión (`/login`) incluye botones de acceso rápido para cargar estas credenciales con un solo clic durante pruebas y demostraciones.

---

## 🔑 Seguridad y 2FA (TOTP)

1. **Inicio de Sesión:** Al ingresar credenciales válidas para una cuenta con rol `Administrador` o `RRHH`, el backend detecta el requisito de doble factor y solicita el código de seguridad dinámico de 6 dígitos.
2. **Aplicaciones Compatibles:** Compatible con cualquier aplicación de autenticación estándar RFC 6238 (Google Authenticator, Microsoft Authenticator, 2FAS, Authy).
3. **Protección contra Fuerza Bruta:** Tras 5 intentos fallidos consecutivos desde una misma dirección IP dentro de un intervalo de 15 minutos, el endpoint responderá automáticamente `429 Too Many Requests`.

---

## 🧪 Pruebas Automatizadas

### Pruebas Unitarias del Backend (.NET 9)
El backend cuenta con **41 pruebas unitarias** que validan la lógica de la Ley No. 185, no solapamiento, topes de liquidación y algoritmos criptográficos TOTP:

```bash
cd backend
dotnet test
```

**Resumen de ejecución:**
- `TornoMorales.Domain.Tests`: 26/26 pasadas (Preaviso Art. 48, Indemnización Art. 45, Límite 30 días de prueba).
- `TornoMorales.Application.Tests`: 15/15 pasadas (Servicios de contratos, vacaciones y validación RFC 6238 de TOTP).

### Pruebas End-to-End del Frontend (Playwright)
Para ejecutar la suite de pruebas E2E en navegadores reales (Chromium, Firefox y Mobile):

```bash
cd frontend

# Instalar navegadores de Playwright (solo la primera vez)
npx playwright install --with-deps

# Ejecutar pruebas E2E (requiere que el frontend esté corriendo o configurado en baseURL)
npm run test:e2e
```

---

## 📄 Licencia

Desarrollado para el **Taller de Torno Morales López** — Managua, Nicaragua. Todos los derechos reservados © 2026.
