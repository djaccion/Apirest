# Productora Web

Sitio estático de presentación corporativa para productora audiovisual.
Stack: HTML5 + CSS3 + JavaScript puro. Sin frameworks. Sin backend.

## Estructura de archivos

```
productora-web/
├── index.html          → Documento principal. Contiene las 4 secciones: Home, Servicios, Quiénes Somos, Contacto.
├── css/
│   └── styles.css      → Estilos globales. Variables CSS custom properties para theming y diseño responsivo.
├── js/
│   ├── main.js         → Interactividad general: navbar sticky, smooth scroll, animaciones, toggle ES/EN.
│   └── contact.js      → Lógica del formulario de contacto: validación client-side e integración EmailJS.
└── README.md           → Este archivo.
```

## Requisitos previos

- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).
- Conexión a internet activa (requerida para cargar EmailJS vía CDN y los placeholders de imágenes).
- Cuenta gratuita en EmailJS (https://www.emailjs.com) para activar el envío real del formulario.
- Editor de texto para configurar las credenciales de EmailJS (ver sección Configuración).

## Instalación y uso

1. Descarga o clona el repositorio.
2. Abre el archivo `productora-web/index.html` directamente en el navegador.
   No se requiere servidor local. El sitio funciona desde el sistema de archivos.
3. Para despliegue en producción, sube la carpeta `productora-web/` completa
   a cualquier hosting estático (GitHub Pages, Netlify, Vercel, servidor FTP).
   No se requiere configuración de servidor.

## Configuración del formulario de contacto (EmailJS)

El formulario opera en modo simulación por defecto (muestra confirmación visual sin enviar correo real).
Para activar el envío real de correos, sigue estos pasos:

1. Crea una cuenta gratuita en https://www.emailjs.com
2. Dentro de tu cuenta de EmailJS, obtén los siguientes valores:
   - Service ID   → en la sección "Email Services"
   - Template ID  → en la sección "Email Templates"
   - Public Key   → en la sección "Account > API Keys"
3. Abre el archivo `productora-web/js/contact.js` y reemplaza los valores
   en las constantes marcadas con el comentario TODO al inicio del archivo:

   const EMAILJS_SERVICE_ID  = 'TU_SERVICE_ID';
   const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';
   const EMAILJS_PUBLIC_KEY  = 'TU_PUBLIC_KEY';

Una vez configurado, el formulario enviará los datos directamente al correo
asociado a tu cuenta de EmailJS sin necesidad de backend propio.

## Idioma

El sitio incluye toggle de idioma Español / Inglés activado desde el navbar.
El cambio es instantáneo y no recarga la página.
Los textos se gestionan mediante atributos `data-i18n` en el HTML
y un objeto de traducciones en `productora-web/js/main.js`.
Para editar los textos, modifica únicamente ese objeto en `main.js`.

## Imágenes

Los placeholders de imágenes se cargan desde `https://placehold.co` vía URL externa; reemplázalos con tus propios archivos editando los atributos `src` correspondientes en `productora-web/index.html`.