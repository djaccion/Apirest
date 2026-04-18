# Productora Web — MVP

Sitio web estático de presencia digital para productora audiovisual/creativa.
Stack: HTML5 + CSS puro + JavaScript puro. Sin frameworks. Sin backend.

## Estructura del Proyecto

```
productora-web/
├── index.html
├── servicios.html
├── quienes-somos.html
├── contacto.html
├── css/
│   ├── variables.css
│   ├── global.css
│   ├── home.css
│   ├── servicios.css
│   ├── quienes-somos.css
│   └── contacto.css
├── js/
│   ├── config.js
│   ├── i18n.js
│   └── main.js
└── README.md
```

## Cómo correr el proyecto localmente

**Método A — Sin dependencias (abrir directamente):**

Abre `index.html` directamente en tu navegador.
No requiere servidor local ni instalación de dependencias.

**Método B — Con servidor local (recomendado para evitar restricciones CORS en desarrollo):**

Usando la extensión Live Server de VS Code:
1. Instala la extensión "Live Server" en VS Code.
2. Haz clic derecho sobre `index.html`.
3. Selecciona "Open with Live Server".

Usando Python (si tienes Python instalado):
```bash
# Python 3
python -m http.server 8080
```
Luego abre `http://localhost:8080` en tu navegador.

## Configuración requerida antes del primer deploy

- [ ] **Formspree:** Abre `js/config.js` y reemplaza el valor de `FORMSPREE_ENDPOINT`
      con la URL real de tu formulario en Formspree.io
      (formato: `https://formspree.io/f/TU_FORM_ID`).
- [ ] **Idioma por defecto:** En `js/config.js`, confirma que `DEFAULT_LANG`
      esté seteado en `'es'` o `'en'` según el mercado objetivo del deploy.

## Imágenes y Assets

Todas las imágenes del sitio usan placeholders externos hasta la entrega
de assets finales por parte del equipo de diseño.

- Placeholders de dimensión fija: `https://placehold.co/{W}x{H}`
- Placeholders fotográficos: `https://picsum.photos/{W}/{H}`

**Al recibir los assets finales:** reemplaza cada `src` de `<img>`
en los archivos HTML correspondientes. No se requiere ningún cambio en CSS ni JS.

## Internacionalización (ES/EN)

El cambio de idioma se gestiona íntegramente desde `js/i18n.js`.

Para agregar o editar traducciones:
1. Abre `js/i18n.js`.
2. Localiza el objeto de traducciones bajo la clave `'es'` o `'en'`.
3. Edita el valor de la clave correspondiente al texto que deseas cambiar.
4. No modifiques los atributos `data-lang` en los archivos HTML;
   esos son los identificadores de los nodos y no deben cambiar.

## Recomendaciones de Deployment

El sitio es un conjunto de archivos estáticos y puede desplegarse en cualquier
plataforma de hosting estático sin configuración adicional de servidor.

Plataformas compatibles:
- **Netlify:** Arrastra la carpeta `productora-web/` al dashboard de Netlify.
- **GitHub Pages:** Sube el repositorio y activa Pages desde la rama `main`.
- **Amazon S3:** Crea un bucket con Static Website Hosting habilitado y sube los archivos.
- **Vercel:** Conecta el repositorio y Vercel detecta automáticamente el sitio estático.

Configuración recomendada en el hosting:
- Habilita HTTPS (la mayoría de las plataformas lo activan por defecto).
- Configura el header `Content-Security-Policy` para restringir orígenes de scripts y formularios.
- Configura redirecciones 404 apuntando a `index.html` si el hosting lo requiere.