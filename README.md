# Productora Web — Sitio Corporativo
Sitio estático de presentación corporativa. 4 páginas HTML. Sin backend. Sin dependencias de build.

## Estructura de archivos

```
/
├── index.html
├── servicios.html
├── quienes-somos.html
├── contacto.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── config.js
│   └── i18n.js
└── README.md
```

## Cómo ejecutar localmente

1. Clona o descarga este repositorio.
2. Abre `index.html` directamente en tu navegador.
3. No se requiere servidor local, compilación ni instalación de dependencias.

> **Nota:** Si el navegador bloquea recursos por política CORS al abrir desde `file://`,
> usa la extensión "Live Server" de VS Code o ejecuta `python -m http.server 8080`
> desde la raíz del proyecto.

## Configuración obligatoria antes del deploy

> ⚠️ **El formulario de contacto NO funcionará sin completar este paso.**

1. Crea una cuenta gratuita en [Formspree](https://formspree.io).
2. Crea un nuevo formulario y copia tu `FORM_ID` (el código alfanumérico de la URL).
3. Abre el archivo `js/config.js`.
4. Reemplaza el valor de `FORMSPREE_FORM_ID` con tu código:

```js
// js/config.js
const CONFIG = {
  FORMSPREE_FORM_ID: "REEMPLAZAR_CON_TU_ID"
};
```

5. Guarda el archivo. El formulario quedará operativo.

## Limitaciones conocidas

- **Formulario de contacto:** El plan gratuito de Formspree permite un máximo de 50 envíos por mes. Si se supera este límite, los mensajes no se entregarán. Contactar al equipo técnico para migrar al plan de pago (~$10 USD/mes).
- **Imágenes:** Las imágenes actuales son placeholders temporales de `placehold.co` y `picsum.photos`. Deben reemplazarse con los assets finales antes del lanzamiento oficial. Ver comentarios `<!-- EDITABLE -->` en cada archivo HTML.
- **Actualizaciones de contenido:** El sitio no tiene CMS. Cualquier cambio de texto o estructura requiere edición directa de los archivos HTML y un nuevo deploy.