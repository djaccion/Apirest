# Tsoft · Saludos Internacionales
**Ticket:** XP-12 | **Entorno:** Local (file:///) y servidor estático

Página estática que muestra saludos coloquiales de los países donde Tsoft tiene oficinas,
con filtro de búsqueda en tiempo real. Sin dependencias externas. Sin backend.

---

## Estructura del Proyecto

```
index.html   → Estructura HTML semántica y datos de saludos embebidos
styles.css   → Estilos visuales, variables CSS y diseño responsivo
main.js      → Lógica de filtro de búsqueda (vanilla JS, sin módulos)
README.md    → Este archivo
```

> ⚠️ **ADVERTENCIA AL DESARROLLADOR:** No agregues ningún archivo fuera de esta lista. El proyecto es de archivo mínimo por diseño.

---

## Requisitos Previos

- Navegador moderno (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Sin instalaciones adicionales requeridas
- Sin Node.js, sin npm, sin servidor local obligatorio

---

## Cómo Ejecutar

### Opción A: Apertura local directa
1. Descarga o clona el repositorio.
2. Abre el archivo `index.html` directamente en tu navegador.
   - Windows: doble clic sobre `index.html`
   - macOS/Linux: `open index.html` desde terminal
3. La página carga sin pasos adicionales.

### Opción B: Servidor estático (recomendado)
Si dispones de Python instalado, ejecuta desde la carpeta del proyecto:

    # Python 3
    python -m http.server 8080

Luego abre: http://localhost:8080

> **Nota de seguridad:** Para despliegue en servidor corporativo, sirve los archivos bajo HTTPS.
> El código no requiere modificaciones para funcionar bajo HTTPS.

---

## Funcionalidades

- Muestra saludos coloquiales organizados por país de oficina Tsoft
- Campo de búsqueda con filtro en tiempo real (sin recarga de página)
- Diseño responsivo adaptado a móvil, tablet y escritorio
- Funciona completamente offline, sin dependencias de red
- Compatible con protocolo file:/// y servidores HTTP/HTTPS

---

## Notas de Seguridad

- El campo de búsqueda sanitiza el input del usuario vía `textContent`.
  No se usa `innerHTML` con datos del usuario en ningún punto del código.
- No hay backend, base de datos ni autenticación. El contenido es público por diseño.
- Para despliegue en servidor: usar HTTPS y configurar cabeceras
  `Content-Security-Policy` y `X-Frame-Options` a nivel de servidor web.

---

## Mantenimiento de Datos

Los saludos y la información de cada país están definidos directamente en `index.html`,
dentro del atributo `data-*` de cada tarjeta, o como contenido estático en el marcado HTML.

**Para agregar un nuevo país u oficina:**

1. Abre `index.html` en cualquier editor de texto.
2. Localiza el elemento `<div id="greetings-grid">`.
3. Copia el bloque de una tarjeta existente y pégalo al final, dentro del mismo contenedor.
4. Edita los valores de país, saludo, idioma y pronunciación en el nuevo bloque.
5. Guarda el archivo. No se requiere compilación ni reinicio de ningún servicio.

**Campos editables por tarjeta:**

- `.card__flag` — Emoji de bandera del país
- `.card__greeting` — Saludo coloquial en el idioma local
- `.card__language` — Nombre del idioma
- `.card__country` — Nombre del país
- `.card__pronunciation` — Guía de pronunciación aproximada en español

> ⚠️ No modifiques los atributos `id` ni las clases CSS existentes. El filtro de búsqueda
> en `main.js` depende de la estructura de clases para localizar y comparar el texto de cada tarjeta.