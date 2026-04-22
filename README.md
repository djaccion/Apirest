# Saludos Internacionales Tsoft
Página estática que muestra saludos coloquiales de los países donde Tsoft tiene oficinas.

## Estructura del proyecto

- `index.html` — Página principal. Contiene el HTML, el CSS embebido de base y el bloque de datos JS.
- `styles.css` — Hoja de estilos externa con los estilos visuales del proyecto.
- `assets/logo-placeholder.txt` — Placeholder del logo corporativo. Reemplazar con el asset real cuando esté disponible.
- `README.md` — Este archivo.

## Cómo abrir el proyecto

1. Descarga o clona este repositorio en tu máquina local.
2. Abre el archivo `index.html` directamente en tu navegador (doble clic o arrastrar al navegador).
3. No se requiere servidor, instalación de dependencias ni proceso de build.

> ⚠️ El archivo debe abrirse desde el sistema de archivos local (protocolo `file:///`).
> No uses `Live Server` con configuración de módulos ES6 activa, ya que este proyecto
> no utiliza módulos. Cualquier navegador moderno (Chrome, Firefox, Edge) es compatible.

## Países incluidos

- Argentina
- Chile
- Uruguay
- Colombia
- Perú
- México
- Brasil
- España
- Estados Unidos

## Notas para infraestructura

Este proyecto está diseñado para entorno local. Si se despliega en un servidor web,
asegurarse de servirlo bajo HTTPS para cumplir con las políticas de seguridad de contenido.
No hay recursos externos ni mixed-content en el código. No se requiere configuración
adicional de servidor (no hay rutas dinámicas, no hay API, no hay base de datos).