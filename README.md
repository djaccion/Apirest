# Hola Mundo Multilenguaje

> Sitio estático construido únicamente con HTML5 y CSS3 que muestra el saludo "Hola Mundo" en múltiples idiomas del mundo.

`HTML5` `CSS3` `Sin JavaScript` `Licencia MIT`

---

## Descripción General

Hola Mundo Multilenguaje es un proyecto de sitio estático puro cuyo propósito es mostrar el saludo "Hola Mundo" en 10 idiomas diferentes: Español, Inglés, Francés, Alemán, Italiano, Portugués, Japonés, Chino Mandarín, Árabe y Ruso. El proyecto sirve como demostración de buenas prácticas en el desarrollo de sitios estáticos sin dependencias externas ni frameworks. Está construido sobre tres pilares fundamentales: accesibilidad conforme a WCAG 2.1 AA, diseño responsivo mobile-first y seguridad básica mediante meta tags adecuados.

---

## Preview

![Vista del sitio Hola Mundo Multilenguaje mostrando tarjetas de idiomas](/images/preview.png)

---

## Características Principales

- Saludo "Hola Mundo" en múltiples idiomas: Español, Inglés, Francés, Alemán, Italiano, Portugués, Japonés, Chino Mandarín, Árabe y Ruso
- Diseño responsivo Mobile-First con CSS Grid y Flexbox
- Sin dependencias externas ni JavaScript
- Soporte de caracteres internacionales mediante UTF-8
- Accesibilidad WCAG AA con atributos `lang` por sección
- Atributos de seguridad mediante meta tags
- CSS modular con separación de responsabilidades
- Nomenclatura BEM en clases CSS

---

## Estructura del Proyecto

```
hola-mundo-multilenguaje/
├── index.html              - Punto de entrada principal, HTML semántico
├── css/
│   ├── reset.css           - Normalización cross-browser
│   ├── variables.css       - Custom properties globales
│   ├── layout.css          - Estructura general de página
│   ├── components.css      - Tarjetas, header, footer
│   └── responsive.css      - Media queries y breakpoints
├── images/
│   └── preview.png         - Captura del proyecto para README
└── README.md               - Documentación del proyecto
```

---

## Instalación y Uso

### Requisitos Previos

Solo se necesita un navegador web moderno (Chrome, Firefox, Safari, Edge). No hay dependencias de Node, npm ni ningún runtime adicional. No es necesario instalar nada.

### Ejecución Local

**Método 1: Apertura directa**

Navega hasta la carpeta del proyecto en tu explorador de archivos y haz doble clic sobre el archivo `index.html`. El navegador predeterminado del sistema operativo abrirá el sitio de forma inmediata.

**Método 2: Servidor local con Python**

```
python -m http.server 8080
```

Luego abre tu navegador y accede a `http://localhost:8080`

### Despliegue

Al tratarse de un sitio completamente estático, puede desplegarse sin configuración adicional en cualquiera de las siguientes plataformas:

- **GitHub Pages**: sube el repositorio y activa Pages desde la configuración del repositorio
- **Netlify**: arrastra la carpeta del proyecto al panel de Netlify
- **Cualquier hosting de archivos estáticos**: sube los archivos mediante FTP o el panel de control del proveedor

---

## Decisiones de Diseño y Arquitectura

| Decisión | Motivo | Alternativa Descartada |
|---|---|---|
| Sin JavaScript | Requerimiento del proyecto | React o Vue |
| CSS Modular en archivos separados | Separación de responsabilidades y mantenibilidad | Un solo archivo CSS monolítico |
| Mobile-First | Mejor rendimiento en dispositivos móviles | Desktop-First |
| UTF-8 | Soporte de caracteres especiales internacionales | ASCII |
| Atributo `lang` por sección | Accesibilidad para lectores de pantalla | Solo `lang` global en `<html>` |
| BEM como nomenclatura | Claridad y escalabilidad en clases | Clases genéricas sin convención |

---

## Accesibilidad

Este proyecto tiene como objetivo de conformidad el nivel **WCAG 2.1 AA**. A continuación se detallan las medidas implementadas:

- Atributo `lang` en la etiqueta `<html>` raíz con el idioma principal de la interfaz
- Atributo `lang` individual en cada tarjeta de idioma para que los lectores de pantalla pronuncien correctamente cada saludo
- Jerarquía semántica correcta utilizando `<h1>`, `<h2>`, `<section>`, `<article>`, `<header>`, `<main>` y `<footer>`
- Roles ARIA donde el HTML semántico no es suficiente para describir la función del elemento
- Contraste de colores validado para cumplir el ratio mínimo de 4.5:1 en texto normal
- Atributos `alt` descriptivos en todas las imágenes del proyecto

---

## Seguridad

Al ser un sitio estático sin backend ni JavaScript, la superficie de ataque es mínima. Las medidas de seguridad implementadas son:

- Meta tag `Content-Security-Policy` para restringir las fuentes de contenido permitidas y prevenir inyección de scripts no autorizados
- Meta tag `X-UA-Compatible` configurado con `IE=edge` para forzar el modo de renderizado más moderno disponible en Internet Explorer y Edge heredado
- Charset `UTF-8` declarado explícitamente para evitar ataques de codificación de caracteres
- Ausencia total de scripts inline y externos, eliminando la superficie de ataque XSS por completo
- Sin formularios ni entrada de datos de usuario, eliminando vectores de inyección
- Sin cookies ni almacenamiento local, sin datos sensibles del usuario

---

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Puedes usarlo, modificarlo y distribuirlo libremente con la única condición de mantener el aviso de copyright original.