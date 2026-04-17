# README.md

```markdown
# Tsoft Greetings Web App (XP-10)

**CI/CD Pipeline:** [GitHub Actions - Passing] | **Node.js:** [>=18.0.0] | **License:** [MIT] | **Test Coverage:** [>80%]

Aplicación web que permite seleccionar un país mediante su bandera y obtener el saludo correspondiente en el idioma local.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Prerrequisitos](#prerrequisitos)
4. [Instalación y Configuración Local](#instalación-y-configuración-local)
5. [Variables de Entorno](#variables-de-entorno)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [Arquitectura y Capas del Backend](#arquitectura-y-capas-del-backend)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Seguridad](#seguridad)
10. [Testing](#testing)
11. [Despliegue en Heroku](#despliegue-en-heroku)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Contribución](#contribución)
14. [Licencia](#licencia)

---

## Descripción General

Tsoft Greetings Web App (XP-10) adopta una arquitectura **SPA (Single Page Application)** con separación clara entre un Frontend construido en React y un Backend construido en Express siguiendo el patrón **MVC en el servidor**. Toda la comunicación entre capas se realiza mediante **API REST con JSON**.

El patrón Repository abstrae el acceso a datos, y un Middleware Chain en Express gestiona la seguridad de cada petición entrante.

```
Flujo de datos:

+----------+       +-------------+       +--------------+       +----------------+
| Browser  | ----> | React SPA   | ----> | Express API  | ----> | MongoDB Atlas  |
| (Client) | <---- | (Frontend)  | <---- | (Backend)    | <---- | (Base de Datos)|
+----------+       +-------------+       +--------------+       +----------------+

HTTP/HTTPS         API REST / JSON        Mongoose ODM
```

---

## Stack Tecnológico

### Frontend
- React 18+
- React Router DOM
- Context API (manejo de estado global de idioma/país)
- DOMPurify (sanitización contra XSS en cliente)

### Backend
- Node.js
- Express
- Helmet.js (headers de seguridad HTTP: CSP, HSTS, X-Frame-Options)
- express-rate-limit (protección contra fuerza bruta)
- express-validator (validación y sanitización de inputs)
- express-mongo-sanitize (sanitización contra NoSQL Injection)
- xss-clean (sanitización contra XSS en servidor)
- Morgan (logging de requests)
- jsonwebtoken / JWT (autenticación del panel de administración)
- bcryptjs (hash de contraseñas)

### Base de Datos
- MongoDB Atlas (servicio gestionado en la nube)
- Mongoose ODM (esquemas estrictos, strict mode habilitado)

### DevOps
- GitHub Actions (pipeline CI/CD: lint, test, audit)
- Heroku (plataforma de despliegue)
- npm audit (auditoría de dependencias)

### Testing
- Jest (tests unitarios)
- Supertest (tests de integración)

---

## Prerrequisitos

Antes de comenzar, asegúrate de contar con lo siguiente instalado y configurado:

- **Node.js** versión mínima requerida: **18.0.0**
- **npm** versión mínima requerida: **9.0.0**
- Cuenta activa en **MongoDB Atlas** con un cluster disponible
- Cuenta en **Heroku** para el despliegue de la aplicación
- **Git** instalado en el sistema local
- Acceso al repositorio en **GitHub** con los permisos correspondientes

---

## Instalación y Configuración Local

Sigue los pasos en el orden indicado para levantar el entorno de desarrollo local correctamente.

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tsoft-org/xp-10-greetings-app.git
cd xp-10-greetings-app
```

### Paso 2: Instalar dependencias del backend

Ejecutar desde la **carpeta raíz** del proyecto:

```bash
npm install
```

### Paso 3: Instalar dependencias del frontend

Ejecutar desde la **carpeta client**:

```bash
cd client
npm install
cd ..
```

### Paso 4: Configurar variables de entorno

Copiar el archivo de ejemplo `.env.example` a `.env` tanto en la raíz como en la carpeta `client`:

```bash
# En la carpeta raíz (backend)
cp .env.example .env

# En la carpeta client (frontend)
cp client/.env.example client/.env
```

> **ADVERTENCIA: EL ARCHIVO `.env` NUNCA DEBE SUBIRSE AL REPOSITORIO. ESTE ARCHIVO YA ESTÁ INCLUIDO EN `.gitignore`. VERIFICA QUE `.gitignore` CONTENGA LA ENTRADA `.env` ANTES DE REALIZAR CUALQUIER COMMIT.**

### Paso 5: Configurar la conexión a MongoDB Atlas

Editar el archivo `.env` en la carpeta raíz y asignar la cadena de conexión de tu cluster de MongoDB Atlas a la variable `MONGODB_URI`:

```
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

Reemplaza `<usuario>`, `<password>`, `<cluster>` y `<dbname>` con los valores reales de tu cuenta de MongoDB Atlas.

### Paso 6: Ejecutar en modo desarrollo

Levantar backend y frontend de forma concurrente desde la carpeta raíz:

```bash
npm run dev
```

Este comando utiliza `concurrently` para iniciar el servidor Express y el servidor de desarrollo de React simultáneamente.

- Backend disponible en: `http://localhost:5000`
- Frontend disponible en: `http://localhost:3000`

---

## Variables de Entorno

### Backend (archivo `.env` en la raíz)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto donde corre el servidor Express |
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas |
| `JWT_SECRET` | Clave secreta para la firma de tokens JWT de acceso |
| `JWT_REFRESH_SECRET` | Clave secreta para la firma de refresh tokens |
| `JWT_EXPIRATION` | Tiempo de expiración del token de acceso (recomendado: `1h`) |
| `NODE_ENV` | Entorno de ejecución: `development`, `staging` o `production` |
| `CORS_ORIGIN` | URL del frontend permitida en la política CORS |
| `BCRYPT_ROUNDS` | Número de rondas para el hash de contraseñas con bcryptjs |

Ejemplo de estructura del archivo `.env` del backend (sin valores reales):

```
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRATION=
NODE_ENV=
CORS_ORIGIN=
BCRYPT_ROUNDS=
```

### Frontend (archivo `client/.env`)

| Variable | Descripción |
|---|---|
| `REACT_APP_API_URL` | URL base de la API del backend |

Ejemplo de estructura del archivo `client/.env` (sin valores reales):

```
REACT_APP_API_URL=
```

> **Nota de Seguridad:** Los valores de producción se gestionan exclusivamente como **Config Vars en Heroku** y nunca deben estar presentes en el código fuente ni en archivos versionados en el repositorio.

---

## Estructura del Proyecto

```
xp-10-greetings-app/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Pipeline de CI: lint, test, npm audit
│       └── deploy.yml              # Pipeline de CD: despliegue a Heroku
│
├── server/
│   ├── routes/
│   │   ├── greetings.routes.js     # Rutas públicas de saludos
│   │   └── admin.routes.js         # Rutas protegidas del panel de administración
│   │
│   ├── controllers/
│   │   ├── greetings.controller.js # Controladores de saludos
│   │   └── admin.controller.js     # Controladores de administración
│   │
│   ├── services/
│   │   ├── greetings.service.js    # Lógica de negocio de saludos
│   │   └── auth.service.js         # Lógica de autenticación JWT
│   │
│   ├── repositories/
│   │   ├── greetings.repository.js # Acceso a datos de saludos (MongoDB)
│   │   └── users.repository.js     # Acceso a datos de usuarios (MongoDB)
│   │
│   ├── models/
│   │   ├── Greeting.model.js       # Esquema Mongoose para colección greetings
│   │   └── User.model.js           # Esquema Mongoose para colección users
│   │
│   └── middlewares/
│       ├── auth.middleware.js       # Verificación de JWT
│       ├── validate.middleware.js   # Validación con express-validator
│       └── errorHandler.middleware.js # Manejo centralizado de errores
│
├── client/
│   ├── public/
│   │   └── index.html
│   │
│   └── src/
│       ├── components/
│       │   ├── FlagSelector/       # Componente interactivo de selección de banderas
│       │   ├── GreetingCard/       # Componente de visualización del saludo
│       │   └── ErrorBoundary/      # Error Boundary de React
│       │
│       ├── context/
│       │   └── AppContext.js       # Context API para estado global de idioma/país
│       │
│       ├── hooks/
│       │   └── useGreeting.js      # Hook personalizado para fetch de saludos
│       │
│       ├── pages/
│       │   ├── Home.jsx            # Página principal de selección de país
│       │   └── Admin.jsx           # Panel de administración (protegido)
│       │
│       ├── utils/
│       │   └── sanitize.js         # Utilidades de sanitización con DOMPurify
│       │
│       ├── App.jsx                 # Componente raíz con React Router DOM
│       └── index.js                # Punto de entrada de React
│
├── tests/
│   ├── unit/
│   │   ├── greetings.service.test.js
│   │   └── auth.service.test.js
│   │
│   └── integration/
│       ├── greetings.api.test.js
│       └── admin.api.test.js
│
├── .env.example                    # Plantilla de variables de entorno del backend
├── .gitignore                      # Archivos excluidos del repositorio (incluye .env)
├── package.json                    # Dependencias y scripts del backend
├── Procfile                        # Configuración de proceso para Heroku
├── server.js                       # Punto de entrada del servidor Express
└── README.md                       # Este archivo
```

---

## Arquitectura y Capas del Backend

El flujo de una request entrante sigue el siguiente recorrido por capas:

1. **Routes:** La petición HTTP llega al router de Express correspondiente (`greetings.routes.js` o `admin.routes.js`), que define el método y la ruta.

2. **Middleware Chain de Seguridad:** Antes de llegar al controlador, la petición atraviesa la cadena de middlewares de seguridad en el siguiente orden:
   - **Helmet.js** aplica headers de seguridad HTTP (Content-Security-Policy, HSTS, X-Frame-Options).
   - **express-rate-limit** verifica que el cliente no haya superado el límite de peticiones permitidas.
   - **CORS** valida que el origen de la petición coincida con el dominio del frontend configurado en `CORS_ORIGIN`.
   - **express-mongo-sanitize** y **xss-clean** sanitizan el body, query y params de la petición.
   - **express-validator** valida y sanitiza los inputs según las reglas definidas para cada endpoint.
   - **auth.middleware** verifica el token JWT en los endpoints protegidos.

3. **Controller:** Una vez superada la cadena de middlewares, el controlador recibe la petición validada, extrae los datos necesarios y delega la lógica de negocio al Service correspondiente.

4. **Service:** Contiene la lógica de negocio de la aplicación. Procesa los datos, aplica reglas de negocio y llama al Repository para las operaciones de persistencia.

5. **Repository:** Abstrae el acceso a la base de datos. Utiliza los modelos de Mongoose para ejecutar las operaciones CRUD sobre MongoDB Atlas.

6. **Mongoose / MongoDB Atlas:** El ODM Mongoose ejecuta las consultas con **strict mode habilitado**, lo que previene la inyección de campos no definidos en el esquema y protege contra ataques de NoSQL Injection.

La respuesta recorre el camino inverso: Repository -> Service -> Controller -> Response al cliente.

---

## Endpoints de la API

### Endpoints Públicos

#### GET /api/health
- **Descripción:** Verificación del estado del servidor. Utilizado por Heroku y sistemas de monitoreo para health checks.
- **Autenticación JWT:** No requerida.
- **Parámetros:** Ninguno.
- **Respuesta exitosa (200):**
  ```json
  {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production"
  }
  ```

#### GET /api/greetings
- **Descripción:** Obtener la lista completa de saludos activos con sus países e idiomas correspondientes.
- **Autenticación JWT:** No requerida.
- **Parámetros query opcionales:**
  - `language` (string): Filtrar por idioma.
  - `isActive` (boolean): Filtrar por estado activo (por defecto `true`).
- **Respuesta exitosa (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "countryCode": "ES",
        "countryName": "España",
        "language": "Español",
        "greeting": "Hola",
        "formalGreeting": "Buenos días",
        "flagUrl": "/flags/es.svg",
        "isActive": true
      }
    ]
  }
  ```

#### GET /api/greetings/:countryCode
- **Descripción:** Obtener el saludo correspondiente a un país específico mediante su código de país ISO 3166-1 alpha-2.
- **Autenticación JWT:** No requerida.
- **Parámetros de ruta:**
  - `countryCode` (string, requerido): Código de país en formato ISO 3166-1 alpha-2 (ej: `ES`, `FR`, `JP`).
- **Respuesta exitosa (200):**
  ```json
  {
    "success": true,
    "data": {
      "countryCode": "JP",
      "countryName": "Japón",
      "language": "Japonés",
      "greeting": "こんにちは",
      "formalGreeting": "はじめまして",
      "flagUrl": "/flags/jp.svg",
      "isActive": true
    }
  }
  ```
- **Respuesta de error (404):**
  ```json
  {
    "success": false,
    "message": "País no encontrado"
  }
  ```

### Endpoints Protegidos (requieren JWT)

#### POST /api/auth/login
- **Descripción:** Autenticación de administrador. Devuelve un token JWT de acceso y un refresh token.
- **Autenticación JWT:** No requerida (es el endpoint de obtención del token).
- **Body (JSON):**
  ```json
  {
    "username": "string (requerido)",
    "password": "string (requerido)"
  }
  ```
- **Respuesta exitosa (200):**
  ```json
  {
    "success": true,
    "accessToken": "<jwt_token>",
    "refreshToken": "<refresh_token>",
    "expiresIn": "1h"
  }
  ```

#### POST /api/auth/refresh
- **Descripción:** Obtener un nuevo token de acceso utilizando un refresh token válido.
- **Autenticación JWT:** Refresh token en el body.
- **Body (JSON):**
  ```json
  {
    "refreshToken": "string (requerido)"
  }
  ```

#### POST /api/admin/greetings
- **Descripción:** Crear un nuevo saludo en la base de datos.
- **Autenticación JWT:** Requerida. Incluir el token en el header `Authorization: Bearer <token>`.
- **Body (JSON):**
  ```json
  {
    "countryCode": "string (requerido, 2 caracteres ISO)",
    "countryName": "string (requerido)",
    "language": "string (requerido)",
    "greeting": "string (requerido)",
    "formalGreeting": "string (opcional)",
    "flagUrl": "string (requerido)",
    "isActive": "boolean (opcional, default: true)"
  }
  ```
- **Respuesta exitosa (201):**
  ```json
  {
    "success": true,
    "data": { "<greeting_object_creado>" }
  }
  ```

#### PUT /api/admin/greetings/:countryCode
- **Descripción:** Actualizar un saludo existente identificado por su código de país.
- **Autenticación JWT:** Requerida. Incluir el token en el header `Authorization: Bearer <token>`.
- **Parámetros de ruta:**
  - `countryCode` (string, requerido): Código de país del saludo a actualizar.
- **Body (JSON):** Campos a actualizar (todos opcionales en la actualización).

#### DELETE /api/admin/greetings/:countryCode
- **Descripción:** Desactivar (soft delete) un saludo existente estableciendo `isActive: false`.
- **Autenticación JWT:** Requerida. Incluir el token en el header `Authorization: Bearer <token>`.
- **Parámetros de ruta:**
  - `countryCode` (string, requerido): Código de país del saludo a desactivar.

---

## Seguridad

La aplicación implementa múltiples capas de seguridad siguiendo principios DevSecOps:

- **HTTPS obligatorio en producción:** TLS 1.2+ con redirección automática de HTTP a HTTPS.
- **Headers de seguridad HTTP:** Gestionados por Helmet.js (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- **Protección contra fuerza bruta:** express-rate-limit limita el número de peticiones por IP.
- **CORS restrictivo:** Solo se permite el origen configurado en `CORS_ORIGIN`.
- **Validación de entrada en doble capa:** express-validator en el backend y DOMPurify en el frontend.
- **Sanitización contra NoSQL Injection:** express-mongo-sanitize y Mongoose strict mode.
- **Sanitización contra XSS:** xss-clean en el servidor y DOMPurify en el cliente.
- **Autenticación JWT:** Tokens de acceso con expiración corta (1h) y refresh tokens.
- **Hash de contraseñas:** bcryptjs con número de rondas configurable.
- **Protección CSRF:** Implementada en los formularios del panel de administración.
- **Gestión de secretos:** Variables de entorno en Heroku Config Vars, nunca en código fuente.
- **Auditoría de dependencias:** `npm audit` ejecutado automáticamente en el pipeline CI/CD.

---

## Testing

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar tests unitarios

```bash
npm run test:unit
```

### Ejecutar tests de integración

```bash
npm run test:integration
```

### Ejecutar tests con cobertura

```bash
npm run test:coverage
```

### Estructura de tests

- **Tests unitarios** (`tests/unit/`): Prueban servicios y lógica de negocio de forma aislada con Jest y mocks de los repositorios.
- **Tests de integración** (`tests/integration/`): Prueban los endpoints de la API de extremo a extremo con Supertest y una base de datos de test.

---

## Despliegue en Heroku

### Configuración inicial (primera vez)

1. Instalar el CLI de Heroku y autenticarse:
   ```bash
   heroku login
   ```

2. Crear la aplicación en Heroku:
   ```bash
   heroku create tsoft-greetings-xp10
   ```

3. Configurar las variables de entorno en Heroku (Config Vars):
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=<tu_cadena_de_conexion>
   heroku config:set JWT_SECRET=<tu_jwt_secret>
   heroku config:set JWT_REFRESH_SECRET=<tu_refresh_secret>
   heroku config:set JWT_EXPIRATION=1h
   heroku config:set CORS_ORIGIN=<url_del_frontend>
   heroku config:set BCRYPT_ROUNDS=12
   ```

4. El despliegue se realiza automáticamente mediante el pipeline de GitHub Actions al hacer push a la rama `main`.

### Procfile

El archivo `Procfile` en la raíz del proyecto define el proceso web para Heroku:

```
web: node server.js
```

### Health Check

Heroku utiliza el endpoint `GET /api/health` para verificar que la aplicación está funcionando correctamente después de cada despliegue.

---

## CI/CD Pipeline

El pipeline de integración y entrega continua está configurado en `.github/workflows/`:

### Pipeline de CI (`ci.yml`)

Se ejecuta en cada **Pull Request** y **push** a las ramas `main` y `develop`:

1. **Lint:** Verificación de estilo de código con ESLint.
2. **Test:** Ejecución de tests unitarios y de integración con Jest y Supertest.
3. **Audit:** Auditoría de seguridad de dependencias con `npm audit`.
4. **Build:** Construcción del frontend de React para verificar que compila correctamente.

### Pipeline de CD (`deploy.yml`)

Se ejecuta únicamente en **push a la rama `main`** después de que el pipeline de CI pase exitosamente:

1. Ejecuta el pipeline de CI completo.
2. Despliega automáticamente a Heroku.

### Entornos

| Rama | Entorno | URL |
|---|---|---|
| `develop` | Development | Local / Staging |
| `staging` | Staging | `https://tsoft-greetings-staging.herokuapp.com` |
| `main` | Production | `https://tsoft-greetings-xp10.herokuapp.com` |

---

## Contribución

1. Crear una rama desde `develop` con el formato `feature/nombre-de-la-feature` o `fix/nombre-del-fix`.
2. Realizar los cambios siguiendo las convenciones de código del proyecto.
3. Asegurarse de que todos los tests pasen localmente con `npm test`.
4. Verificar que no hay vulnerabilidades nuevas con `npm audit`.
5. Abrir un Pull Request hacia la rama `develop` con una descripción clara de los cambios.
6. El pipeline de CI debe pasar antes de que el PR pueda ser mergeado.

---

## Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Ver el archivo `LICENSE` para más detalles.

---

*Tsoft Greetings Web App (XP-10) - Desarrollado con metodología Hybrid, sprints cortos y entregas incrementales.*