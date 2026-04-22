# Tsoft — Saludos Internacionales

Página estática que muestra saludos coloquiales de los países donde Tsoft tiene oficinas.
Un único archivo HTML autocontenido, sin dependencias de build ni servidor backend.

## Estructura del proyecto

```
index.html   → Página principal. Contiene HTML, CSS embebido y datos de saludos en JS.
styles.css   → Hoja de estilos externa con variables de marca y layout responsivo.
README.md    → Este archivo.
```

## Cómo ejecutar

**Opción A — Abrir directamente en el navegador:**
1. Descarga o clona este repositorio.
2. Abre el archivo `index.html` directamente en tu navegador (doble clic o arrastrar).
3. No se requiere servidor, conexión a internet ni instalación de dependencias.

**Opción B — Servidor estático local (recomendado para desarrollo):**
1. Asegúrate de tener Python instalado.
2. Desde la carpeta del proyecto, ejecuta:
   ```
   python -m http.server 8080
   ```
3. Abre `http://localhost:8080` en tu navegador.

## Cómo editar los saludos

Los datos están hardcodeados en `index.html`, dentro de un bloque `<script>`.
Busca el array llamado `greetingsData` cerca del inicio del script.

Cada entrada tiene este formato:
```js
{ country: "Colombia", greeting: "¡Quiubo!", flag: "🇨🇴" }
```

Para agregar un nuevo país:
1. Abre `index.html` en cualquier editor de texto.
2. Localiza el array `greetingsData`.
3. Agrega un nuevo objeto al final del array, antes del cierre `]`.
4. Guarda el archivo y recarga el navegador.

Para modificar un saludo existente:
1. Localiza el objeto correspondiente por el campo `country`.
2. Edita únicamente el campo `greeting`.
3. Guarda y recarga.

## Dependencias externas

- `https://placehold.co` — Imagen de placeholder para el logo en el encabezado.