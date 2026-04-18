# Productora Web — Sitio Corporativo Estático

Sitio web de presentación corporativa para productora audiovisual. Stack: HTML5 + CSS + JS puro. Sin frameworks, sin backend, sin dependencias de build.

## Estructura de Archivos

```
productora-web/
├── index.html
├── README.md
├── css/
│   ├── reset-variables.css
│   ├── layout.css
│   ├── componentes.css
│   └── responsive.css
└── js/
    ├── navegacion.js
    ├── formulario.js
    └── animaciones.js
```

## Cómo ejecutar localmente

**Opción A — Abrir directamente**: Abre el archivo `index.html` en tu navegador desde el sistema de archivos (doble clic o arrastrar al navegador).

**Opción B — Servidor local con Python**:

```bash
python3 -m http.server 8080
```

Accede en `http://localhost:8080`.

## Configuración de EmailJS

1. Crea una cuenta en [https://www.emailjs.com](https://www.emailjs.com) y obtén: `PUBLIC_KEY`, `SERVICE_ID` y `TEMPLATE_ID`.
2. Abre `js/formulario.js` y reemplaza los tres placeholders indicados con las credenciales obtenidas. Los nombres exactos de los placeholders son:
   - `TU_PUBLIC_KEY`
   - `TU_SERVICE_ID`
   - `TU_TEMPLATE_ID`
3. El plan gratuito de EmailJS permite **200 emails/mes**. Si el volumen supera ese límite, se requiere plan de pago o migración a Formspree (`https://formspree.io`).

## Despliegue

| Plataforma | Método de despliegue |
|---|---|
| Netlify | Arrastrar carpeta `productora-web/` al dashboard de Netlify Drop |
| Vercel | `vercel --prod` desde la raíz del proyecto |
| GitHub Pages | Push a rama `main`, activar Pages desde Settings del repositorio |

## Riesgos Asumidos

- **[BAJO]** EmailJS tiene límite de 200 emails/mes en plan gratuito. Si el volumen supera esto, se requiere plan de pago o migración a backend.
- **[MEDIO]** Sin backend, no hay protección CSRF real en el formulario. EmailJS mitiga esto con tokens de servicio del lado cliente.
- **[BAJO]** El sitio depende de la disponibilidad del CDN de EmailJS. Si el servicio cae, el formulario de contacto queda inoperativo.
- **[MEDIO]** Sin sistema de caché ni CDN propio, el rendimiento en regiones remotas puede degradarse. Se asume que el hosting estático elegido provee CDN suficiente.