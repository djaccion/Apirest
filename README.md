# API RESTful Node.js — Proyecto Base

[![Node.js](https://img.shields.io/badge/node-20%20LTS-brightgreen?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-CI%2FCD%20ready-success)](https://shields.io/)
[![Coverage](https://img.shields.io/badge/coverage-pending-yellow)](https://shields.io/)

---

## Descripción General

Este proyecto es una API RESTful construida sobre Node.js 20 LTS con Express.js 4.x siguiendo el patrón MVC simplificado con separación de responsabilidades por capas. Resuelve la necesidad de contar con una base de backend segura, documentada y lista para escalar, incorporando desde el inicio prácticas de DevSecOps como autenticación JWT, rate limiting, validación de entradas y logging estructurado. El stack tecnológico incluye herramientas estándar de la industria para seguridad, documentación, testing y contenedorización.

---

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Variables de Entorno](#variables-de-entorno)
- [Instalación y Ejecución Local](#instalación-y-ejecución-local)
- [Documentación de la API](#documentación-de-la-api)
- [Seguridad](#seguridad)
- [Testing](#testing)
- [Linting y Formato](#linting-y-formato)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Contribución](#contribución)
- [Roadmap](#roadmap)

---

## Arquitectura

El patrón adoptado es RESTful MVC simplificado con separación clara por capas. Cada capa tiene una responsabilidad única y acotada: los middlewares de seguridad actúan antes de que la petición llegue a las rutas, los controladores orquestan la lógica de negocio, y la capa de servicios está prevista para iteraciones futuras. No existe capa de modelo en esta iteración, pero está planificada mediante Mongoose para la integración con MongoDB.

```
┌─────────────────────────────────────────┐
│            REQUEST ENTRANTE             │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│      MIDDLEWARES DE SEGURIDAD           │
│   helmet · cors · rate-limit · morgan   │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│            CAPA DE RUTAS                │
│         /src/routes/*.js                │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│         CAPA DE CONTROLADORES           │
│       /src/controllers/*.js             │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│      CAPA DE SERVICIOS (FUTURA)         │
│        /src/services/*.js               │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│           RESPUESTA SALIENTE            │
└─────────────────────────────────────────┘
```

---

## Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas antes de continuar:

| Herramienta    | Versión mínima     | Comando de verificación         |
|----------------|--------------------|---------------------------------|
| Node.js        | 20 LTS             | `node --version`                |
| npm            | 10.x o superior    | `npm --version`                 |
| Docker         | 24.x o superior    | `docker --version`              |
| Docker Compose | 2.x o superior     | `docker compose version`        |
| Git            | 2.x o superior     | `git --version`                 |

---

## Variables de Entorno

Antes de ejecutar el proyecto, copia el archivo de ejemplo y completa los valores correspondientes:

```bash
cp .env.example .env
```

> **⚠️ ADVERTENCIA: `JWT_SECRET` nunca debe hardcodearse en el código fuente ni commitearse al repositorio. Gestiona este valor exclusivamente mediante el archivo `.env` local o un sistema de gestión de secrets (vault). El archivo `.env` está incluido en `.gitignore`.**

| Variable                | Descripción funcional                                                        | Obligatoria |
|-------------------------|------------------------------------------------------------------------------|-------------|
| `PORT`                  | Puerto en el que escucha el servidor HTTP                                    | Opcional    |
| `NODE_ENV`              | Entorno de ejecución: `development`, `staging` o `production`                | Obligatoria |
| `JWT_SECRET`            | Clave secreta para firmar y verificar tokens JWT                             | Obligatoria |
| `CORS_ORIGINS`          | Lista de orígenes permitidos separados por coma para la política CORS        | Obligatoria |
| `RATE_LIMIT_WINDOW_MS`  | Ventana de tiempo en milisegundos para el rate limiting por IP               | Opcional    |
| `RATE_LIMIT_MAX`        | Número máximo de peticiones permitidas por IP dentro de la ventana de tiempo | Opcional    |
| `LOG_LEVEL`             | Nivel de logging para winston: `error`, `warn`, `info`, `debug`              | Opcional    |

---

## Instalación y Ejecución Local

### Método A — Sin Docker

Sigue estos pasos en orden para levantar el servidor localmente sin contenedores:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/tu-repositorio.git
cd tu-repositorio

# 2. Instalar dependencias
npm install

# 3. Copiar el archivo de variables de entorno y completar los valores
cp .env.example .env

# 4a. Ejecutar en modo desarrollo (con recarga automática)
npm run dev

# 4b. Ejecutar en modo producción
npm start
```

### Método B — Con Docker

Asegúrate de haber copiado y configurado el archivo `.env` antes de construir la imagen.

```bash
# 1. Copiar el archivo de variables de entorno
cp .env.example .env

# 2. Construir la imagen y levantar los servicios definidos en docker-compose.yml
docker compose up --build

# Para ejecutar en segundo plano
docker compose up --build -d

# Para detener los servicios
docker compose down
```

El contenedor expone el puerto definido en la variable de entorno `PORT` (por defecto `3000`). Asegúrate de que dicho puerto esté disponible en tu máquina local.

---

## Documentación de la API

La documentación interactiva de la API está disponible mediante Swagger UI en la ruta `/api-docs` una vez que el servidor está corriendo.

Accede desde tu navegador en:

```
http://localhost:3000/api-docs
```

La especificación OpenAPI es generada automáticamente con `swagger-jsdoc` a partir de las anotaciones JSDoc presentes en los archivos de rutas y controladores ubicados en `src/routes/` y `src/controllers/`. No es necesario mantener un archivo de especificación separado; la documentación se mantiene sincronizada con el código fuente.

---

## Seguridad

Las siguientes medidas de seguridad están implementadas y activas en todas las peticiones:

- **JWT**: autenticación mediante tokens firmados, validados en el header `Authorization` con esquema `Bearer` a través de un middleware dedicado en `src/middlewares/auth.js`.
- **CORS**: política de orígenes cruzados configurada con la librería `cors`, permitiendo únicamente los orígenes definidos en la variable de entorno `CORS_ORIGINS`.
- **Rate Limiting**: protección contra DoS/DDoS mediante `express-rate-limit`, limitando el número de peticiones por IP dentro de una ventana de tiempo configurable vía variables de entorno.
- **Validación de entradas**: sanitización y validación de parámetros de query, body y params con `express-validator`, rechazando peticiones malformadas antes de llegar a los controladores.
- **Cabeceras HTTP de seguridad**: configuradas automáticamente con `helmet`, incluyendo protecciones contra XSS, clickjacking, HSTS, CSP y otras vulnerabilidades comunes a nivel de cabeceras.
- **Logging de acceso**: registro de todas las peticiones HTTP con `morgan` en formato combinado, integrado con `winston` para logs estructurados en JSON, facilitando la integración con herramientas SIEM o plataformas de monitoreo.

---

## Testing

El framework de testing es **Jest** junto con **supertest** para pruebas de integración sobre los endpoints HTTP. Los archivos de test se ubican en la carpeta `tests/` en la raíz del proyecto, siguiendo la convención de nomenclatura `*.test.js`.

Comandos disponibles:

```bash
# Ejecutar la suite completa de tests
npm test

# Generar reporte de cobertura de código
npm run test:coverage

# Ejecutar tests en modo observador durante el desarrollo
npm run test:watch
```

El reporte de cobertura se genera en la carpeta `coverage/` y puede consultarse abriendo `coverage/lcov-report/index.html` en el navegador.

---

## Linting y Formato

Las herramientas configuradas para mantener la calidad y consistencia del código son **ESLint** para análisis estático y **Prettier** para formato de código. Las reglas están definidas en los archivos `.eslintrc.js` y `.prettierrc` en la raíz del proyecto.

Comandos disponibles:

```bash
# Verificar el código con ESLint
npm run lint

# Corregir automáticamente los problemas detectados por ESLint
npm run lint:fix

# Aplicar formato con Prettier a todos los archivos del proyecto
npm run format
```

Se recomienda integrar estas herramientas con el editor de código (extensiones para VS Code disponibles) y ejecutarlas como parte del pipeline CI/CD antes de cada merge.

---

## Estructura del Proyecto

```
.
├── src/                          # Código fuente principal de la aplicación
│   ├── config/                   # Configuración centralizada (env, swagger, logger)
│   │   ├── env.js                # Carga y validación de variables de entorno
│   │   ├── logger.js             # Configuración de winston
│   │   └── swagger.js            # Configuración de swagger-jsdoc
│   ├── controllers/              # Controladores: lógica de negocio por recurso
│   │   └── health.controller.js  # Controlador de ejemplo para health check
│   ├── middlewares/              # Middlewares personalizados y de seguridad
│   │   ├── auth.js               # Validación de token JWT
│   │   ├── errorHandler.js       # Manejador global de errores
│   │   ├── rateLimiter.js        # Configuración de express-rate-limit
│   │   └── validate.js           # Middleware de validación con express-validator
│   └── routes/                   # Definición de rutas por recurso
│       ├── index.js              # Router principal que agrupa todas las rutas
│       └── health.routes.js      # Rutas de health check con anotaciones Swagger
├── tests/                        # Suite de tests unitarios y de integración
│   ├── health.test.js            # Tests de integración para el endpoint de health
│   └── setup.js                  # Configuración global de Jest
├── app.js                        # Configuración de Express y registro de middlewares
├── server.js                     # Punto de entrada: inicialización del servidor HTTP
├── .env.example                  # Plantilla de variables de entorno (sin valores sensibles)
├── .eslintrc.js                  # Reglas de ESLint
├── .prettierrc                   # Reglas de formato de Prettier
├── .gitignore                    # Archivos y carpetas excluidos del repositorio
├── Dockerfile                    # Imagen Docker de la aplicación
├── docker-compose.yml            # Orquestación de servicios con Docker Compose
├── jest.config.js                # Configuración de Jest
├── package.json                  # Dependencias y scripts npm
└── README.md                     # Documentación principal del proyecto
```

---

## Contribución

Para contribuir al proyecto sigue el flujo de trabajo establecido:

1. **Crear una rama** desde `main` usando la nomenclatura correspondiente:
   - Para nuevas funcionalidades: `feature/nombre-descriptivo-de-la-tarea`
   - Para correcciones: `fix/nombre-descriptivo-del-bug`

2. **Realizar commits** con mensajes descriptivos en inglés, siguiendo el formato:
   ```
   type(scope): short description
   ```
   Ejemplo: `feat(auth): add JWT validation middleware`

3. **Asegurarse de que los tests pasen** antes de abrir el Pull Request:
   ```bash
   npm test
   npm run lint
   ```

4. **Abrir un Pull Request** hacia `main` con una descripción clara del cambio realizado, el problema que resuelve y cualquier consideración relevante para el revisor.

5. **Esperar revisión**: al menos un aprobador es requerido antes de hacer merge. El pipeline CI/CD validará automáticamente los tests y el linting sobre la rama del PR, en línea con la estructura compatible definida en Jira XP-9.

---

## Roadmap

Características planificadas para iteraciones futuras:

- [ ] **Integración con MongoDB mediante Mongoose**: incorporación de la capa de modelo para persistencia de datos, incluyendo logs de acceso y gestión de usuarios.
- [ ] **Separación de ambientes**: configuración diferenciada para `development`, `staging` y `production` mediante `NODE_ENV`, con archivos de entorno específicos por ambiente.
- [ ] **Gestión de secrets mediante vault**: migración de variables sensibles como `JWT_SECRET` hacia un sistema de gestión de secrets (HashiCorp Vault o equivalente en cloud).
- [ ] **Expansión de la cobertura de tests**: incremento de la cobertura hacia el 80% mínimo, incorporando tests unitarios por capa y tests de contrato para la API.
- [ ] **Integración con MongoDB Atlas**: soporte para conexión a instancias gestionadas en la nube con configuración de connection pooling y manejo de reconexión.
- [ ] **Gestión de usuarios**: endpoints de registro, login y refresh token con almacenamiento seguro de contraseñas mediante `bcryptjs`.
- [ ] **Pipeline CI/CD completo**: configuración de workflows para GitHub Actions o equivalente, incluyendo stages de lint, test, build y deploy automatizado.