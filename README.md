# HOLA TSOFT (XP-8)

Página web estática que muestra saludos coloquiales de las oficinas TSOFT en Latinoamérica, España y USA. **Versión 1.0.0**

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación y Despliegue Local](#instalación-y-despliegue-local)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [Configuración de Seguridad](#configuración-de-seguridad)
7. [Cómo Agregar un Nuevo País](#cómo-agregar-un-nuevo-país)
8. [Internacionalización](#internacionalización)
9. [Navegadores Soportados](#navegadores-soportados)
10. [Contribución](#contribución)
11. [Licencia](#licencia)

---

## Descripción General

TSOFT es una empresa de tecnología con presencia regional consolidada en América Latina, España y la comunidad hispana de Estados Unidos. Esta página celebra la diversidad cultural de sus equipos mostrando saludos auténticos y coloquiales propios de cada región donde la empresa tiene oficinas activas.

El proyecto cubre nueve territorios: **México**, **Colombia**, **Argentina**, **Chile**, **Perú**, **Ecuador**, **Venezuela**, **España** y **USA (comunidad hispana)**. Cada saludo fue seleccionado para reflejar el habla cotidiana real de cada zona geográfica, no una versión genérica del español, lo que convierte a esta página en un reconocimiento genuino a la identidad cultural de cada equipo.

La solución es completamente estática, sin dependencias externas, sin proceso de compilación y sin frameworks. Esto garantiza tiempos de carga mínimos, máxima portabilidad y una superficie de ataque reducida desde el punto de vista de seguridad.

---

## Arquitectura del Proyecto

```
hola-tsoft/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── greetings-data.js
│   │   └── app.js
│   └── img/
├── README.md
├── SECURITY.md
└── .htaccess
```

### Responsabilidad de cada archivo

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura semántica HTML5 de la aplicación; punto de entrada único del proyecto. |
| `assets/css/styles.css` | Estilos visuales completos con CSS Custom Properties, diseño responsivo mobile-first y sistema de tarjetas por país. |
| `assets/js/greetings-data.js` | Objeto de configuración de datos con todos los saludos por país en cada idioma soportado; es el único archivo que se modifica al agregar un nuevo país. |
| `assets/js/app.js` | Motor de renderizado dinámico; lee los datos de `greetings-data.js`, gestiona el cambio de idioma y construye las tarjetas en el DOM de forma segura. |
| `assets/img/` | Directorio reservado para recursos gráficos estáticos del proyecto. |
| `README.md` | Documentación técnica principal del proyecto; guía de despliegue, arquitectura y mantenimiento. |
| `SECURITY.md` | Política de seguridad del proyecto; detalla headers HTTP implementados, decisiones de hardening y procedimiento de reporte de vulnerabilidades. |
| `.htaccess` | Archivo de configuración para servidores Apache; define headers de seguridad HTTP, reglas de redirección a HTTPS y restricciones de acceso a archivos sensibles. |

---

## Requisitos Previos

Antes de desplegar el proyecto, verificar que se cumplan los siguientes requisitos:

- **Servidor web con soporte HTTPS obligatorio.** El despliegue en producción sobre HTTP plano no está soportado y viola la política de seguridad del proyecto. Se aceptan Apache 2.4+, Nginx 1.18+ u otro servidor web compatible con la configuración de headers HTTP estándar.
- **Navegadores modernos con soporte ES6+.** El proyecto utiliza JavaScript ES6 (ECMAScript 2015) o superior. Los navegadores mínimos soportados son: Chrome 51+, Firefox 54+, Safari 10+, Edge 15+ y Opera 38+. Internet Explorer no está soportado.
- **No se requiere Node.js** ni ningún gestor de paquetes como npm, yarn o pnpm. El proyecto es completamente estático y no tiene proceso de build, transpilación ni bundling.
- **No se requieren dependencias externas** de ningún tipo. No hay librerías de terceros, no hay CDNs y no hay módulos que instalar.
- **Git** (opcional) para clonar el repositorio. Como alternativa, el proyecto puede descargarse como archivo ZIP directamente desde el repositorio.

---

## Instalación y Despliegue Local

### Desarrollo rápido

Para visualizar el proyecto en entorno de desarrollo local, los pasos son los siguientes:

1. Clonar el repositorio o descargar el archivo ZIP del proyecto:
   ```
   git clone https://github.com/tsoft/hola-tsoft.git
   ```
2. Acceder al directorio del proyecto:
   ```
   cd hola-tsoft
   ```
3. Abrir el archivo `index.html` directamente en el navegador. En la mayoría de los sistemas operativos basta con hacer doble clic sobre el archivo o arrastrarlo a una ventana del navegador.

### Servidor local para pruebas de CSP

> **Advertencia:** Abrir `index.html` directamente desde el sistema de archivos (protocolo `file://`) no permite validar correctamente el comportamiento de la Content Security Policy ni las reglas de redirección HTTPS. Para pruebas completas de seguridad se debe servir el proyecto desde un servidor HTTP local.

Se recomiendan las siguientes alternativas sin instalación adicional:

**Opción A — Live Server (VS Code):**
Instalar la extensión Live Server de Ritwick Dey desde el marketplace de VS Code, hacer clic derecho sobre `index.html` en el explorador de archivos y seleccionar "Open with Live Server". El servidor se levanta automáticamente en `http://localhost:5500`.

**Opción B — Python http.server:**
Ejecutar el siguiente comando desde el directorio raíz del proyecto:

```
python3 -m http.server 8080
```

Una vez ejecutado, acceder a `http://localhost:8080` en el navegador. Para detener el servidor presionar `Ctrl + C` en la terminal.

---

## Despliegue en Producción

### Apache

1. Copiar el contenido completo del directorio del proyecto al directorio web raíz del servidor, típicamente `/var/www/html/` o el directorio configurado en el VirtualHost activo:
   ```
   cp -r hola-tsoft/* /var/www/html/
   ```
2. Verificar que el archivo `.htaccess` esté presente en el directorio raíz del sitio. Este archivo contiene los headers de seguridad HTTP y las reglas de redirección de HTTP a HTTPS.
3. Verificar que el módulo `mod_headers` de Apache esté habilitado, ya que es necesario para que el archivo `.htaccess` pueda establecer los headers de seguridad. Habilitarlo con el siguiente comando:
   ```
   sudo a2enmod headers
   ```
4. Reiniciar el servicio de Apache para aplicar los cambios:
   ```
   sudo systemctl restart apache2
   ```

### Nginx

1. Copiar el contenido del proyecto al directorio configurado en el `server block` activo de Nginx, típicamente `/var/www/html/` o la ruta definida en la directiva `root` del bloque de servidor:
   ```
   cp -r hola-tsoft/* /var/www/html/
   ```
2. Verificar que el archivo de configuración de Nginx incluido en el proyecto esté referenciado desde el `server block` activo, o integrar manualmente sus directivas de headers de seguridad en el bloque de servidor correspondiente ubicado en `/etc/nginx/sites-available/`.
3. Verificar que la sintaxis de la configuración de Nginx sea válida antes de recargar el servicio:
   ```
   sudo nginx -t
   ```
4. Si la verificación de sintaxis es exitosa, recargar el servicio de Nginx para aplicar los cambios sin interrumpir conexiones activas:
   ```
   sudo systemctl reload nginx
   ```

### HTTPS — Requisito obligatorio

> **El despliegue en producción sin HTTPS no está soportado y viola la política de seguridad del proyecto.** Consultar el archivo [SECURITY.md](./SECURITY.md) para conocer la política completa de seguridad y los detalles de los controles implementados.

Para entornos de producción que no cuenten con un certificado SSL, se recomienda **Certbot con Let's Encrypt** como solución gratuita, automatizada y ampliamente adoptada para obtener y renovar certificados SSL/TLS. La documentación oficial de instalación y configuración para Apache y Nginx está disponible en [https://certbot.eff.org](https://certbot.eff.org).

---

## Configuración de Seguridad

Los siguientes headers de seguridad HTTP deben estar activos en el servidor de producción. Su configuración está incluida en los archivos `.htaccess` (Apache) y en el archivo de configuración de Nginx del proyecto.

| Header HTTP | Valor Recomendado | Propósito |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:` | Restringe las fuentes de recursos permitidas para prevenir ataques XSS y de inyección de contenido. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Fuerza el uso exclusivo de HTTPS durante un año e incluye el dominio en la lista de preload de navegadores. |
| `X-Frame-Options` | `DENY` | Impide que la página sea embebida en iframes, previniendo ataques de clickjacking. |
| `X-Content-Type-Options` | `nosniff` | Evita que el navegador intente inferir el tipo MIME de los recursos, previniendo ataques de MIME sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla la información de referencia enviada en las solicitudes, limitando la exposición de datos en navegación cross-origin. |

> **Nota:** La política de seguridad completa del proyecto, incluyendo decisiones de diseño, controles adicionales implementados y el procedimiento para reportar vulnerabilidades, está documentada en el archivo [SECURITY.md](./SECURITY.md).

---

## Cómo Agregar un Nuevo País

El sistema fue diseñado para que agregar un nuevo país sea una operación de un solo archivo. El único archivo que debe modificarse es `assets/js/greetings-data.js`. No es necesario tocar `index.html` ni `styles.css`.

Seguir los siguientes pasos:

1. Abrir el archivo `assets/js/greetings-data.js` en el editor de código.
2. Localizar el objeto principal de datos donde están definidas las entradas de los países existentes. Cada país es una entrada dentro de ese objeto.
3. Agregar una nueva entrada al objeto de datos. Cada entrada requiere los siguientes campos:
   - **Identificador único de país:** una clave de texto corta, en minúsculas y sin espacios, que identifica de forma única al país dentro del objeto. Por ejemplo, el identificador para Brasil podría ser `brasil`. Este identificador no se muestra al usuario.
   - **Nombre del país:** el nombre completo del país tal como debe aparecer en la tarjeta visible para el usuario.
   - **Código de bandera emoji:** el emoji de la bandera nacional del país. Los emojis de banderas están compuestos por dos letras del código ISO 3166-1 alpha-2 del país en formato de indicadores regionales.
   - **Frase coloquial en español:** el saludo o expresión típica y coloquial del país en español. Debe ser una expresión auténtica del habla cotidiana de esa región, no una traducción genérica.
   - **Frase coloquial en inglés:** la traducción o equivalente cultural del saludo en inglés, para cuando el usuario seleccione el idioma inglés en la interfaz.
4. Guardar el archivo.
5. Recargar la página en el navegador. La nueva tarjeta del país aparecerá automáticamente en la interfaz sin ningún paso adicional.

No se requiere modificar `index.html` ni `styles.css`. El motor de renderizado en `app.js` detecta automáticamente todas las entradas presentes en el objeto de datos y genera las tarjetas correspondientes en tiempo de ejecución.

---

## Internacionalización

El sistema soporta dos idiomas en su versión inicial: **español (ES)** e **inglés (EN)**. El español es el idioma predeterminado al cargar la página, dado que refleja el idioma primario de la mayoría de las oficinas TSOFT.

El mecanismo de cambio de idioma funciona de la siguiente manera: el motor en `app.js` mantiene una variable de estado que registra el idioma activo en cada momento. Cuando el usuario interactúa con el selector de idioma en la interfaz, esa variable se actualiza y el motor vuelve a recorrer el objeto de datos completo en `greetings-data.js`, leyendo el campo correspondiente al idioma activo para cada entrada de país. Las tarjetas se actualizan en el DOM de forma segura utilizando `textContent`, sin recargar la página.

Para agregar un tercer idioma en el futuro, el proceso es el siguiente: primero, añadir el campo del nuevo idioma en cada entrada del objeto de datos en `greetings-data.js`, con la frase coloquial traducida o adaptada culturalmente para ese idioma. Segundo, registrar el nuevo idioma en el mecanismo de selección dentro de `app.js`, de modo que el motor reconozca el nuevo identificador de idioma y sepa qué campo leer del objeto de datos cuando ese idioma esté activo. Tercero, agregar la opción correspondiente en el selector de idioma visible en la interfaz dentro de `index.html`. Este proceso está diseñado para ser aditivo: agregar un idioma no requiere modificar la lógica existente, solo extender los datos y registrar el nuevo identificador.

---

## Navegadores Soportados

| Navegador | Versión Mínima |
|---|---|
| Google Chrome | 51+ |
| Mozilla Firefox | 54+ |
| Apple Safari | 10+ |
| Microsoft Edge | 15+ |
| Opera | 38+ |
| Internet Explorer | No soportado |

El requisito técnico determinante es el soporte de **JavaScript ES6 (ECMAScript 2015)**, que incluye `const`, `let`, arrow functions, template literals, destructuring y el método `Array.prototype.forEach`. Todos los navegadores listados cumplen este requisito en las versiones indicadas.

---

## Contribución

Este proyecto sigue la metodología Hybrid documentada en el ticket **XP-8** de Jira. Para contribuir:

1. Crear una rama a partir de `main` con el nombre del ticket de Jira asociado al cambio.
2. Realizar los cambios siguiendo las convenciones de código existentes: sin frameworks externos, sin `innerHTML` con datos dinámicos, sin `eval()`.
3. Verificar que los headers de seguridad sigan activos y que la Content Security Policy no requiera relajarse para soportar el cambio.
4. Abrir un Pull Request describiendo el cambio, el ticket de Jira asociado y el resultado de las pruebas en navegadores soportados.

---

## Licencia

Uso interno TSOFT. Todos los derechos reservados © TSOFT 2024.