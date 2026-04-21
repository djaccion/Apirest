# Tsoft — Página de Saludos Internacionales

Página estática que muestra saludos coloquiales de los países donde Tsoft tiene oficinas.

## Requisitos

- Navegador web moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No requiere servidor, Node.js, ni dependencias externas

## Cómo ejecutar

### Opción A — Apertura local directa

Abre el archivo directamente en tu navegador:

```bash
# En sistemas Unix/macOS
open index.html

# En Windows
start index.html
```

### Opción B — Servidor local simple (recomendado)

```bash
# Con Python 3
python -m http.server 8080

# Luego abre: http://localhost:8080
```

*"La Opción B evita restricciones de seguridad del protocolo `file:///` en algunos navegadores."*

## Estructura de archivos

```
index.html   — Estructura HTML y contenido de la página
styles.css   — Estilos visuales y variables de marca Tsoft
main.js      — Datos de saludos y lógica de renderizado
README.md    — Este archivo
```

## Cómo agregar o modificar un saludo

Los datos de saludos están centralizados en `main.js`, en el array `GREETINGS_DATA` al inicio del archivo.

```javascript
// Estructura de cada entrada en GREETINGS_DATA
{
  pais: "Argentina",
  bandera_emoji: "🇦🇷",
  saludo_coloquial: "¡Buenas!",
  idioma: "Español (Rioplatense)"
}
```

Para agregar un país, copia el bloque anterior, pégalo en el array y completa los cuatro campos.

## Países incluidos

- 🇦🇷 Argentina
- 🇧🇷 Brasil
- 🇨🇱 Chile
- 🇨🇴 Colombia
- 🇪🇸 España
- 🇲🇽 México
- 🇵🇪 Perú
- 🇺🇸 Estados Unidos
- 🇺🇾 Uruguay

## Despliegue en producción

Esta página es compatible con cualquier servidor de archivos estáticos. Sube los cuatro archivos del proyecto a GitHub Pages, Netlify o un bucket S3 con hosting estático habilitado. En producción, asegúrate de servir el sitio bajo HTTPS.