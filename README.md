# [Nombre Productora]

Sitio web estático de presencia digital para productora audiovisual/creativa. Cubre cuatro secciones: Home, Servicios, Quiénes Somos y Contacto.

## Estructura de archivos

```
/
├── index.html
├── styles.css
├── main.js
├── contact.js
└── README.md
```

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura semántica HTML5 de las cuatro secciones del sitio |
| `styles.css` | Estilos globales: reset, layout, componentes y responsive |
| `main.js` | Navegación, scroll suave, animaciones e interacciones generales |
| `contact.js` | Validación del formulario e integración con Formspree |
| `README.md` | Documentación operativa de despliegue, configuración y riesgos |

## Ejecución local

1. Clonar o descargar el repositorio en tu máquina local.
2. Abrir `index.html` directamente en el navegador o usar una extensión de servidor local como Live Server (VS Code) para evitar restricciones CORS en el formulario.

> ⚠️ Abrir el archivo mediante el protocolo `file://` puede bloquear las llamadas a Formspree en algunos navegadores. Se recomienda usar Live Server o cualquier servidor HTTP local simple para garantizar el funcionamiento completo del formulario.

## Configuración del formulario

1. Crear una cuenta gratuita en `https://formspree.io`.
2. Crear un nuevo formulario en el dashboard de Formspree y copiar el endpoint generado (formato: `https://formspree.io/f/XXXXXXXX`).
3. Abrir `contact.js` y reemplazar el valor de la constante `FORMSPREE_ENDPOINT` con el endpoint copiado.
4. Verificar el correo de confirmación que Formspree envía al activar el formulario.

> 📌 El plan gratuito de Formspree tiene un límite de **50 envíos/mes**. Antes del lanzamiento público, evaluar el plan pago si el volumen esperado lo supera.

## Despliegue

### Netlify

1. Arrastrar la carpeta del proyecto al dashboard de Netlify en `https://app.netlify.com/drop`.

### GitHub Pages

1. Subir el repositorio a GitHub.
2. Activar GitHub Pages desde `Settings > Pages > Branch: main / root`.

### cPanel / Hosting tradicional

1. Subir todos los archivos al directorio `public_html` vía FTP o el administrador de archivos del panel.

## Riesgos conocidos

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Formspree tiene límite de 50 envíos/mes en plan gratuito | Bajo | Actualizar a plan pago antes del lanzamiento público |
| Protección anti-XSS recae 100% en validación client-side | Medio | Sanitización estricta en JS y CSP headers en el hosting |
| Toggle de idioma ES/EN implementado con `data-lang` básico | Bajo | Suficiente para MVP; migrar a i18n formal en versión posterior |
| CDN y pruebas de carga son responsabilidad del hosting | Bajo | Documentado; fuera del alcance del código entregado |