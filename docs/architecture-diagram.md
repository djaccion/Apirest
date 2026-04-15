# Diagrama de Arquitectura — Hola TSOFT

| Metadato | Valor |
|---|---|
| Versión | 1.0.0 |
| Fecha de creación | 2025-01-31 |
| Autor técnico responsable | Equipo de Desarrollo TSOFT |
| Estado del documento | Draft |

---

## Resumen Ejecutivo de la Arquitectura

Hola TSOFT es una aplicación web estática de página única (SPA-lite) que muestra saludos coloquiales representativos de cada país donde TSOFT tiene presencia. No utiliza frameworks ni librerías externas, lo que garantiza tiempos de carga mínimos y una superficie de ataque reducida. El sistema está construido íntegramente con HTML5, CSS3 y JavaScript vanilla, priorizando la seguridad, el bajo mantenimiento y la facilidad de extensión para incorporar nuevos países sin modificar la estructura base.

---

## Diagrama de Árbol de Archivos

```
hola-tsoft/                          # Raíz del proyecto
├── index.html                       # Punto de entrada único, estructura semántica HTML5 y meta CSP
├── .htaccess                        # Configuración Apache: headers de seguridad y HTTPS redirect
├── README.md                        # Documentación de uso, instalación y despliegue para desarrolladores
├── SECURITY.md                      # Política de seguridad, vulnerabilidades conocidas y contacto
├── deploy-config.yml                # Configuración de pipeline CI/CD y parámetros de despliegue
├── src/                             # Código fuente de la aplicación
│   ├── js/                          # Módulos JavaScript de lógica y datos
│   │   ├── app.js                   # Motor de renderizado: lee datos, construye DOM, gestiona eventos
│   │   └── greetings-data.js        # Objeto de configuración i18n con los datos de saludos por país
│   └── css/                         # Hojas de estilo de la aplicación
│       └── styles.css               # Estilos globales, Custom Properties, Grid, Flexbox y responsive
├── assets/                          # Recursos estáticos del proyecto
│   └── flags/                       # Imágenes de banderas por país (formato SVG o PNG)
│       ├── mx.svg                   # Bandera México
│       ├── co.svg                   # Bandera Colombia
│       ├── ar.svg                   # Bandera Argentina
│       ├── cl.svg                   # Bandera Chile
│       ├── pe.svg                   # Bandera Perú
│       ├── ec.svg                   # Bandera Ecuador
│       ├── ve.svg                   # Bandera Venezuela
│       ├── es.svg                   # Bandera España
│       └── us.svg                   # Bandera USA (comunidad hispana)
└── docs/                            # Documentación técnica del proyecto
    └── architecture-diagram.md      # Este archivo: diagrama y descripción de la arquitectura completa
```

---

## Diagrama de Capas de la Arquitectura

```
╔══════════════════════════════════════════════════════════════════╗
║                   CAPA DE PRESENTACIÓN                          ║
║              index.html  +  src/css/styles.css                  ║
║                                                                  ║
║  • Estructura semántica HTML5 (header, main, section, article)  ║
║  • CSS Custom Properties (variables de color, tipografía)       ║
║  • Layout con CSS Grid (grid de tarjetas por país)              ║
║  • Flexbox para alineación interna de componentes               ║
║  • Mobile-first: breakpoints 320px / 768px / 1024px             ║
║  • Meta tag Content Security Policy (CSP)                       ║
║  • Sin lógica de negocio ni manipulación de datos               ║
╚══════════════════════════════════════════════════════════════════╝
                              ▲
                              │  Eventos de usuario (click, change)
                              │  fluyen hacia arriba
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════╗
║                     CAPA DE LÓGICA                              ║
║                      src/js/app.js                              ║
║                                                                  ║
║  • Escucha el evento DOMContentLoaded para inicializar          ║
║  • Lee el objeto de datos desde greetings-data.js               ║
║  • Itera sobre el array de países y genera nodos DOM            ║
║  • Usa textContent exclusivamente (nunca innerHTML)             ║
║  • Gestiona el evento de cambio de idioma ES / EN               ║
║  • Aplica el idioma activo y re-renderiza las tarjetas          ║
║  • Inserta nodos en el contenedor grid del HTML                 ║
╚══════════════════════════════════════════════════════════════════╝
                              │
                              │  Lectura unidireccional de datos
                              │  (descendente, solo lectura)
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════╗
║                     CAPA DE DATOS                               ║
║                  src/js/greetings-data.js                       ║
║                                                                  ║
║  • Objeto de configuración i18n exportado como módulo ES6       ║
║  • Array de 9 registros de países con estructura uniforme       ║
║  • Campos bilingües (es / en) para nombre del país y saludo     ║
║  • Código ISO 3166-1 alpha-2 como identificador único           ║
║  • Emoji de bandera unicode por país                            ║
║  • Nota coloquial descriptiva del registro lingüístico          ║
║  • Solo datos: sin lógica, sin efectos secundarios              ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Diagrama de Flujo de Renderizado

```
        ┌─────────────────────────────────┐
        │   Usuario abre el navegador     │
        │   y solicita index.html         │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   El navegador parsea HTML5     │
        │   y carga styles.css y app.js   │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Se dispara el evento          │
        │   DOMContentLoaded en app.js    │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   app.js importa y lee el       │
        │   objeto de datos desde         │
        │   greetings-data.js             │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Se obtiene el idioma activo   │
        │   por defecto: ES               │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Iteración sobre el array      │
        │   de 9 países (forEach)         │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Por cada país: crear nodo     │
        │   article con textContent       │
        │   (flagEmoji, nombre, saludo)   │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Insertar nodo article en el   │
        │   contenedor grid del DOM       │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   Tarjetas de saludos visibles  │
        │   en pantalla para el usuario   │
        └────────────────┬────────────────┘
                         │
                         ▼
                ◇─────────────────────◇
                ◇  ¿El usuario cambia  ◇
                ◇  el idioma ES / EN?  ◇
                ◇─────────────────────◇
                    │           │
                   SÍ          NO
                    │           │
                    ▼           ▼
        ┌───────────────┐   ┌──────────────────┐
        │ Se actualiza  │   │ El sistema queda │
        │ el idioma     │   │ en espera de     │
        │ activo y se   │   │ interacción del  │
        │ re-renderizan │   │ usuario          │
        │ las tarjetas  │   └──────────────────┘
        │ con textContent│
        └───────┬───────┘
                │
                └──────────────────────┐
                                       ▼
                          (Vuelve al paso de iteración
                           sobre el array de países
                           con el nuevo idioma activo)
```

---

## Mapa de Dependencias entre Archivos

| Archivo Origen | Archivo Destino | Tipo de Dependencia |
|---|---|---|
| index.html | src/js/app.js | script module (`<script type="module">`) |
| index.html | src/css/styles.css | stylesheet link (`<link rel="stylesheet">`) |
| src/js/app.js | src/js/greetings-data.js | ES6 import (`import { greetings } from`) |
| src/js/app.js | index.html | DOM query (`document.querySelector`, `document.getElementById`) |

> **Nota:** El proyecto no tiene dependencias externas de ningún tipo. No se utilizan CDNs, librerías de terceros, frameworks ni gestores de paquetes en tiempo de ejecución. Todas las dependencias son internas al repositorio.

---

## Arquitectura de Seguridad

### 7.1 Diagrama de Capas de Defensa

```
  ╔══════════════════════════════════════════════════════════════╗
  ║          CAPA EXTERIOR — Transporte y Servidor              ║
  ║                  Archivo: .htaccess                         ║
  ║                                                              ║
  ║  • HTTPS obligatorio (redirect 301 de HTTP a HTTPS)         ║
  ║  • HSTS: Strict-Transport-Security max-age=31536000         ║
  ║  • X-Frame-Options: DENY (previene embedding en iframes)    ║
  ║  • X-Content-Type-Options: nosniff                          ║
  ╚══════════════════════════════════════════════════════════════╝
                              │
                              ▼
  ╔══════════════════════════════════════════════════════════════╗
  ║          CAPA MEDIA — Política de Contenido                 ║
  ║                  Archivo: index.html                        ║
  ║                                                              ║
  ║  • Content Security Policy via meta tag                     ║
  ║  • default-src 'self'                                       ║
  ║  • script-src 'self'  (bloquea scripts inline y externos)   ║
  ║  • style-src 'self'   (bloquea estilos inline y externos)   ║
  ║  • img-src 'self' data: (permite solo imágenes locales)     ║
  ╚══════════════════════════════════════════════════════════════╝
                              │
                              ▼
  ╔══════════════════════════════════════════════════════════════╗
  ║          CAPA INTERNA — Sanitización en JavaScript          ║
  ║                  Archivo: src/js/app.js                     ║
  ║                                                              ║
  ║  • Uso exclusivo de textContent para insertar datos         ║
  ║  • Prohibición explícita de innerHTML con datos dinámicos   ║
  ║  • Sin uso de eval(), document.write() ni Function()        ║
  ║  • Sin manipulación de URLs externas ni fetch a APIs        ║
  ╚══════════════════════════════════════════════════════════════╝
                              │
                              ▼
  ╔══════════════════════════════════════════════════════════════╗
  ║          CAPA NÚCLEO — Ausencia de Almacenamiento           ║
  ║              Archivo: src/js/app.js (por omisión)           ║
  ║                                                              ║
  ║  • Sin uso de localStorage ni sessionStorage                ║
  ║  • Sin cookies de ningún tipo                               ║
  ║  • Sin datos de usuario almacenados en cliente              ║
  ║  • Sin peticiones de red en tiempo de ejecución             ║
  ╚══════════════════════════════════════════════════════════════╝
```

### 7.2 Tabla de Amenazas Mitigadas

| Amenaza | Vector de Ataque | Mitigación Implementada | Archivo Responsable |
|---|---|---|---|
| XSS (Cross-Site Scripting) | Inyección de scripts maliciosos a través de datos renderizados en el DOM | Uso exclusivo de `textContent` para insertar contenido dinámico; CSP bloquea scripts no autorizados | `src/js/app.js`, `index.html` |
| Clickjacking | Embebido de la página en un iframe malicioso para engañar al usuario | Header `X-Frame-Options: DENY` que impide que la página sea cargada en cualquier iframe | `.htaccess` |
| MIME Sniffing | El navegador interpreta un archivo con un tipo MIME diferente al declarado, ejecutando contenido malicioso | Header `X-Content-Type-Options: nosniff` que fuerza al navegador a respetar el Content-Type declarado | `.htaccess` |
| Code Injection | Ejecución de código arbitrario mediante `eval()`, `Function()` o `document.write()` | Prohibición explícita de estas APIs en el código; CSP con `script-src 'self'` bloquea scripts inline | `src/js/app.js`, `index.html` |

---

## Modelo de Datos

```javascript
// Esquema tipado del objeto exportado por greetings-data.js
// Total de registros en el objeto inicial: 9 países

{
  greetings: [                      // Array principal — contiene todos los registros de países

    {
      countryCode: String,          // Código ISO 3166-1 alpha-2 del país (ej: "mx", "co", "ar")
                                    // Usado como identificador único y para referenciar banderas en /assets/flags/

      countryName: {                // Objeto bilingüe con el nombre oficial del país
        es: String,                 // Nombre del país en español (ej: "México")
        en: String                  // Nombre del país en inglés (ej: "Mexico")
      },

      flagEmoji: String,            // Carácter unicode de la bandera del país (ej: "🇲🇽")
                                    // Alternativa ligera a imágenes para renderizado rápido

      greeting: {                   // Objeto bilingüe con el saludo coloquial representativo
        es: String,                 // Saludo en español con expresión coloquial local (ej: "¡Qué onda!")
        en: String                  // Traducción o equivalente del saludo en inglés
      },

      coloquialNote: String         // Descripción textual del registro lingüístico y contexto cultural
                                    // del saludo (ej: "Expresión informal del centro de México,
                                    // equivalente a '¿Qué tal?' o '¿Cómo estás?'")
    }

    // ... 8 registros adicionales con la misma estructura
    // Países incluidos en v1.0.0: México, Colombia, Argentina, Chile,
    // Perú, Ecuador, Venezuela, España, USA (comunidad hispana)
  ]
}
```

---

## Estrategia de Escalabilidad

Para agregar un nuevo país al sistema, el desarrollador debe seguir exactamente estos pasos:

1. Abrir el archivo `src/js/greetings-data.js` en el editor de código.

2. Localizar el array `greetings` dentro del objeto exportado.

3. Agregar un nuevo objeto al final del array respetando exactamente la estructura del esquema definido en la Sección 8 de este documento, con todos los campos obligatorios: `countryCode`, `countryName` (con claves `es` y `en`), `flagEmoji`, `greeting` (con claves `es` y `en`) y `coloquialNote`.

4. Asignar el valor del campo `countryCode` usando el estándar **ISO 3166-1 alpha-2** en minúsculas (dos letras). Consultar la lista oficial en [https://www.iso.org/iso-3166-country-codes.html](https://www.iso.org/iso-3166-country-codes.html) para obtener el código correcto.

5. Guardar el archivo `src/js/greetings-data.js`. No es necesario modificar ningún otro archivo del proyecto.

6. Verificar en el navegador que la nueva tarjeta aparece correctamente en el grid, tanto en idioma español como en inglés, usando el selector de idioma de la interfaz.

7. Si se desea incluir una imagen de bandera en lugar del emoji unicode, agregar el archivo de imagen correspondiente en la carpeta `assets/flags/` con el nombre `{countryCode}.svg` (ej: `br.svg` para Brasil), respetando el mismo código ISO utilizado en el paso 4.

8. Actualizar el campo `coloquialNote` con una descripción precisa del contexto lingüístico y regional del saludo para mantener la coherencia documental del objeto de datos.

> ⚠️ **Advertencia:** El campo `countryCode` debe seguir estrictamente el estándar **ISO 3166-1 alpha-2** en minúsculas. Usar un código incorrecto o inventado romperá la referencia a la imagen de bandera en `assets/flags/` y puede generar inconsistencias en futuras integraciones con APIs de geolocalización o sistemas de internacionalización. No usar subdivisiones (ISO 3166-2) ni códigos de tres letras (ISO 3166-1 alpha-3) en este campo.