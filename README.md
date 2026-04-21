# Tsoft — Página de Saludos Internacionales
Página web estática que muestra saludos coloquiales de los países donde Tsoft tiene oficinas.
Archivo único · Sin dependencias · Sin build · Sin servidor requerido.

## Cómo abrir

1. Abre el archivo directamente haciendo doble clic sobre `index.html`. Se cargará en tu navegador bajo el protocolo `file:///`.
2. Opcionalmente, sirve el archivo con un servidor estático local:

```
python3 -m http.server 8080
```

URL resultante: `http://localhost:8080`

## Estructura del proyecto

- `index.html` — Aplicación completa: estructura, estilos y datos de saludos.
- `README.md` — Este archivo.

## Países incluidos

| País | Saludo coloquial |
|---|---|
| Argentina | ¡Buenas! |
| Brasil | Oi! |
| Chile | ¡Buenas! |
| Colombia | ¡Quiubo! |
| España | ¡Buenas! |
| Estados Unidos | Hey! |
| México | ¡Qué onda! |
| Perú | ¡Habla! |
| Uruguay | ¡Hola! |

> ⚠️ **ADVERTENCIA AL DESARROLLADOR:** Los saludos de esta tabla son referencia de documentación. Los saludos que se renderizan en pantalla viven en el array de datos dentro de `index.html`. Ambas fuentes deben coincidir. Si el Arquitecto modifica un saludo, actualiza las dos fuentes.

## Configuración al desplegar en servidor

Al servir la aplicación desde HTTPS, configura las siguientes cabeceras HTTP en el servidor (Nginx, Apache o CDN):

- `Content-Security-Policy: default-src 'self'`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`

*Estas cabeceras no aplican en protocolo `file:///`.*