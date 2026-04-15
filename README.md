# Hola Mundo Multilenguaje

> Sitio estático puro que muestra el saludo "Hola Mundo" en 12 idiomas del mundo, con diseño responsivo, accesible y semántico usando únicamente HTML5 y CSS3.

![HTML5 Válido](https://img.shields.io/badge/HTML5-v%C3%A1lido-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-estilizado-1572B6?style=flat&logo=css3&logoColor=white)
![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-green?style=flat)
![Estado](https://img.shields.io/badge/Estado-Estable-brightgreen?style=flat)

---

## Descripción General

**Hola Mundo Multilenguaje** es un sitio estático puro construido exclusivamente con HTML5 semántico y CSS3, sin ningún uso de JavaScript, frameworks CSS ni dependencias externas de ningún tipo. Su propósito es demostrar buenas prácticas de desarrollo web frontend mediante la presentación visual de saludos en múltiples idiomas del mundo. El proyecto pone especial énfasis en la accesibilidad conforme al estándar WCAG AA y en un diseño responsivo con enfoque mobile-first.

Los 12 idiomas representados en el proyecto son:

- Español
- Inglés
- Francés
- Alemán
- Italiano
- Portugués
- Japonés
- Chino
- Árabe
- Ruso
- Hindi
- Coreano

---

## Vista Previa

![Vista previa del proyecto Hola Mundo Multilenguaje mostrando tarjetas de idiomas en diseño responsivo](/images/preview.png)

> **Nota:** La imagen de vista previa debe capturarse tras construir el proyecto y abrirlo en el navegador. Guardar la captura en la ruta `/images/preview.png`.

---

## Estructura del Proyecto

```
hola-mundo-multilenguaje/
├── index.html              # Documento principal con HTML5 semántico y estructura de tarjetas
├── css/
│   ├── reset.css           # Normalización cross-browser de estilos por defecto
│   ├── variables.css       # Custom Properties: colores, tipografías y espaciados globales
│   ├── layout.css          # Estructura general con CSS Grid y Flexbox
│   ├── components.css      # Estilos de tarjetas de idiomas y elementos reutilizables
│   └── responsive.css      # Media queries con enfoque mobile-first (320px, 768px, 1024px)
├── images/
│   └── preview.png         # Captura de pantalla del proyecto para el README
└── README.md               # Documentación técnica y guía de uso del proyecto
```

---

## Tecnologías

- **HTML5 semántico** - Estructura del documento usando etiquetas semánticas nativas: `header`, `main`, `section`, `article`, `footer`
- **CSS3 con Custom Properties** - Variables CSS nativas para gestión centralizada de tokens de diseño (colores, tipografías, espaciados)
- **CSS Grid** - Sistema de layout bidimensional para la cuadrícula de tarjetas de idiomas
- **CSS Flexbox** - Alineación y distribución de elementos dentro de componentes individuales
- **UTF-8 encoding** - Codificación de caracteres universal para soporte correcto de alfabetos no latinos (árabe, japonés, chino, hindi, coreano, ruso)

> **Sin dependencias externas:** Este proyecto no utiliza JavaScript de ningún tipo, frameworks CSS (Bootstrap, Tailwind, etc.), preprocesadores CSS (Sass, Less) ni librerías de terceros. Todo el código es nativo y estándar.

---

## Cómo Usar

### Requisitos Previos

Únicamente se requiere un navegador web moderno (Chrome, Firefox, Safari, Edge en versiones actuales). No es necesario instalar ningún software adicional, gestor de paquetes, entorno de ejecución ni servidor local.

### Instalación

1. Clonar el repositorio en tu máquina local:

```bash
git clone https://github.com/usuario/hola-mundo-multilenguaje.git
```

2. Navegar al directorio del proyecto:

```bash
cd hola-mundo-multilenguaje
```

3. Abrir el archivo principal en el navegador:

```bash
# En sistemas Unix/macOS
open index.html

# En Windows
start index.html
```

### Visualización Local

El proyecto no requiere servidor local de ningún tipo. Al ser un sitio estático puro, el archivo `index.html` puede abrirse directamente desde el sistema de archivos haciendo doble clic sobre él o arrastrándolo a la ventana del navegador. Todos los recursos CSS se referencian con rutas relativas, por lo que funcionan correctamente desde cualquier ubicación del sistema de archivos.

---

## Idiomas Representados

| Idioma | Saludo | Región Principal |
|---|---|---|
| Español | Hola Mundo | España y América Latina |
| Inglés | Hello World | Estados Unidos y Reino Unido |
| Francés | Bonjour le Monde | Francia |
| Alemán | Hallo Welt | Alemania |
| Italiano | Ciao Mondo | Italia |
| Portugués | Olá Mundo | Brasil y Portugal |
| Japonés | こんにちは世界 | Japón |
| Chino | 你好世界 | China |
| Árabe | مرحبا بالعالم | Arabia Saudita y Oriente Medio |
| Ruso | Привет мир | Rusia |
| Hindi | नमस्ते दुनिया | India |
| Coreano | 안녕하세요 세계 | Corea del Sur |

---

## Decisiones Técnicas

### Accesibilidad

El proyecto cumple con el estándar **WCAG AA** en todos sus componentes. Se garantiza un contraste mínimo de **4.5:1** entre texto y fondo para texto de tamaño normal, verificado con herramientas especializadas. Se utilizan atributos ARIA (`aria-label`, `aria-describedby`, `role`) donde el HTML semántico por sí solo no es suficiente para transmitir el significado al árbol de accesibilidad. La navegación por teclado está completamente habilitada con indicadores de foco visibles en todos los elementos interactivos. Se incluye un **skip navigation link** al inicio del documento para que los usuarios de lectores de pantalla puedan saltar directamente al contenido principal sin recorrer la navegación repetidamente.

### Responsividad

El diseño sigue un enfoque estrictamente **mobile-first**: los estilos base están definidos para pantallas pequeñas y se amplían progresivamente mediante media queries. Los breakpoints definidos son:

- **320px** — móviles pequeños (base)
- **768px** — tablets y móviles en orientación horizontal
- **1024px** — escritorio y laptops

El layout de tarjetas de idiomas utiliza **CSS Grid** con columnas adaptativas que se reorganizan automáticamente según el ancho disponible, sin necesidad de JavaScript.

### Seguridad

Se incluyen **meta tags de seguridad** en el `<head>` del documento: `Content-Security-Policy` vía meta tag para restringir fuentes de recursos, `X-UA-Compatible` para compatibilidad con Internet Explorer y `viewport` para control del escalado en dispositivos móviles. La codificación **UTF-8** se declara explícitamente como primer elemento del `<head>` para garantizar la correcta interpretación de caracteres internacionales. El proyecto no contiene **inline styles** ni **inline scripts**, cumpliendo con las directivas CSP más estrictas y facilitando la auditoría de seguridad del código.

### Semántica HTML

La estructura del documento utiliza exclusivamente etiquetas semánticas de HTML5: `<header>` para el encabezado del sitio, `<main>` como contenedor del contenido principal, `<section>` para agrupar las tarjetas por región lingüística, `<article>` para cada tarjeta de idioma individual y `<footer>` para la información de pie de página. Cada tarjeta de idioma incluye el atributo **`lang`** con el código BCP 47 correspondiente al idioma del saludo mostrado, permitiendo que los lectores de pantalla pronuncien correctamente el texto en su idioma nativo.

---

## Validación

El proyecto debe superar las siguientes validaciones sin errores ni advertencias antes de considerarse completo y listo para producción:

- **W3C Markup Validator** — Validación del HTML5: [https://validator.w3.org](https://validator.w3.org)
- **W3C CSS Validator** — Validación del CSS3: [https://jigsaw.w3.org/css-validator](https://jigsaw.w3.org/css-validator)
- **WebAIM Contrast Checker** — Verificación de contraste de colores WCAG AA: [https://webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker)

> Ningún Pull Request será aceptado si introduce errores de validación W3C o reduce el nivel de accesibilidad por debajo del estándar WCAG AA.

---

## Contribuciones

Las contribuciones son bienvenidas y apreciadas. Si deseas mejorar el proyecto, agregar nuevos idiomas o corregir algún problema, puedes hacerlo siguiendo estos pasos:

1. Hacer **fork** del repositorio en tu cuenta de GitHub
2. Crear una rama con un nombre descriptivo que refleje el cambio propuesto:

```bash
git checkout -b feature/agregar-idioma-swahili
```

3. Realizar los cambios necesarios manteniendo las convenciones de código del proyecto
4. Abrir un **Pull Request** hacia la rama principal con una descripción clara de los cambios realizados

> **Importante:** Todo Pull Request debe mantener la validación W3C sin errores tanto en HTML como en CSS, y debe preservar el nivel de accesibilidad WCAG AA en todos los componentes afectados.

---

## Licencia

Este proyecto está distribuido bajo la licencia **MIT**.

Consulta el archivo [LICENSE](./LICENSE) del repositorio para leer los términos completos.

---

## Autor

**[Tu Nombre](https://github.com/usuario)**

Proyecto creado como demostración de buenas prácticas en desarrollo web estático con HTML5 semántico y CSS3 modular.