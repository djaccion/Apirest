# API REST - Hola Endpoint | XP-9

![Metodología](https://img.shields.io/badge/metodolog%C3%ADa-Hybrid-blueviolet) ![JIRA](https://img.shields.io/badge/JIRA-XP--9-blue)

Servicio RESTful que expone el endpoint `GET /hola` protegido con JWT, construido sobre Node.js con Express.js.

---

![Coverage](https://img.shields.io/badge/coverage-80%25%20min-brightgreen) ![Node](https://img.shields.io/badge/node-20%20LTS-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Linting](https://img.shields.io/badge/linting-ESLint%20%2B%20Prettier-yellow)

---

## Descripción General

Este servicio expone un endpoint RESTful `GET /hola` protegido con JWT, construido sobre Node.js con Express.js, siguiendo el patrón MVC simplificado con capas de seguridad encadenadas (CORS, Rate Limiting, JWT Validator, Input Validator, Access Logger). La arquitectura aplica la filosofía DevSecOps, integrando controles de seguridad en cada capa del ciclo de vida del request, desde la validación de cabeceras HTTP hasta el registro estructurado de accesos, garantizando que la seguridad no es una capa adicional sino parte intrínseca del diseño.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Ejecución del Servidor](#ejecución-del-servidor)
- [Uso del Endpoint](#uso-del-endpoint)
- [Autenticación JWT](#autenticación-jwt)
- [Documentación Interactiva](#documentación-interactiva)
- [Testing](#testing)
- [Linting y Formato](#linting-y-formato)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## Arquitectura

### Capas de la Aplicación

**1. Capa de Entrada**
Responsable de recibir y enrutar las solicitudes HTTP entrantes. Implementada con Express Router, expone el endpoint `GET /hola` y delega el procesamiento a la cadena de middlewares.

**2. Capa de Seguridad**
Cadena de middlewares que se ejecutan secuencialmente antes de llegar al controlador. Cada middleware tiene una responsabilidad única y puede cortocircuitar el flujo devolviendo un error si la validación falla:
- **CORS**: Valida que el origen del request esté en la whitelist definida por `ALLOWED_ORIGINS`.
- **Rate Limiting**: Limita el número de requests por IP usando `express-rate-limit` (100 req/15min).
- **JWT Validator**: Verifica la firma y vigencia del token Bearer enviado en el header `Authorization`.
- **Input Validator**: Sanitiza y valida headers y query params usando `express-validator`.
- **Access Logger**: Registra cada solicitud con timestamp, IP, método, ruta y status code usando `morgan` + `winston`.

**3. Capa de Negocio**
Controller que construye y devuelve la respuesta JSON al cliente. Contiene la lógica de negocio del endpoint, manteniendo los controllers delgados y desacoplados de la infraestructura.

**4. Capa de Documentación**
Swagger UI integrado en `/api-docs`, generado automáticamente a partir de anotaciones JSDoc en el código fuente usando `swagger-jsdoc` y servido con `swagger-ui-express`.

### Diagrama de Flujo de Request

```
Cliente HTTP
     │
     │  GET /hola
     │  Authorization: Bearer <token>
     ▼
┌─────────────────────────────────────────────┐
│              Express Router                 │
│         Capa de Entrada (XP-9)              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           1. CORS Middleware                │
│   Verifica origen contra ALLOWED_ORIGINS    │
│   ✗ → 403 Forbidden                        │
└─────────────────┬───────────────────────────┘
                  │ ✓
                  ▼
┌─────────────────────────────────────────────┐
│        2. Rate Limiting Middleware          │
│      Verifica límite de req por IP          │
│   ✗ → 429 Too Many Requests                │
└─────────────────┬───────────────────────────┘
                  │ ✓
                  ▼
┌─────────────────────────────────────────────┐
│        3. JWT Validator Middleware          │
│    Verifica firma y vigencia del token      │
│   ✗ → 401 Unauthorized                     │
└─────────────────┬───────────────────────────┘
                  │ ✓
                  ▼
┌─────────────────────────────────────────────┐
│       4. Input Validator Middleware         │
│   Sanitiza y valida headers/query params    │
│   ✗ → 422 Unprocessable Entity             │
└─────────────────┬───────────────────────────┘
                  │ ✓
                  ▼
┌─────────────────────────────────────────────┐
│        5. Access Logger Middleware          │
│  Registra: timestamp, IP, método, ruta,     │
│  status → winston (structured log)          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│            Controller (MVC)                 │
│         Capa de Negocio                     │
│      Construye respuesta JSON               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
     { "mensaje": "hola" }
         HTTP 200 OK
```

---

## Stack Tecnológico

| Categoría       | Tecnología              | Versión   |
|-----------------|-------------------------|-----------|
| Runtime         | Node.js                 | 20 LTS    |
| Framework       | Express.js              | 4.x       |
| Autenticación   | jsonwebtoken            | ^9.0.0    |
| Seguridad HTTP  | helmet                  | ^7.0.0    |
| CORS            | cors                    | ^2.8.5    |
| Rate Limiting   | express-rate-limit      | ^7.0.0    |
| Validación      | express-validator       | ^7.0.0    |
| Logging         | morgan + winston        | ^1.10.0 + ^3.0.0 |
| Documentación   | swagger-jsdoc + swagger-ui-express | ^6.0.0 + ^5.0.0 |
| Testing         | Jest + Supertest        | ^29.0.0 + ^6.0.0 |
| Linting         | ESLint + Prettier       | ^8.0.0 + ^3.0.0 |
| Variables de entorno | dotenv             | ^16.0.0   |

---

## Requisitos Previos

Antes de instalar el proyecto, asegúrate de contar con los siguientes requisitos en tu entorno:

- **Node.js** versión 20 LTS como mínimo
  ```bash
  node --version
  # Debe mostrar v20.x.x o superior
  ```

- **npm** versión 9 o superior
  ```bash
  npm --version
  # Debe mostrar 9.x.x o superior
  ```

- **Git**
  ```bash
  git --version
  # Debe mostrar git version 2.x.x o superior
  ```

---

## Instalación

Sigue los pasos numerados a continuación para clonar el repositorio e instalar las dependencias:

**1. Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/nombre-del-repo.git
```

**2. Accede al directorio del proyecto**
```bash
cd nombre-del-repo
```

**3. Instala las dependencias**
```bash
npm install
```

**4. Copia el archivo de variables de entorno**
```bash
cp .env.example .env
```

**5. Edita el archivo `.env` con tus valores** (ver sección [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno))

---

## Configuración de Variables de Entorno

El proyecto requiere un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example` incluido en el repositorio.

Las tres variables de entorno obligatorias son:

| Variable           | Descripción                                                                                      |
|--------------------|--------------------------------------------------------------------------------------------------|
| `PORT`             | Puerto en el que corre el servidor (ej. `3000`)                                                  |
| `JWT_SECRET`       | Clave secreta para firmar y verificar tokens JWT. **Debe ser un string largo, aleatorio y nunca commiteado.** |
| `ALLOWED_ORIGINS`  | Lista separada por comas de dominios permitidos para CORS (ej. `http://localhost:3000,https://mi-dominio.com`) |

Ejemplo de contenido del archivo `.env`:

```env
PORT=3000
JWT_SECRET=reemplaza-esto-con-un-string-largo-y-aleatorio-generado-de-forma-segura
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
```

> **⚠️ ADVERTENCIA: El archivo `.env` está incluido en `.gitignore` y NUNCA debe subirse al repositorio. Contiene secretos sensibles que comprometerían la seguridad del servicio si se exponen.**

---

## Ejecución del Servidor

**Modo desarrollo** (con recarga automática via nodemon):
```bash
npm run dev
```

**Modo producción**:
```bash
npm start
```

**Modo debug** (con inspector de Node.js habilitado):
```bash
npm run debug
```

---

## Uso del Endpoint

### `GET /hola`

| Campo       | Detalle                                      |
|-------------|----------------------------------------------|
| Método      | `GET`                                        |
| Ruta        | `/hola`                                      |
| Descripción | Devuelve un saludo JSON. Requiere autenticación JWT válida en el header `Authorization`. |
| Header requerido | `Authorization: Bearer <token>`         |

#### Ejemplo de Request

```bash
curl -X GET http://localhost:3000/hola \
  -H "Authorization: Bearer <tu-token-jwt-aqui>"
```

#### Respuesta Exitosa — `200 OK`

```json
{
  "mensaje": "hola",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Respuestas de Error

**`401 Unauthorized`** — Sin token o token inválido/expirado:
```json
{
  "error": "Unauthorized",
  "mensaje": "Token JWT ausente, inválido o expirado."
}
```

**`429 Too Many Requests`** — Rate limit excedido:
```json
{
  "error": "Too Many Requests",
  "mensaje": "Has excedido el límite de solicitudes. Intenta nuevamente en 15 minutos."
}
```

**`500 Internal Server Error`** — Error interno del servidor:
```json
{
  "error": "Internal Server Error",
  "mensaje": "Ocurrió un error inesperado. Por favor contacta al administrador."
}
```

---

## Autenticación JWT

Para pruebas locales, puedes generar un token JWT directamente desde la consola usando el módulo `jsonwebtoken` y la variable `JWT_SECRET` definida en tu archivo `.env`:

```bash
node -e "const jwt = require('jsonwebtoken'); require('dotenv').config(); console.log(jwt.sign({ sub: 'usuario-prueba', rol: 'dev' }, process.env.JWT_SECRET, { expiresIn: '1h' }));"
```

Copia el token generado y úsalo en el header `Authorization: Bearer <token>` de tus requests.

> **Nota:** En producción, la emisión de tokens corresponde a un servicio de autenticación externo. Este servicio únicamente valida tokens, no los emite.

---

## Documentación Interactiva

Swagger UI está disponible en la ruta `/api-docs` una vez que el servidor está corriendo.

URL completa:
```
http://localhost:3000/api-docs
```

Desde esa interfaz puedes explorar y probar el endpoint `GET /hola` directamente, incluyendo autenticación Bearer mediante el botón **Authorize** de Swagger UI, sin necesidad de herramientas externas como curl o Postman.

---

## Testing

**Ejecutar todos los tests:**
```bash
npm test
```

**Ejecutar tests con reporte de cobertura:**
```bash
npm run test:coverage
```

**Ejecutar tests en modo watch** (para desarrollo):
```bash
npm run test:watch
```

La cobertura mínima aceptable es del **80%**. El pipeline de CI rechazará automáticamente cualquier build que no alcance ese umbral.

Los tests cubren:
- **Tests unitarios**: middlewares individuales (CORS, Rate Limiting, JWT Validator, Input Validator, Access Logger) y controllers.
- **Tests de integración**: endpoint `GET /hola` con token JWT válido (espera `200 OK`) y sin token o con token inválido (espera `401 Unauthorized`).

---

## Linting y Formato

**Verificar linting con ESLint:**
```bash
npm run lint
```

**Corregir errores de linting automáticamente con ESLint:**
```bash
npm run lint:fix
```

**Verificar formato con Prettier:**
```bash
npm run format:check
```

**Aplicar formato automáticamente con Prettier:**
```bash
npm run format
```

> El linting y la verificación de formato se ejecutan automáticamente como **pre-commit hook** mediante `husky` + `lint-staged`, garantizando que ningún código mal formateado o con errores de linting llegue al repositorio.

---

## Estructura del Proyecto

```
nombre-del-repo/
├── src/
│   ├── config/
│   │   ├── swagger.js            # Configuración de swagger-jsdoc
│   │   └── logger.js             # Configuración de winston
│   ├── middlewares/
│   │   ├── cors.middleware.js    # Configuración restrictiva de CORS
│   │   ├── rateLimiter.middleware.js  # express-rate-limit (100 req/15min)
│   │   ├── jwtValidator.middleware.js # Verificación de token Bearer
│   │   ├── inputValidator.middleware.js # Sanitización con express-validator
│   │   └── accessLogger.middleware.js  # morgan + winston
│   ├── controllers/
│   │   └── hola.controller.js    # Lógica de negocio del endpoint GET /hola
│   ├── routes/
│   │   └── hola.routes.js        # Express Router: GET /hola
│   └── app.js                    # Inicialización de Express y middlewares globales
├── tests/
│   ├── unit/
│   │   ├── middlewares/
│   │   │   ├── cors.middleware.test.js
│   │   │   ├── rateLimiter.middleware.test.js
│   │   │   ├── jwtValidator.middleware.test.js
│   │   │   ├── inputValidator.middleware.test.js
│   │   │   └── accessLogger.middleware.test.js
│   │   └── controllers/
│   │       └── hola.controller.test.js
│   └── integration/
│       └── hola.routes.test.js   # Tests de integración GET /hola
├── .env                          # Variables de entorno locales (NO commitear)
├── .env.example                  # Plantilla de variables de entorno
├── .eslintrc.js                  # Configuración de ESLint
├── .gitignore                    # Incluye .env, node_modules, coverage/
├── .prettierrc                   # Configuración de Prettier
├── jest.config.js                # Configuración de Jest y umbrales de cobertura
├── package.json                  # Scripts, dependencias y metadatos del proyecto
├── package-lock.json
├── server.js                     # Entry point: arranca el servidor HTTP
└── README.md                     # Este archivo