# Security Checklist — HOLA TSOFT

---

**Proyecto:** HOLA TSOFT
**Identificador de tarea Jira:** XP-8
**Versión del checklist:** 1.0.0
**Clasificación:** Interno — Uso restringido al equipo técnico
**Fecha de creación:** `[COMPLETAR: DD/MM/AAAA]`
**Responsable de última revisión:** `[COMPLETAR: Nombre y cargo]`
**Fecha de próxima revisión obligatoria:** `[COMPLETAR: DD/MM/AAAA]`

> ⚠️ **ADVERTENCIA:** Este checklist debe completarse en su totalidad y ser firmado (nombre del responsable registrado en el campo anterior) antes de cada release a producción. Un release sin checklist completado se considera un incumplimiento del proceso de seguridad del proyecto.

---

## 1. Cabeceras HTTP de Seguridad

> **Nota:** La configuración de estas cabeceras se implementa a nivel de servidor web, no en el código fuente de la aplicación. El archivo de referencia con la configuración completa es el `nginx.conf` o `.htaccess` incluido en la raíz del repositorio. Verificar que el archivo de configuración del servidor desplegado coincide con el archivo de referencia del repositorio antes de marcar estos ítems.

- [x] **Content-Security-Policy**
  - Valor requerido: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:`
  - Mitiga: inyección de scripts XSS y carga de recursos externos no autorizados (imágenes, estilos, iframes, fuentes de terceros).

- [x] **Strict-Transport-Security**
  - Valor requerido: `max-age=31536000; includeSubDomains`
  - Mitiga: ataques de downgrade de HTTPS a HTTP y secuestro de sesión por redirección a protocolo inseguro.

- [x] **X-Frame-Options**
  - Valor requerido: `DENY`
  - Mitiga: ataques de clickjacking mediante incrustación de la página en iframes de dominios externos.

- [x] **X-Content-Type-Options**
  - Valor requerido: `nosniff`
  - Mitiga: MIME-type sniffing, que permite a navegadores ejecutar recursos con tipo de contenido incorrecto como scripts.

- [x] **Referrer-Policy**
  - Valor requerido: `strict-origin-when-cross-origin`
  - Mitiga: filtración de información de rutas internas o parámetros de URL en la cabecera `Referer` al navegar hacia dominios externos.

- [x] **Permissions-Policy**
  - Valor requerido: `geolocation=(), microphone=(), camera=()`
  - Mitiga: acceso no autorizado a APIs sensibles del navegador que no son requeridas por este proyecto. Reduce la superficie de ataque ante scripts comprometidos.

- [x] **X-XSS-Protection**
  - Valor requerido: `1; mode=block`
  - Mitiga: ataques XSS reflejados en navegadores legacy que no implementan CSP. En navegadores modernos esta cabecera es redundante con CSP pero se mantiene por compatibilidad.

---

## 2. Revisión de Código Fuente Seguro

> Cada ítem de esta sección debe ser verificado manualmente por el desarrollador responsable antes de aprobar el merge a la rama principal (`main` o `production`). Se recomienda realizar la verificación con búsqueda global en el repositorio.

- [ ] **Ausencia de `eval()`**
  - Confirmar que no existe ninguna llamada a `eval()` en ningún archivo `.js` del proyecto.
  - Verificación: ejecutar `grep -rn "eval(" ./` desde la raíz del repositorio, o usar la búsqueda global del IDE (Ctrl+Shift+F en VS Code). El resultado debe ser cero coincidencias.

- [ ] **Ausencia de `document.write()`**
  - Confirmar que no existe ninguna llamada a `document.write()` en ningún archivo `.js` del proyecto.
  - Verificación: ejecutar `grep -rn "document\.write(" ./` desde la raíz del repositorio. El resultado debe ser cero coincidencias.

- [ ] **Uso seguro de `innerHTML`**
  - Confirmar que `innerHTML` no se utiliza en ningún punto donde el contenido provenga de una variable, parámetro, dato del objeto de configuración o cualquier fuente externa.
  - El único uso permitido de `innerHTML` es con literales de cadena completamente estáticos escritos directamente por el desarrollador en el código fuente, sin concatenación de variables.
  - Verificación: ejecutar `grep -rn "innerHTML" ./` y revisar manualmente cada coincidencia para confirmar que ninguna involucra variables o datos dinámicos.

- [ ] **Inserción de contenido dinámico exclusivamente mediante `textContent` o `createElement`**
  - Confirmar que todo contenido generado dinámicamente desde el objeto de datos `greetings-data.js` (nombres de países, frases coloquiales, emojis de banderas u otros campos) se inserta en el DOM exclusivamente mediante `textContent` o mediante `createElement` con `appendChild`.
  - Verificación: revisar el archivo `app.js` y confirmar que ningún dato proveniente de `greetings-data.js` se asigna a `innerHTML`, `outerHTML` ni se pasa a métodos que interpreten HTML.

- [ ] **Ausencia de referencias a recursos externos**
  - Confirmar que no existen URLs absolutas ni referencias a dominios externos en ningún archivo `.html`, `.css` ni `.js` del proyecto.
  - Esto incluye, de forma no exhaustiva: CDNs de librerías, Google Fonts, Adobe Fonts, scripts de Google Analytics, Google Tag Manager, Meta Pixel, píxeles de seguimiento de cualquier plataforma publicitaria, o cualquier URL que no sea una ruta relativa al propio servidor.
  - Verificación: ejecutar `grep -rn "http" ./` y `grep -rn "https" ./` en los archivos fuente. Cualquier coincidencia debe ser revisada y justificada. Las únicas excepciones permitidas son comentarios de documentación o este propio checklist.

- [ ] **Meta tag CSP presente y correcto en `index.html`**
  - Confirmar que el archivo `index.html` contiene en su sección `<head>` el siguiente meta tag con el valor exacto:
    ```html
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:">
    ```
  - El valor del atributo `content` debe coincidir exactamente con el definido en la Sección 1 de este checklist. Cualquier diferencia debe ser justificada y aprobada por el responsable de seguridad.

- [ ] **Ausencia de información sensible en código comentado**
  - Confirmar que no existe código comentado que contenga credenciales de acceso, tokens de API, contraseñas, rutas absolutas del servidor, direcciones IP internas, nombres de hosts de infraestructura o cualquier información que pueda facilitar el reconocimiento del entorno de producción.
  - Verificación: revisar manualmente los comentarios en todos los archivos `.html`, `.css` y `.js`. Prestar especial atención a bloques comentados de código que hayan sido desactivados temporalmente durante el desarrollo.

---

## 3. Gestión de Datos y Privacidad

- [x] **Sin escritura en `localStorage`**
  - Confirmar que la aplicación no escribe ningún dato en `localStorage` en ningún punto del flujo de ejecución.
  - Por diseño arquitectónico, la aplicación no requiere persistencia de estado entre sesiones.

- [x] **Sin escritura en `sessionStorage`**
  - Confirmar que la aplicación no escribe ningún dato en `sessionStorage` en ningún punto del flujo de ejecución.

- [x] **Sin uso de cookies**
  - Confirmar que la aplicación no crea, lee ni modifica cookies de ningún tipo, ni mediante JavaScript (`document.cookie`) ni mediante cabeceras `Set-Cookie` desde el servidor para esta aplicación específica.

- [x] **Sin peticiones de red a servicios externos**
  - Confirmar que no se realizan peticiones `fetch`, `XMLHttpRequest`, `axios` ni de ningún otro tipo desde el cliente hacia APIs externas, servicios de telemetría, plataformas de analítica o endpoints de terceros.
  - La aplicación opera completamente de forma estática y offline una vez cargados sus archivos.

- [x] **Sin recopilación de datos personales identificables**
  - Confirmar que no se recopila ningún dato personal identificable (PII) del usuario en ninguna parte del flujo de la aplicación. Esto incluye nombre, correo electrónico, dirección IP registrada, geolocalización, identificadores de dispositivo o cualquier dato que permita identificar a una persona física.

> **Nota sobre cumplimiento normativo:** Al no existir procesamiento, almacenamiento ni transmisión de datos personales en esta versión del proyecto, no aplica la obligación de implementar aviso de privacidad bajo el **Reglamento General de Protección de Datos (GDPR — UE 2016/679)** ni bajo la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP — México)**. Esta exención debe revisarse obligatoriamente si en versiones futuras se añaden funcionalidades que impliquen registro de usuarios, formularios de contacto, analítica de comportamiento, personalización o cualquier forma de procesamiento de datos del visitante.

---

## 4. Seguridad en Servidor y Despliegue

- [ ] **El servidor web tiene HTTPS habilitado con certificado TLS válido**
  - Confirmar que el dominio de producción responde exclusivamente en HTTPS (puerto 443) con un certificado TLS vigente emitido por una autoridad certificadora reconocida.
  - Verificación: acceder al dominio desde un navegador y confirmar que no existen advertencias de certificado. Opcionalmente usar [SSL Labs](https://www.ssllabs.com/ssltest/) para obtener calificación A o superior.

- [ ] **HTTP redirige automáticamente a HTTPS**
  - Confirmar que cualquier petición al puerto 80 (HTTP) es redirigida con código `301 Moved Permanently` hacia la versión HTTPS del sitio.
  - Verificación: ejecutar `curl -I http://[dominio]` y confirmar que la respuesta es un `301` con cabecera `Location` apuntando a `https://`.

- [ ] **Las cabeceras HTTP de seguridad de la Sección 1 están activas en el servidor de producción**
  - Confirmar que todas las cabeceras listadas en la Sección 1 están siendo enviadas por el servidor en cada respuesta HTTP.
  - Verificación: ejecutar `curl -I https://[dominio]` y revisar las cabeceras de respuesta, o usar la herramienta [Security Headers](https://securityheaders.com/) para obtener calificación A o superior.

- [ ] **El archivo de configuración del servidor (`nginx.conf` o `.htaccess`) desplegado coincide con el archivo de referencia del repositorio**
  - Confirmar que no se han realizado modificaciones manuales al archivo de configuración del servidor en el entorno de producción que no estén reflejadas en el repositorio.
  - Verificación: comparar el hash MD5 o SHA-256 del archivo en producción con el del repositorio, o revisar el historial de cambios del servidor.

- [ ] **El directorio raíz del servidor no expone listado de archivos (directory listing deshabilitado)**
  - Confirmar que acceder a un directorio sin archivo `index.html` devuelve un error `403 Forbidden` o `404 Not Found`, no un listado de archivos del sistema.
  - Verificación: intentar acceder a `https://[dominio]/docs/` u otro subdirectorio y confirmar que no se muestra el contenido del directorio.

- [ ] **Los archivos de configuración y documentación interna no son accesibles públicamente**
  - Confirmar que los archivos `README.md`, `SECURITY.md`, `security-checklist.md`, `nginx.conf`, `.htaccess` y cualquier archivo de la carpeta `docs/` no son servidos públicamente por el servidor web.
  - Verificación: intentar acceder a `https://[dominio]/docs/security-checklist.md` y confirmar que la respuesta es `403` o `404`.

- [ ] **La versión del servidor web no se expone en cabeceras de respuesta**
  - Confirmar que las cabeceras `Server` y `X-Powered-By` no revelan la versión exacta del software del servidor (por ejemplo, `nginx/1.24.0` debe aparecer solo como `nginx` o estar completamente omitida).
  - Verificación: ejecutar `curl -I https://[dominio]` y revisar el valor de la cabecera `Server`.

- [ ] **El despliegue se realizó desde la rama protegida del repositorio, no desde una rama de desarrollo**
  - Confirmar que el artefacto desplegado en producción proviene del último commit aprobado en la rama `main` (o la rama de producción definida en el flujo de trabajo del equipo), y que dicho commit tiene al menos una revisión de código aprobada.

- [ ] **Se ha realizado una prueba de carga básica o verificación de disponibilidad post-despliegue**
  - Confirmar que tras el despliegue se verificó que la aplicación responde correctamente en el dominio de producción, que todos los archivos estáticos cargan sin errores `404` y que la consola del navegador no muestra errores de JavaScript ni violaciones de CSP.

---

*Fin del documento — HOLA TSOFT Security Checklist v1.0.0 — XP-8*