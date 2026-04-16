# API de Validación de RUT Chileno - Documentación Técnica

**Versión:** v1.0.0
**Fecha de última actualización:** 2024-01-15
**Estado:** Estable
**Equipo responsable:** Equipo de Desarrollo Backend

---

## 1. Descripción General

La API expone un único endpoint RESTful diseñado para validar RUTs chilenos mediante la implementación del algoritmo módulo 11 estándar, que es el método oficial utilizado en Chile para verificar la autenticidad matemática de un Rol Único Tributario. El servicio recibe un RUT en formato string, aplica un proceso de sanitización y normalización, ejecuta el algoritmo de validación y retorna el resultado de forma inmediata.

El servicio está protegido con **rate limiting** para prevenir abuso y ataques de fuerza bruta, **CORS controlado** que restringe el acceso únicamente a orígenes explícitamente autorizados, y **headers de seguridad HTTP** que protegen tanto al servidor como a los clientes que consumen la API. Todas las respuestas de la API, tanto exitosas como de error, utilizan una **estructura JSON estandarizada** que garantiza consistencia y facilita la integración con cualquier cliente.

---

## 2. URL Base y Entornos

| Entorno | URL Base | Protocolo |
|---|---|---|
| Local (desarrollo) | `http://localhost:5000` | HTTP |
| Staging | `https://staging.api.validarut.cl` | HTTPS |
| Producción | `https://api.validarut.cl` | HTTPS exclusivo |

> **Importante:** El entorno de producción utiliza exclusivamente HTTPS. Cualquier intento de conexión mediante HTTP será rechazado o redirigido. El header `Strict-Transport-Security` estará activo en producción, instruyendo a los navegadores y clientes HTTP a recordar que este dominio solo debe ser accedido mediante conexiones seguras durante el período de tiempo configurado (mínimo 1 año).

---

## 3. Autenticación y Seguridad

La versión actual de la API **no requiere token de autenticación**. Sin embargo, el consumidor debe conocer y respetar las siguientes restricciones de seguridad que están activas en todos los entornos:

### 3.1 Rate Limiting

El servicio aplica un límite de **10 peticiones por minuto por dirección IP**. Este límite está configurado mediante Flask-Limiter y se aplica de forma independiente por cada IP de origen.

Cuando una IP supera el límite permitido, el servidor retorna una respuesta **HTTP 429 Too Many Requests**. El header `Retry-After` estará presente en la respuesta, indicando el número de segundos que el cliente debe esperar antes de realizar una nueva petición. Se recomienda implementar lógica de backoff exponencial en los clientes que consuman esta API de forma intensiva.

### 3.2 CORS (Cross-Origin Resource Sharing)

Solo los orígenes explícitamente configurados en las variables de entorno del servidor están autorizados para consumir la API. Las peticiones provenientes de orígenes no autorizados serán bloqueadas a nivel de preflight (petición OPTIONS), antes de que el servidor procese cualquier dato. El cliente recibirá un error de CORS sin respuesta de datos. Para solicitar la inclusión de un nuevo origen autorizado, contactar al equipo responsable.

### 3.3 Headers de Seguridad HTTP

Cada respuesta de la API incluirá los siguientes headers de seguridad:

| Header | Valor | Propósito |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Previene que el navegador intente inferir o cambiar el tipo MIME declarado por el servidor, mitigando ataques de MIME sniffing. |
| `X-Frame-Options` | `DENY` | Impide que la respuesta sea embebida dentro de un `<iframe>`, protegiendo contra ataques de clickjacking. |
| `Content-Security-Policy` | Configurado por entorno | Define las fuentes de contenido permitidas, reduciendo la superficie de ataque ante inyecciones XSS y carga de recursos maliciosos. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Instruye al cliente a utilizar exclusivamente HTTPS para todas las comunicaciones futuras con este dominio durante el período especificado. Activo únicamente en producción. |

---

## 4. Endpoint Principal

### POST /api/validate-rut

#### 4.1 Descripción Funcional

Este endpoint recibe un RUT chileno en formato string, aplica un proceso de sanitización mediante regex estricto que elimina o rechaza cualquier carácter no permitido, ejecuta el algoritmo de validación módulo 11 sobre el cuerpo numérico del RUT y retorna el resultado de la validación. La respuesta incluye un campo booleano indicando si el RUT es matemáticamente válido, un mensaje legible para el usuario final y el RUT normalizado con el formato estándar chileno (con puntos de miles y guion antes del dígito verificador).

---

#### 4.2 Detalles Técnicos del Request

**Método HTTP:** `POST`

**Content-Type requerido:** `application/json`

**Parámetros del Body (JSON):**

| Campo | Tipo | Requerido | Descripción | Ejemplo de valor válido | Restricciones de formato |
|---|---|---|---|---|---|
| `rut` | `string` | Sí | RUT chileno a validar. Se acepta con o sin puntos de miles, pero debe incluir el guion separador antes del dígito verificador. El dígito verificador puede ser un número del 0 al 9 o la letra K (mayúscula o minúscula). | `"12345678-9"` | Solo se permiten dígitos (0-9), puntos (.) y un guion (-). El regex de sanitización aceptado es: `^[0-9]+-[0-9kK]$` (después de eliminar puntos). No se permiten espacios, caracteres especiales, letras adicionales ni múltiples guiones. |

---

#### 4.3 Ejemplo de Request

```bash
curl -X POST http://localhost:5000/api/validate-rut \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"rut": "12345678-9"}'
```

---

#### 4.4 Estructura de Respuesta Exitosa (HTTP 200)

Se retorna cuando el campo `rut` está presente, tiene un formato válido según el regex de sanitización y el servidor pudo ejecutar el algoritmo de validación correctamente. El resultado de validación puede ser `true` o `false` dependiendo de si el dígito verificador es matemáticamente correcto.

| Campo | Tipo | Descripción |
|---|---|---|
| `valid` | `boolean` | Indica si el RUT es matemáticamente correcto según el algoritmo módulo 11. `true` significa que el dígito verificador coincide con el calculado. `false` significa que el RUT tiene un dígito verificador incorrecto. |
| `message` | `string` | Mensaje legible para el usuario final describiendo el resultado de la validación. Puede ser mostrado directamente en interfaces de usuario. |
| `rut_formateado` | `string` | RUT normalizado con el formato estándar chileno: puntos de miles en el cuerpo numérico y guion antes del dígito verificador. Ejemplo: `12.345.678-9`. |

**Ejemplo con RUT válido:**

```json
{
  "valid": true,
  "message": "El RUT 12.345.678-9 es válido.",
  "rut_formateado": "12.345.678-9"
}
```

**Ejemplo con RUT inválido (dígito verificador incorrecto):**

```json
{
  "valid": false,
  "message": "El RUT 12.345.678-3 no es válido. El dígito verificador no corresponde.",
  "rut_formateado": "12.345.678-3"
}
```

---

#### 4.5 Estructura de Respuesta de Error de Formato (HTTP 400)

Se retorna cuando el campo `rut` está ausente en el body, se envía vacío, contiene únicamente espacios en blanco, o incluye caracteres no permitidos por el regex de sanitización (como letras en el cuerpo numérico, caracteres especiales, múltiples guiones o formatos completamente inválidos). Este error ocurre **antes** de ejecutar el algoritmo de validación, durante la fase de sanitización de entrada.

```json
{
  "valid": false,
  "message": "Formato de RUT inválido. El RUT debe contener solo dígitos y un guion separador antes del dígito verificador. Ejemplo: 12345678-9.",
  "rut_formateado": null
}
```

---

#### 4.6 Estructura de Respuesta Rate Limit Excedido (HTTP 429)

Se retorna cuando la dirección IP del cliente ha superado el límite de 10 peticiones por minuto configurado en Flask-Limiter. El header `Retry-After` estará presente en la respuesta HTTP indicando el número de segundos que el cliente debe esperar antes de realizar una nueva petición.

**Header de respuesta incluido:**
```
Retry-After: 45
```

**Body de respuesta:**

```json
{
  "valid": false,
  "message": "Has excedido el límite de peticiones permitidas. Por favor, espera antes de realizar una nueva consulta.",
  "rut_formateado": null
}
```

---

#### 4.7 Estructura de Respuesta Error Interno (HTTP 500)

Se retorna cuando ocurre un error inesperado en el servidor durante el procesamiento de la petición. Por razones de seguridad, el detalle técnico del error **no se expone al cliente** en ningún caso, evitando la filtración de información sensible sobre la infraestructura o el código fuente. El error completo, incluyendo stack trace, timestamp, IP de origen y payload recibido, queda registrado automáticamente en el sistema de logging de auditoría con rotación de archivos para su análisis posterior por el equipo técnico.

```json
{
  "valid": false,
  "message": "Ha ocurrido un error interno en el servidor. Por favor, intenta nuevamente más tarde.",
  "rut_formateado": null
}
```

---

## 5. Algoritmo de Validación

El algoritmo utilizado es el **módulo 11 estándar**, que es el método oficial definido por el Servicio de Registro Civil e Identificación de Chile para calcular y verificar el dígito verificador de un RUT. A continuación se describe el proceso paso a paso:

**Paso 1: Separación del cuerpo y el dígito verificador**

El RUT se divide en dos partes utilizando el guion como delimitador. La parte izquierda del guion corresponde al **cuerpo numérico** (la secuencia de dígitos que identifica al titular). La parte derecha del guion corresponde al **dígito verificador** (un único carácter que puede ser un número del 0 al 9 o la letra K). Ambas partes se procesan de forma independiente.

**Paso 2: Multiplicación de dígitos por la secuencia cíclica**

Se recorren los dígitos del cuerpo numérico de **derecha a izquierda**, es decir, comenzando desde el dígito de las unidades hacia el dígito de mayor orden. Cada dígito se multiplica por un factor de la secuencia cíclica **2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7...** El primer dígito (el más a la derecha) se multiplica por 2, el segundo por 3, el tercero por 4, y así sucesivamente. Cuando la secuencia llega al factor 7, vuelve a comenzar desde 2 de forma cíclica.

**Paso 3: Suma de los productos**

Se suman todos los productos obtenidos en el paso anterior para obtener un único valor numérico total.

**Paso 4: Cálculo del resto**

Se calcula el **resto de la división entera** del total obtenido en el paso anterior entre el número 11. Este resto será siempre un valor entre 0 y 10.

**Paso 5: Conversión del resto al dígito verificador esperado**

El resto obtenido se convierte al dígito verificador esperado según la siguiente tabla de conversión:

| Resto de la división | Dígito verificador esperado |
|---|---|
| 0 | `0` |
| 1 | `K` |
| 2 | `9` |
| 3 | `8` |
| 4 | `7` |
| 5 | `6` |
| 6 | `5` |
| 7 | `4` |
| 8 | `3` |
| 9 | `2` |
| 10 | `1` |

La regla general es: si el resto es 0, el dígito verificador es `0`; si el resto es 1, el dígito verificador es `K`; para cualquier otro resto, el dígito verificador es el resultado de restar el resto a 11.

**Paso 6: Comparación y resultado**

El dígito verificador calculado en el paso anterior se compara con el dígito verificador proporcionado en el RUT original (la parte derecha del guion). Si ambos coinciden, el RUT es **matemáticamente válido**. Si no coinciden, el RUT es **inválido**, lo que puede indicar un error tipográfico o un RUT inexistente. La comparación es insensible a mayúsculas y minúsculas para el caso del dígito verificador `K`.

---

## 6. Logging y Auditoría

El sistema registra automáticamente eventos relevantes para la seguridad y el monitoreo operacional. Los logs se almacenan en archivos rotativos que se gestionan mediante `RotatingFileHandler`, garantizando que el almacenamiento en disco no crezca de forma ilimitada.

Los eventos registrados incluyen:

- **Intentos con formato inválido:** Se registra la dirección IP de origen, el timestamp de la petición, el payload recibido (sanitizado para evitar almacenar datos sensibles en crudo) y el motivo del rechazo.
- **Errores internos del servidor:** Se registra el stack trace completo, la IP de origen, el timestamp y cualquier información de contexto disponible para facilitar el diagnóstico.
- **Eventos de rate limiting:** Se registra la IP bloqueada y el timestamp del bloqueo.

> **Nota de privacidad:** Los logs de auditoría pueden contener direcciones IP, que son consideradas datos personales en algunas jurisdicciones. El equipo responsable debe asegurar que el almacenamiento y retención de estos logs cumpla con la normativa de privacidad aplicable.

---

## 7. Códigos de Estado HTTP Resumidos

| Código HTTP | Significado | Cuándo ocurre |
|---|---|---|
| `200 OK` | Petición procesada correctamente | El RUT tiene formato válido y el algoritmo se ejecutó sin errores. El campo `valid` indica si el RUT es correcto o no. |
| `400 Bad Request` | Error en el formato del input | El campo `rut` está ausente, vacío o contiene caracteres no permitidos. |
| `429 Too Many Requests` | Límite de peticiones excedido | La IP ha superado el límite de 10 peticiones por minuto. |
| `500 Internal Server Error` | Error interno del servidor | Error inesperado durante el procesamiento. El detalle queda en los logs de auditoría. |

---

## 8. Ejemplos de Integración

### JavaScript (Fetch API)

```javascript
async function validarRut(rut) {
  try {
    const response = await fetch('http://localhost:5000/api/validate-rut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ rut: rut })
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.warn(`Límite excedido. Reintentar en ${retryAfter} segundos.`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al conectar con la API:', error);
    return null;
  }
}
```

### Python (requests)

```python
import requests

def validar_rut(rut: str) -> dict:
    url = "http://localhost:5000/api/validate-rut"
    payload = {"rut": rut}
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers, timeout=10)

    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After", "desconocido")
        print(f"Límite excedido. Reintentar en {retry_after} segundos.")
        return {}

    return response.json()
```

---

## 9. Variables de Entorno Requeridas

El servidor requiere las siguientes variables de entorno para su correcto funcionamiento. Se recomienda utilizar un archivo `.env` en entornos de desarrollo y variables de entorno del sistema operativo o un gestor de secretos en producción.

| Variable | Descripción | Ejemplo de valor |
|---|---|---|
| `FLASK_ENV` | Entorno de ejecución de Flask | `production` |
| `SECRET_KEY` | Clave secreta de Flask para sesiones y CSRF | Cadena aleatoria de mínimo 32 caracteres |
| `ALLOWED_ORIGINS` | Lista de orígenes CORS autorizados separados por coma | `https://app.ejemplo.cl,https://www.ejemplo.cl` |
| `RATE_LIMIT` | Límite de peticiones configurado en Flask-Limiter | `10 per minute` |
| `LOG_FILE_PATH` | Ruta del archivo de log de auditoría | `/var/log/validarut/audit.log` |
| `LOG_MAX_BYTES` | Tamaño máximo del archivo de log antes de rotar | `10485760` (10 MB) |
| `LOG_BACKUP_COUNT` | Número de archivos de log rotados a conservar | `5` |

> **Advertencia de seguridad:** Nunca incluir el archivo `.env` en el repositorio de control de versiones. Asegurarse de que `.env` esté listado en el archivo `.gitignore` del proyecto.

---

## 10. Changelog

| Versión | Fecha | Cambios |
|---|---|---|
| v1.0.0 | 2024-01-15 | Versión inicial estable. Endpoint POST /api/validate-rut con algoritmo módulo 11, rate limiting, CORS y headers de seguridad. |