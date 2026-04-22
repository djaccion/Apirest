# 🌎 Hola TSOFT

Página web estática con saludos personalizados por país para las oficinas TSOFT en Latinoamérica y USA.

## 📁 Estructura del proyecto

```text
hola-tsoft/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
└── README.md
```

## ▶️ Cómo ejecutar

1. Descarga o clona este repositorio en tu equipo local.
2. Abre el archivo `index.html` directamente en tu navegador (doble clic o arrastrar al navegador).
3. No se requiere servidor, instalación de dependencias ni conexión a internet.

> ⚠️ **Nota de compatibilidad:** Los emojis de banderas pueden no renderizarse correctamente en Windows 10. El nombre del país siempre es visible como texto alternativo.

## 🗺️ Países disponibles

| Bandera | País      |
|---------|-----------|
| 🇦🇷    | Argentina |
| 🇲🇽    | México    |
| 🇨🇴    | Colombia  |
| 🇨🇱    | Chile     |
| 🇵🇪    | Perú      |
| 🇺🇾    | Uruguay   |
| 🇧🇷    | Brasil    |
| 🇺🇸    | USA       |

## ⚙️ Decisiones técnicas

- **Sin frameworks JS:** Vanilla JavaScript puro. YAGNI: un framework para 8 saludos estáticos es sobreingeniería.
- **Sin archivos de imagen:** Las banderas se renderizan con emojis Unicode nativos. No hay dependencia de archivos `.png` o `.webp`.
- **Sin proceso de build:** No hay npm, no hay webpack, no hay SASS. El proyecto abre directamente en el navegador.
- **CSS con variables nativas:** Se usan Custom Properties (`--color-primary`, etc.) en lugar de un preprocesador, sin agregar dependencias.

## 🔒 Seguridad

- **XSS:** No hay inputs de usuario. El texto dinámico se inserta con `textContent`, nunca con `innerHTML`.
- **CSP:** Política de seguridad de contenido declarada en el `<meta>` del `index.html`.
- **Producción:** Para despliegue en producción, se recomienda servir el proyecto desde un servidor con HTTPS/TLS habilitado.

## 🎨 Paleta de colores

| Variable CSS        | Valor     |
|---------------------|-----------|
| `--color-primary`   | `#0057A8` |
| `--color-secondary` | `#00AEEF` |
| `--color-accent`    | `#FF6B00` |
| `--color-bg`        | `#F5F7FA` |
| `--color-text`      | `#1A1A2E` |