# Tsoft — Saludos Internacionales
Página estática que muestra saludos coloquiales de los países donde Tsoft tiene oficinas.
Sin dependencias. Sin servidor de aplicaciones. Sin build step.

## Estructura del proyecto

```
index.html        → Página principal con todo el contenido de saludos
css/styles.css    → Estilos globales y variables de marca
js/main.js        → Toggle del menú hamburguesa (móvil)
README.md         → Este archivo
```

## Cómo ejecutar localmente

**Método A — Abrir directamente (sin servidor):**

Abre `index.html` en cualquier navegador moderno.
Doble clic sobre el archivo es suficiente.

**Método B — Servidor local con Python (recomendado para evitar restricciones CORS en algunos navegadores):**

```bash
# Python 3
python -m http.server 8080
# Luego abre: http://localhost:8080
```

## Países incluidos

| País | Saludo coloquial |
|---|---|
| Argentina | ¡Buenas! |
| Chile | ¡Buenas! |
| Colombia | ¡Quiubo! |
| México | ¡Qué onda! |
| Perú | ¡Habla! |
| Uruguay | ¡Buenas! |
| Brasil | Oi! |
| España | ¡Buenas! |
| Estados Unidos | Hey! |

## Cómo agregar un nuevo país

1. Abre `index.html`.
2. Localiza el bloque de tarjeta de cualquier país existente (busca el comentario `<!-- CARD PAÍS -->`).
3. Duplica ese bloque completo y reemplaza el nombre del país y el saludo.
4. Guarda el archivo y recarga el navegador.

## Despliegue

Sube los archivos a cualquier hosting de archivos estáticos con HTTPS habilitado.
Opciones válidas: GitHub Pages, Netlify, Vercel (modo estático), Nginx.
No se requiere configuración de servidor de aplicaciones ni variables de entorno.