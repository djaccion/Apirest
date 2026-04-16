# README.md - Validador de RUT Chileno

```markdown
# Validador de RUT Chileno

![Python](https://img.shields.io/badge/python-3.11%2B-blue?logo=python) ![License](https://img.shields.io/badge/license-MIT-green) ![Build](https://img.shields.io/badge/build-passing-brightgreen) ![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)

API RESTful con frontend desacoplado que valida el dígito verificador de RUTs chilenos usando el algoritmo módulo 11, permitiendo verificación en tiempo real sin recarga de página.

---

## Tabla de Contenidos

1. [Descripción](#1-descripción)
2. [Arquitectura](#2-arquitectura)
3. [Tecnologías](#3-tecnologías)
4. [Requisitos Previos](#4-requisitos-previos)
5. [Instalación](#5-instalación)
6. [Configuración](#6-configuración)
7. [Ejecución](#7-ejecución)
8. [Endpoints de la API](#8-endpoints-de-la-api)
9. [Seguridad](#9-seguridad)
10. [Testing](#10-testing)
11. [Estructura del Proyecto](#11-estructura-del-proyecto)
12. [Contribución](#12-contribución)
13. [Licencia](#13-licencia)

---

## 1. Descripción

El sistema resuelve el problema de validar el dígito verificador de un RUT chileno de forma programática y confiable. Implementa el algoritmo estándar módulo 11 definido por el Servicio de Registro Civil e Identificación de Chile, calculando el dígito verificador esperado a partir de los dígitos del cuerpo del RUT y comparándolo con el dígito proporcionado por el usuario.

La solución expone una API RESTful construida con Flask que acepta solicitudes JSON y retorna respuestas estructuradas indicando si el RUT es válido o no, junto con el RUT formateado correctamente. El frontend es un cliente HTML/JavaScript puro completamente desacoplado del backend, que consume la API de forma asíncrona mediante la Fetch API sin requerir ninguna recarga de página.

Los casos de uso principales incluyen: validación de RUT en formularios de registro de usuarios, verificación de identidad en sistemas de autenticación, integración en pipelines de procesamiento de datos que requieran validar RUTs chilenos en lote, y como microservicio reutilizable dentro de arquitecturas más grandes.

---

## 2. Arquitectura

El sistema implementa el patrón **Cliente-Servidor con API RESTful**, aplicando una separación de responsabilidades clara entre capas. La lógica de negocio reside exclusivamente en Python, la presentación en HTML/CSS y la comunicación asíncrona en JavaScript vanilla.

### Capas del Sistema

- **Capa de Presentación**: `index.html` con formulario reactivo, validación client-side y Fetch API para comunicación asíncrona con el backend. No depende de ningún framework JavaScript.
- **Capa de API**: Flask RESTful exponiendo el endpoint `POST /api/validate-rut` con respuestas JSON estandarizadas, headers de seguridad HTTP y control de CORS.
- **Capa de Lógica de Negocio**: Módulo Python puro que implementa el algoritmo de validación del dígito verificador chileno usando módulo 11, sin dependencias externas.
- **Capa de Auditoría**: Sistema de logging estructurado con `RotatingFileHandler` que registra intentos de validación inválidos, IPs de origen, timestamps y payloads recibidos.

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CICLO DE VALIDACIÓN                          │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │  Cliente     │
  │  HTML/JS     │
  │              │
  │ Usuario      │
  │ ingresa RUT  │
  └──────┬───────┘
         │
         │  POST /api/validate-rut
         │  Body: { "rut": "12345678-9" }
         │  Header: Content-Type: application/json
         ▼
  ┌──────────────┐
  │  Flask API   │
  │  Endpoint    │
  │              │
  │ Recibe JSON  │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────┐
  │  SANITIZACIÓN Y VALIDACIÓN   │
  │  DE FORMATO                  │
  │                              │
  │  Regex: ^[0-9]{7,8}-[0-9K]$ │
  └──────┬───────────────────────┘
         │
         ├─── FORMATO INVÁLIDO ──────────────────────────────────┐
         │                                                        │
         │                                               ┌────────▼───────┐
         │                                               │  AUDITORÍA     │
         │                                               │  LOGGING       │
         │                                               │                │
         │                                               │ Registra: IP,  │
         │                                               │ timestamp,     │
         │                                               │ payload        │
         │                                               └────────┬───────┘
         │                                                        │
         │                                               ┌────────▼───────┐
         │                                               │ Respuesta 400  │
         │                                               │ { valid: false,│
         │                                               │   message: ... │
         │                                               │ }              │
         │                                               └────────┬───────┘
         │                                                        │
         │ FORMATO VÁLIDO                                         │
         ▼                                                        │
  ┌──────────────────────────────┐                               │
  │  ALGORITMO MÓDULO 11         │                               │
  │                              │                               │
  │  1. Separar cuerpo y dígito  │                               │
  │  2. Multiplicar dígitos por  │                               │
  │     secuencia 2,3,4,5,6,7   │                               │
  │  3. Sumar productos          │                               │
  │  4. Resto = suma % 11        │                               │
  │  5. Calcular dígito esperado │                               │
  │  6. Comparar con dígito real │                               │
  └──────┬───────────────────────┘                               │
         │                                                        │
         ▼                                                        │
  ┌──────────────────────────────┐                               │
  │  RESPUESTA JSON              │                               │
  │                              │                               │
  │  {                           │                               │
  │    valid: true/false,        │                               │
  │    message: string,          │                               │
  │    rut_formateado: string    │                               │
  │  }                           │                               │
  └──────┬───────────────────────┘                               │
         │                                                        │
         ▼                                                        ▼
  ┌──────────────┐                                      ┌────────────────┐
  │  Cliente     │                                      │  Cliente       │
  │  HTML/JS     │                                      │  HTML/JS       │
  │              │                                      │                │
  │ Muestra      │                                      │ Muestra error  │
  │ resultado    │                                      │ de formato     │
  │ sin recarga  │                                      │ sin recarga    │
  └──────────────┘                                      └────────────────┘
```

---

## 3. Tecnologías

| Categoría    | Tecnología        | Versión Mínima |
|--------------|-------------------|----------------|
| Backend      | Python            | 3.11           |
| Backend      | Flask             | 3.0.0          |
| Backend      | Flask-Limiter     | 3.5.0          |
| Backend      | python-dotenv     | 1.0.0          |
| Frontend     | HTML              | HTML5          |
| Frontend     | CSS               | CSS3           |
| Frontend     | JavaScript        | ES6+           |
| Seguridad    | Flask-CORS        | 4.0.0          |
| Testing      | pytest            | 7.4.0          |
| Testing      | pytest-flask      | 1.3.0          |
| Herramientas | pip               | 23.0           |
| Herramientas | virtualenv / venv | nativo 3.11    |
| Herramientas | git               | 2.40           |

---

## 4. Requisitos Previos

Antes de instalar el proyecto, verificar que el entorno cumple con los siguientes requisitos:

**Python 3.11 o superior**
```bash
python --version
# Salida esperada: Python 3.11.x o superior
```

**pip**
```bash
pip --version
# Salida esperada: pip 23.x.x from .../site-packages/pip (python 3.11)
```

**venv (incluido en Python 3.11 nativo)**
```bash
python -m venv --help
# Salida esperada: usage: venv [-h] ... ENV_DIR [ENV_DIR ...]
```

**git**
```bash
git --version
# Salida esperada: git version 2.40.x o superior
```

> Se necesita acceso a una terminal con permisos de escritura en el directorio donde se clonará el proyecto. En sistemas Linux/Mac se recomienda no ejecutar como root. En Windows se recomienda usar PowerShell o Git Bash.

---

## 5. Instalación

Seguir los pasos en el orden indicado. No omitir ninguno.

**Paso 1: Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/validador-rut-chileno.git
```
> Reemplazar la URL por la URL real del repositorio.

**Paso 2: Ingresar al directorio del proyecto**
```bash
cd validador-rut-chileno
```

**Paso 3: Crear el entorno virtual**
```bash
python -m venv venv
```

**Paso 4: Activar el entorno virtual**

Linux / Mac:
```bash
source venv/bin/activate
```

Windows:
```bash
venv\Scripts\activate
```

> Al activarse correctamente, el prompt de la terminal mostrará el prefijo `(venv)` al inicio de la línea.

**Paso 5: Instalar las dependencias**
```bash
pip install -r requirements.txt
```

---

## 6. Configuración

La configuración sensible del sistema se gestiona mediante variables de entorno definidas en un archivo `.env` ubicado en la raíz del proyecto. Este mecanismo utiliza la librería `python-dotenv` para cargar las variables automáticamente al iniciar la aplicación.

El repositorio incluye el archivo `.env.example` como plantilla de referencia. Copiar ese archivo y renombrarlo como `.env` antes de ejecutar la aplicación:

```bash
cp .env.example .env
```

Luego editar el archivo `.env` con los valores correspondientes al entorno:

| Variable               | Descripción                                                        | Valor por Defecto          | Obligatoria |
|------------------------|--------------------------------------------------------------------|----------------------------|-------------|
| `FLASK_ENV`            | Entorno de ejecución de Flask (`development` o `production`)       | `development`              | Sí          |
| `FLASK_SECRET_KEY`     | Clave secreta para firma de sesiones y tokens internos de Flask    | Sin valor por defecto      | Sí          |
| `ALLOWED_ORIGINS`      | Lista de orígenes permitidos para CORS, separados por coma         | `http://localhost:5000`    | Sí          |
| `RATE_LIMIT_PER_MINUTE`| Número máximo de solicitudes permitidas por IP por minuto          | `30`                       | No          |
| `LOG_FILE_PATH`        | Ruta absoluta o relativa al archivo de log de auditoría            | `logs/audit.log`           | No          |
| `LOG_MAX_BYTES`        | Tamaño máximo en bytes del archivo de log antes de rotar           | `10485760` (10 MB)         | No          |
| `LOG_BACKUP_COUNT`     | Número de archivos de log de respaldo a conservar tras la rotación | `5`                        | No          |

> **⚠️ ADVERTENCIA: El archivo `.env` contiene información sensible como la clave secreta de Flask. Este archivo NUNCA debe subirse al repositorio. Ya está incluido en `.gitignore` para prevenir su exposición accidental. Verificar que `.gitignore` contenga la entrada `.env` antes de realizar cualquier commit.**

---

## 7. Ejecución

### Modo Desarrollo

Usar el servidor integrado de Flask con el flag de debug activado. Este modo habilita el recargador automático y el debugger interactivo.

```bash
flask run --debug
```

El servidor quedará disponible en:
```
http://localhost:5000
```

Verificar que el servidor está corriendo correctamente:
```bash
curl -X GET http://localhost:5000/
# Salida esperada: respuesta HTTP 200 con el HTML del frontend
```

### Modo Producción

> **⚠️ ADVERTENCIA: Nunca usar el servidor de desarrollo integrado de Flask (`flask run`) en un entorno de producción. No está diseñado para manejar carga concurrente ni ofrece las garantías de seguridad necesarias.**

En producción, usar **Gunicorn** como servidor WSGI de producción:

```bash
gunicorn --workers 4 --bind 0.0.0.0:8000 "app:create_app()"
```

- `--workers 4`: número de procesos worker (recomendado: `2 * núcleos_CPU + 1`)
- `--bind 0.0.0.0:8000`: escucha en todas las interfaces en el puerto 8000

Verificar que el servidor de producción está corriendo:
```bash
curl -X GET http://localhost:8000/
# Salida esperada: respuesta HTTP 200 con el HTML del frontend
```

---

## 8. Endpoints de la API

### POST /api/validate-rut

Valida el dígito verificador de un RUT chileno usando el algoritmo módulo 11. Acepta el RUT en formato `XXXXXXXX-D` donde `X` son los dígitos del cuerpo y `D` es el dígito verificador (0-9 o K).

**Headers requeridos**

| Header         | Valor              |
|----------------|--------------------|
| `Content-Type` | `application/json` |

**Body de la solicitud**

```json
{
  "rut": "12345678-9"
}
```

| Campo | Tipo   | Descripción                                                  | Ejemplo        |
|-------|--------|--------------------------------------------------------------|----------------|
| `rut` | string | RUT chileno en formato `CUERPO-DIGITO`, sin puntos de miles  | `"12345678-9"` |

**Respuestas posibles**

| Código HTTP | Condición                                      | Ejemplo de Body de Respuesta |
|-------------|------------------------------------------------|------------------------------|
| `200`       | RUT con formato válido y dígito verificador correcto | Ver ejemplo abajo      |
| `200`       | RUT con formato válido pero dígito verificador incorrecto | Ver ejemplo abajo   |
| `400`       | Formato de RUT inválido o campo ausente        | Ver ejemplo abajo            |
| `429`       | Límite de solicitudes por minuto excedido      | Ver ejemplo abajo            |
| `500`       | Error interno del servidor                     | Ver ejemplo abajo            |

**200 — RUT válido**
```json
{
  "valid": true,
  "message": "RUT válido",
  "rut_formateado": "12.345.678-9"
}
```

**200 — RUT inválido (dígito verificador incorrecto)**
```json
{
  "valid": false,
  "message": "El dígito verificador es incorrecto",
  "rut_formateado": "12.345.678-9"
}
```

**400 — Formato inválido**
```json
{
  "valid": false,
  "message": "Formato de RUT inválido. Use el formato XXXXXXXX-D (sin puntos, con guion)",
  "rut_formateado": null
}
```

**429 — Rate limit excedido**
```json
{
  "valid": false,
  "message": "Demasiadas solicitudes. Por favor espere antes de intentar nuevamente.",
  "rut_formateado": null
}
```

**500 — Error interno**
```json
{
  "valid": false,
  "message": "Error interno del servidor. Por favor intente más tarde.",
  "rut_formateado": null
}
```

**Ejemplo de uso con curl**
```bash
curl -X POST http://localhost:5000/api/validate-rut \
  -H "Content-Type: application/json" \
  -d '{"rut": "12345678-9"}'
```

**Ejemplo de uso con JavaScript Fetch API**
```javascript
const response = await fetch('http://localhost:5000/api/validate-rut', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ rut: '12345678-9' })
});

const data = await response.json();
console.log(data.valid);          // true o false
console.log(data.message);        // mensaje descriptivo
console.log(data.rut_formateado); // "12.345.678-9"
```

---

## 9. Seguridad

El sistema implementa un enfoque **DevSecOps** donde la seguridad es parte integral del diseño, no un añadido posterior.

| Medida de Seguridad             | Propósito Técnico                                                                                                                                                  |
|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Sanitización de entrada**     | Regex estricto `^[0-9]{7,8}-[0-9K]$` aplicado antes de cualquier procesamiento. Rechaza caracteres no permitidos para prevenir inyecciones y entradas malformadas. |
| **Protección XSS**              | Escape automático de salidas en templates Jinja2 y header `Content-Security-Policy` que restringe fuentes de scripts, estilos e imágenes a orígenes confiables.    |
| **Rate Limiting**               | Flask-Limiter restringe el número de solicitudes por IP por minuto (configurable via `RATE_LIMIT_PER_MINUTE`). Previene abuso, scraping y ataques de fuerza bruta. |
| **CORS controlado**             | Flask-CORS configurado para aceptar solicitudes únicamente desde los orígenes definidos en `ALLOWED_ORIGINS`. Bloquea solicitudes cross-origin no autorizadas.     |
| **Logging de seguridad**        | Registro estructurado de cada intento de validación inválido incluyendo IP de origen, timestamp UTC, payload recibido y motivo del rechazo en archivo rotativo.    |
| **Variables de entorno**        | Toda configuración sensible (claves, orígenes, rutas) se gestiona via `.env` con `python-dotenv`. Ningún secreto está hardcodeado en el código fuente.             |
| **Headers de seguridad HTTP**   | Se añaden los headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Strict-Transport-Security` en cada respuesta para mitigar ataques comunes.    |
| **Entorno virtual aislado**     | Las dependencias se instalan en un entorno virtual Python aislado, evitando conflictos y reduciendo la superficie de ataque por dependencias del sistema global.   |

---

## 10. Testing

El proyecto usa **pytest** y **pytest-flask** para tests unitarios e de integración. Los tests cubren el algoritmo de validación, el endpoint de la API, los casos borde y los mecanismos de seguridad.

**Ejecutar todos los tests**
```bash
pytest
```

**Ejecutar tests con reporte de cobertura**
```bash
pytest --cov=app --cov-report=term-missing
```

**Ejecutar solo los tests unitarios del algoritmo**
```bash
pytest tests/test_rut_validator.py -v
```

**Ejecutar solo los tests de integración del endpoint**
```bash
pytest tests/test_api.py -v
```

**Ejecutar tests con salida detallada**
```bash
pytest -v --tb=short
```

Los tests están organizados en las siguientes categorías:

| Archivo de Test           | Qué cubre                                                                 |
|---------------------------|---------------------------------------------------------------------------|
| `tests/test_rut_validator.py` | Algoritmo módulo 11: RUTs válidos, inválidos, casos borde (dígito K, cuerpo mínimo) |
| `tests/test_api.py`           | Endpoint POST: respuestas 200, 400, 429, headers de seguridad, CORS      |
| `tests/test_sanitization.py`  | Sanitización de entrada: caracteres especiales, SQL injection, XSS payloads |
| `tests/test_logging.py`       | Auditoría: verificar que los intentos inválidos quedan registrados        |

---

## 11. Estructura del Proyecto

```
validador-rut-chileno/
│
├── app/
│   ├── __init__.py              # Factory function create_app(), inicialización de extensiones
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py            # Blueprint con endpoint POST /api/validate-rut
│   ├── core/
│   │   ├── __init__.py
│   │   └── rut_validator.py     # Algoritmo módulo 11, sanitización, formateo
│   ├── security/
│   │   ├── __init__.py
│   │   └── headers.py           # Configuración de headers HTTP de seguridad
│   └── audit/
│       ├── __init__.py
│       └── logger.py            # Configuración de RotatingFileHandler y logging estructurado
│
├── static/
│   ├── css/
│   │   └── styles.css           # Estilos CSS3 responsivos del frontend
│   └── js/
│       └── main.js              # Lógica JavaScript ES6+, Fetch API, manejo de UI
│
├── templates/
│   └── index.html               # Template HTML5 con formulario de validación
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures de pytest-flask: app de test, cliente HTTP
│   ├── test_rut_validator.py    # Tests unitarios del algoritmo de validación
│   ├── test_api.py              # Tests de integración del endpoint REST
│   ├── test_sanitization.py     # Tests de sanitización y seguridad de entrada
│   └── test_logging.py          # Tests del sistema de auditoría
│
├── logs/                        # Directorio de logs (generado automáticamente, en .gitignore)
│   └── audit.log
│
├── .env                         # Variables de entorno locales (NO subir al repo, en .gitignore)
├── .env.example                 # Plantilla de variables de entorno (sí se versiona)
├── .gitignore                   # Archivos y directorios excluidos del control de versiones
├── requirements.txt             # Dependencias Python del proyecto con versiones fijadas
├── requirements-dev.txt         # Dependencias adicionales para desarrollo y testing
├── wsgi.py                      # Punto de entrada WSGI para Gunicorn en producción
└── README.md                    # Este archivo
```

---

## 12. Contribución

Las contribuciones son bienvenidas. Seguir el siguiente proceso para mantener la calidad del código:

**1. Hacer fork del repositorio**
```bash
git clone https://github.com/tu-usuario/validador-rut-chileno.git
```

**2. Crear una rama descriptiva para la funcionalidad o corrección**
```bash
git checkout -b feature/nombre-descriptivo-de-la-funcionalidad
# o para correcciones:
git checkout -b fix/descripcion-del-bug
```

**3. Realizar los cambios y asegurar que los tests pasan**
```bash
pytest --cov=app --cov-report=term-missing
```

**4. Verificar que la cobertura de tests no disminuye respecto a la rama principal**

**5. Hacer commit con mensajes descriptivos siguiendo Conventional Commits**
```bash
git commit -m "feat: agregar soporte para validación de RUTs con puntos de miles"
git commit -m "fix: corregir cálculo del dígito verificador para RUTs de 7 dígitos"
git commit -m "test: agregar casos borde para dígito verificador K"
```

**6. Hacer push de la rama y abrir un Pull Request**
```bash
git push origin feature/nombre-descriptivo-de-la-funcionalidad
```

**Estándares de código a respetar:**
- Seguir PEP 8 para código Python
- Documentar funciones públicas con docstrings
- Todo nuevo código debe tener tests asociados
- No reducir la cobertura de tests por debajo del 90%
- No incluir credenciales, claves ni datos sensibles en ningún commit

---

## 13. Licencia

Este proyecto está distribuido bajo la **Licencia MIT**.

```
MIT License

Copyright (c) 2024 Validador de RUT Chileno

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Ver el archivo [LICENSE](LICENSE) para el texto completo.