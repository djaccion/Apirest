# API RESTful Node.js - XP-9

> API RESTful construida con Node.js 20 LTS y Express.js 4.x

![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-339933?logo=node.js) ![License](https://img.shields.io/badge/license-MIT-blue) ![Jira](https://img.shields.io/badge/Jira-XP--9-0052CC?logo=jira)

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Prerrequisitos](#prerrequisitos)
- [Variables de Entorno](#variables-de-entorno)
- [Instalación](#instalación)
  - [Instalación Local](#instalación-local)
  - [Instalación con Docker](#instalación-con-docker)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Autenticación](#autenticación)
- [Seguridad Implementada](#seguridad-implementada)
- [Documentación Swagger](#documentación-swagger)
- [Testing](#testing)
- [Linting y Formato de Código](#linting-y-formato-de-código)
- [Scripts Disponibles](#scripts-disponibles)

---

## Descripción General

Este proyecto implementa una API RESTful sobre el patrón arquitectónico MVC simplificado sin capa de modelo en esta iteración, construida sobre Node.js 20 LTS y Express.js 4.x. La arquitectura establece una separación estricta de responsabilidades organizada en capas: rutas, controladores, middlewares y configuración, garantizando mantenibilidad, escalabilidad y trazabilidad hacia el ticket Jira XP-9.

La metodología adoptada es híbrida, combinando prácticas ágiles de entrega incremental e historias de usuario con documentación formal siguiendo el estándar OpenAPI mediante Swagger/OpenAPI, lo que permite trazabilidad completa entre los requerimientos funcionales y la implementación técnica. La estructura del proyecto contempla además la integración futura con MongoDB mediante Mongoose, con carpetas previstas en el árbol de directorios.

---

## Prerrequisitos

Asegúrate de contar con las siguientes herramientas instaladas en tu entorno antes de continuar:

- **Node.js 20 LTS** — Runtime de JavaScript requerido
  ```bash
  node --version
  # Resultado esperado: v20.x.x
  ```
- **npm** — Gestor de paquetes incluido con Node.js
  ```bash
  npm --version
  # Resultado esperado: 10.x.x o superior
  ```
- **Docker** — Para ejecución en contenedor
  ```bash
  docker --version
  # Resultado esperado: Docker version 24.x.x o superior
  ```
- **docker-compose** — Para orquestación de servicios
  ```bash
  docker-compose --version
  # Resultado esperado: Docker Compose version v2.x.x o superior
  ```
- **Git** — Control de versiones
  ```bash
  git --version
  # Resultado esperado: git version 2.x.x o superior
  ```

---

## Variables de Entorno

El proyecto utiliza un archivo `.env` en la raíz para gestionar la configuración sensible y específica del entorno. Existe un archivo de ejemplo llamado `.env.example` en la raíz del proyecto que contiene todas las variables requeridas con valores de referencia.

> ⚠️ **ADVERTENCIA DE SEGURIDAD:** El archivo `.env` **NUNCA** debe commitearse al repositorio. Está incluido en `.gitignore`. Exponer este archivo puede comprometer credenciales, secretos JWT y configuraciones críticas del sistema.

| Variable | Propósito | Obligatoria | Valor de Ejemplo |
|---|---|---|---|
| `PORT` | Puerto en el que escucha el servidor HTTP | Opcional | `3000` |
| `JWT_SECRET` | Clave secreta para firmar y verificar tokens JWT | **Obligatoria** | `mi_secreto_super_seguro_cambiar_en_produccion` |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token JWT | Opcional | `1h` |
| `CORS_ALLOWED_ORIGINS` | Orígenes autorizados para CORS, separados por coma | **Obligatoria** | `http://localhost:3000,http://localhost:4200` |
| `RATE_LIMIT_MAX` | Número máximo de requests permitidos por IP en la ventana de tiempo | Opcional | `100` |
| `RATE_LIMIT_WINDOW_MS` | Ventana de tiempo en milisegundos para el rate limiting | Opcional | `900000` |

Ejemplo del contenido de `.env.example`:

```env
# Servidor
PORT=3000

# JWT
JWT_SECRET=mi_secreto_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=1h

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

---

## Instalación

### Instalación Local

Sigue los pasos en el orden indicado para levantar el proyecto en tu entorno local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-organizacion/xp-9-api.git

# 2. Ingresar al directorio del proyecto
cd xp-9-api

# 3. Instalar dependencias
npm install

# 4. Copiar el archivo de entorno de ejemplo
cp .env.example .env

# 5. Configurar las variables de entorno
# Editar el archivo .env con los valores correspondientes a tu entorno
nano .env
# o con tu editor preferido:
# code .env

# 6. Ejecutar en modo desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000` (o el puerto configurado en `PORT`).

### Instalación con Docker

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-organizacion/xp-9-api.git

# 2. Ingresar al directorio del proyecto
cd xp-9-api

# 3. Copiar el archivo de entorno de ejemplo y configurar variables
cp .env.example .env

# 4. Construir la imagen Docker
docker-compose build

# 5. Ejecutar el servicio en modo detached (segundo plano)
docker-compose up -d

# Para verificar que el contenedor está corriendo
docker-compose ps

# Para ver los logs del contenedor
docker-compose logs -f
```

---

## Estructura del Proyecto

```
xp-9-api/
├── src/
│   ├── config/                         # Variables de entorno y configuraciones globales
│   │   ├── env.js                      # Carga y validación de variables de entorno con dotenv
│   │   └── swagger.js                  # Configuración de swagger-jsdoc y swagger-ui-express
│   │
│   ├── middlewares/                    # Middlewares de la aplicación Express
│   │   ├── auth.middleware.js          # Verificación y validación de JWT en requests protegidos
│   │   ├── cors.middleware.js          # Configuración estricta de CORS con orígenes por variable de entorno
│   │   ├── rateLimit.middleware.js     # Rate limiting por IP con express-rate-limit
│   │   ├── helmet.middleware.js        # Headers HTTP seguros con helmet
│   │   ├── logger.middleware.js        # HTTP access logs con morgan y logs de aplicación con winston
│   │   └── errorHandler.middleware.js  # Manejo centralizado de errores y respuestas de error estándar
│   │
│   ├── routes/                         # Definición de endpoints REST y agrupación por versión
│   │   ├── index.js                    # Router principal que agrupa todas las rutas bajo /api/v1
│   │   ├── health.routes.js            # Ruta pública GET /api/v1/health
│   │   ├── auth.routes.js              # Ruta POST /api/v1/auth/token para generación de JWT
│   │   └── hola.routes.js              # Ruta protegida GET /api/v1/hola con middleware JWT
│   │
│   ├── controllers/                    # Lógica de negocio de cada endpoint
│   │   ├── health.controller.js        # Controlador del health check
│   │   ├── auth.controller.js          # Controlador de generación de token JWT
│   │   └── hola.controller.js          # Controlador del endpoint Hola Mundo con requestId y timestamp
│   │
│   ├── utils/                          # Helpers y utilidades reutilizables
│   │   ├── logger.js                   # Instancia de winston con niveles y formato estructurado
│   │   └── response.js                 # Helpers para respuestas HTTP estándar (success, error)
│   │
│   ├── docs/                           # Configuración y definiciones OpenAPI/Swagger
│   │   └── openapi.js                  # Definición base del documento OpenAPI 3.0
│   │
│   ├── models/                         # (previsto para integración futura con MongoDB)
│   │   └── .gitkeep
│   │
│   ├── services/                       # (previsto para integración futura con MongoDB)
│   │   └── .gitkeep
│   │
│   └── app.js                          # Instancia de Express, registro de middlewares y rutas
│
├── tests/                              # Pruebas unitarias e integración con Jest y Supertest
│   ├── unit/                           # Pruebas unitarias por controlador y middleware
│   │   ├── health.controller.test.js
│   │   ├── auth.controller.test.js
│   │   └── hola.controller.test.js
│   └── integration/                    # Pruebas de integración de endpoints completos
│       ├── health.test.js
│       ├── auth.test.js
│       └── hola.test.js
│
├── .env                                # Variables de entorno locales (NO commitear)
├── .env.example                        # Plantilla de variables de entorno para nuevos desarrolladores
├── .eslintrc.js                        # Configuración de ESLint para análisis estático de código
├── .prettierrc                         # Configuración de Prettier para formato de código
├── .gitignore                          # Archivos y carpetas excluidos del control de versiones
├── Dockerfile                          # Imagen Docker de la aplicación
├── docker-compose.yml                  # Orquestación de servicios con docker-compose
├── jest.config.js                      # Configuración de Jest para testing
├── package.json                        # Dependencias, scripts y metadatos del proyecto
├── package-lock.json                   # Lockfile de dependencias npm
└── README.md                           # Documentación principal del proyecto
```

---

## Endpoints Disponibles

| Método HTTP | Ruta | Autenticación Requerida | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/health` | No | Health check público. Retorna el estado del servidor sin requerir autenticación. |
| `POST` | `/api/v1/auth/token` | No | Genera un JWT válido. **Solo para desarrollo y pruebas.** No debe exponerse en producción. |
| `GET` | `/api/v1/hola` | **Sí — Bearer Token JWT válido** | Retorna `{ message: 'Hola Mundo', timestamp, requestId }`. Requiere token JWT en header `Authorization`. |
| `GET` | `/api-docs` | No | Acceso a la documentación interactiva Swagger UI generada con OpenAPI 3.0. |

---

## Autenticación

El sistema de autenticación utiliza **JSON Web Tokens (JWT)** mediante la librería `jsonwebtoken`. El token viaja **exclusivamente en el header `Authorization`**, nunca en query params ni en el body de la request.

### Flujo de Autenticación

**Paso 1: Obtener el token JWT**

Realizar una petición `POST` al endpoint de generación de token:

```bash
curl -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "dev-user"}'
```

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

**Paso 2: Usar el token en requests protegidos**

Incluir el token en el header `Authorization` con el formato exacto `Bearer <token>`:

```bash
curl -X GET http://localhost:3000/api/v1/hola \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "message": "Hola Mundo",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

> ℹ️ Si el token es inválido, está expirado o no se incluye el header `Authorization`, el servidor responderá con HTTP `401 Unauthorized`.

---

## Seguridad Implementada

El proyecto implementa un enfoque DevSecOps con múltiples capas de seguridad:

- **JWT Authentication** — Verificación de token en cada request protegido mediante la librería `jsonwebtoken`. El middleware valida la firma, la expiración y la estructura del token antes de permitir el acceso al controlador.

- **CORS Estricto** — Configurado con la librería `cors`, permitiendo únicamente los orígenes definidos en la variable de entorno `CORS_ALLOWED_ORIGINS`. Cualquier origen no autorizado recibirá un error de CORS bloqueado por el navegador.

- **Rate Limiting** — Implementado con `express-rate-limit`. Limita el número de requests por IP en una ventana de tiempo configurable mediante las variables `RATE_LIMIT_MAX` y `RATE_LIMIT_WINDOW_MS`, previniendo ataques de tipo DoS/DDoS.

- **Validación de Entrada** — Uso de `express-validator` para sanitizar y validar todos los parámetros de entrada antes de que lleguen a los controladores, previniendo inyecciones y datos malformados.

- **Headers HTTP Seguros con Helmet** — La librería `helmet` configura automáticamente los siguientes headers de seguridad:
  - `X-Frame-Options`: Previene clickjacking
  - `Content-Security-Policy (CSP)`: Controla recursos que el navegador puede cargar
  - `Strict-Transport-Security (HSTS)`: Fuerza conexiones HTTPS
  - `X-Content-Type-Options`: Previene MIME type sniffing
  - `Referrer-Policy`: Controla información del referrer
  - `X-XSS-Protection`: Protección adicional contra XSS en navegadores legacy

- **Logging Estructurado** — Doble capa de logging:
  - `morgan`: HTTP access logs con formato estructurado para cada request entrante
  - `winston`: Logs de aplicación con niveles (`error`, `warn`, `info`, `debug`), formato JSON estructurado e inclusión de `requestId` único por request para trazabilidad completa en sistemas distribuidos

---

## Documentación Swagger

Una vez levantado el servidor, la documentación interactiva está disponible en:

```
http://localhost:3000/api-docs
```

La documentación sigue el estándar **OpenAPI 3.0** y está generada automáticamente con `swagger-jsdoc` a partir de las anotaciones JSDoc en el código fuente, y renderizada con `swagger-ui-express`. Esto garantiza que la documentación esté siempre sincronizada con la implementación real.

> 📋 La documentación Swagger mantiene trazabilidad directa con el ticket Jira **XP-9**, incluyendo referencias a los requerimientos funcionales en las descripciones de cada endpoint.

---

## Testing

El stack de testing está compuesto por **Jest** como framework de pruebas y **Supertest** para pruebas de integración de endpoints HTTP. Los tests se ubican en la carpeta `tests/` y cubren tanto pruebas unitarias de controladores y middlewares como pruebas de integración de los endpoints completos.

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con reporte de cobertura de código
npm run test:coverage

# Ejecutar tests en modo watch durante desarrollo (re-ejecuta al detectar cambios)
npm run test:watch
```

---

## Linting y Formato de Código

El proyecto utiliza **ESLint** para análisis estático de código y detección de errores, y **Prettier** para el formato consistente del código fuente. Ambas herramientas tienen sus archivos de configuración en la raíz del proyecto (`.eslintrc.js` y `.prettierrc` respectivamente). El linting es parte integral del pipeline CI/CD y se ejecuta automáticamente en cada push.

```bash
# Ejecutar ESLint para analizar el código
npm run lint

# Ejecutar ESLint y corregir automáticamente los errores corregibles
npm run lint:fix

# Ejecutar Prettier para verificar el formato del código
npm run format:check

# Ejecutar Prettier para aplicar el formato al código
npm run format
```

---

## Scripts Disponibles

Todos los scripts están definidos en la sección `scripts` del archivo `package.json`:

| Script | Comando | Descripción |
|---|---|---|
| `start` | `npm start` | Inicia el servidor en modo producción con `node` |
| `dev` | `npm run dev` | Inicia el servidor en modo desarrollo con `nodemon` (recarga automática) |
| `test` | `npm test` | Ejecuta todos los tests con Jest |
| `test:coverage` | `npm run test:coverage` | Ejecuta tests y genera reporte de cobertura de código |
| `test:watch` | `npm run test:watch` | Ejecuta tests en modo watch para desarrollo |
| `lint` | `npm run lint` | Analiza el código con ESLint |
| `lint:fix` | `npm run lint:fix` | Analiza y corrige automáticamente errores de ESLint |
| `format:check` | `npm run format:check` | Verifica el formato del código con Prettier |
| `format` | `npm run format` | Aplica el formato de código con Prettier |
| `docker:build` | `npm run docker:build` | Construye la imagen Docker del proyecto |
| `docker:up` | `npm run docker:up` | Levanta los servicios con docker-compose en modo detached |
| `docker:down` | `npm run docker:down` | Detiene y elimina los contenedores de docker-compose |
| `docker:logs` | `npm run docker:logs` | Muestra los logs del contenedor en tiempo real |