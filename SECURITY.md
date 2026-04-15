# SECURITY.md

```markdown
# SECURITY.md — Política de Seguridad del Proyecto

---

## 1. Identificación del Proyecto

| Campo                        | Valor                                                                 |
|-----------------------------|-----------------------------------------------------------------------|
| **Proyecto**                | HOLA TSOFT                                                            |
| **Ticket Jira**             | XP-8                                                                  |
| **Versión del Documento**   | 1.0.0                                                                 |
| **Fecha de Creación**       | 2025-01-01                                                            |
| **Responsable de Seguridad**| Tech Lead — Equipo TSOFT                                              |

**Descripción:** Este documento define las políticas de seguridad implementadas en el proyecto HOLA TSOFT (XP-8) y los procedimientos oficiales para el reporte responsable de vulnerabilidades.

---

## 2. Alcance

### 2.1 Dentro del Alcance

Los siguientes activos están cubiertos por las políticas de seguridad definidas en este documento:

**Archivos fuente del proyecto:**
- `index.html` — Estructura HTML5 semántica y punto de entrada de la aplicación
- `greetings-data.js` — Módulo de datos de internacionalización (i18n)
- `app.js` — Motor de renderizado y lógica de la aplicación

**Archivos de configuración de servidor:**
- `.htaccess` — Configuración de seguridad para servidores Apache
- `nginx.conf` — Configuración de seguridad para servidores Nginx

**Activos estáticos:**
- Hojas de estilo CSS (`/css/`)
- Imágenes y recursos gráficos (`/img/`)
- Fuentes tipográficas (`/fonts/`)

### 2.2 Fuera del Alcance

Los siguientes elementos quedan explícitamente excluidos del alcance de este documento:

- Infraestructura del servidor de producción donde se aloja la aplicación
- Redes corporativas internas de TSOFT
- Sistemas de terceros, proveedores o integraciones externas
- Herramientas de CI/CD y pipelines de despliegue
- Dispositivos de los usuarios finales

---

## 3. Políticas de Seguridad Implementadas

### 3.1 Content Security Policy (CSP)

La siguiente directiva CSP está implementada mediante `<meta>` tag en el `<head>` de `index.html`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:
```

**Explicación de cada directiva:**

| Directiva              | Valor          | Propósito                                                                                                                                                   |
|------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `default-src`          | `'self'`       | Política de fallback para todos los tipos de recursos no especificados explícitamente. Bloquea cualquier recurso externo no declarado en otras directivas.   |
| `script-src`           | `'self'`       | Permite únicamente la ejecución de scripts alojados en el mismo origen. Previene la inyección y ejecución de scripts externos o inline no autorizados.      |
| `style-src`            | `'self'`       | Permite únicamente hojas de estilo del mismo origen. Previene ataques de CSS injection mediante hojas de estilo externas o estilos inline inyectados.       |
| `img-src`              | `'self' data:` | Permite imágenes del mismo origen y URIs de tipo `data:`. El valor `data:` es necesario para renderizar correctamente los emojis de banderas de países.     |

> **⚠️ Nota para el equipo de operaciones:** Esta misma directiva CSP debe replicarse como HTTP header en la configuración del servidor web. Los archivos `.htaccess` y `nginx.conf` del repositorio contienen la implementación de referencia. La configuración a nivel de header tiene precedencia sobre el meta tag y es la forma recomendada en producción.

---

### 3.2 Prevención de Cross-Site Scripting (XSS)

**Decisión arquitectónica fundamental:** Todo contenido dinámico generado por la aplicación se inserta en el DOM exclusivamente mediante la propiedad `textContent`. El uso de `innerHTML` con datos variables está prohibido en este proyecto.

**Justificación técnica:** La propiedad `textContent` trata el valor asignado como texto plano, escapando automáticamente cualquier markup HTML. Esto elimina por diseño el vector de ataque XSS por inyección de markup, ya que ningún string malicioso puede ser interpretado como HTML o JavaScript por el navegador.

**APIs explícitamente prohibidas en este proyecto:**

| API Prohibida                                    | Razón                                                                                      |
|--------------------------------------------------|--------------------------------------------------------------------------------------------|
| `element.innerHTML = variableExterna`            | Permite inyección de markup HTML y scripts maliciosos                                      |
| `eval()`                                         | Ejecuta código arbitrario como JavaScript, vector de ataque crítico                        |
| `document.write()`                               | Puede sobrescribir el documento completo e inyectar contenido malicioso                    |
| `setTimeout(string, delay)`                      | El primer argumento como string es evaluado como código, equivalente a `eval()`            |
| `setInterval(string, delay)`                     | Mismo riesgo que `setTimeout` con string como primer argumento                             |
| `new Function(string)`                           | Crea funciones a partir de strings, equivalente funcional a `eval()`                       |

**Práctica requerida en el código:**

```javascript
// ✅ CORRECTO — Uso seguro de textContent
element.textContent = datoDinamico;

// ❌ PROHIBIDO — Nunca usar innerHTML con datos variables
element.innerHTML = datoDinamico;
```

---

### 3.3 Política de Dependencias Externas

**Declaración:** El proyecto HOLA TSOFT (XP-8) tiene **cero dependencias externas de runtime** por decisión arquitectónica deliberada y documentada.

**Beneficios de seguridad de esta decisión:**

- **Eliminación de ataques de supply chain:** No existe superficie de ataque por compromisos de paquetes de terceros en el árbol de dependencias.
- **Eliminación de typosquatting en npm:** Al no utilizar ningún gestor de paquetes para dependencias de runtime, se elimina el riesgo de instalación accidental de paquetes maliciosos con nombres similares a paquetes legítimos.
- **Eliminación de riesgo por compromiso de CDNs externos:** Al no cargar ningún recurso desde CDNs de terceros (jsDelivr, unpkg, cdnjs, etc.), se elimina el riesgo de que un compromiso en dichos servicios afecte a esta aplicación.
- **Auditoría simplificada:** El 100% del código ejecutado en el navegador es código propio, auditable directamente en el repositorio.

**Procedimiento para incorporación futura de dependencias:**

Cualquier incorporación futura de una dependencia externa (runtime o desarrollo) debe:

1. Ser aprobada por el Tech Lead responsable de seguridad
2. Pasar por una auditoría de seguridad documentada
3. Registrarse en este archivo con justificación técnica y de negocio
4. Implementar Subresource Integrity (SRI) si se carga desde CDN externo
5. Ser evaluada periódicamente ante vulnerabilidades conocidas (CVEs)

---

### 3.4 Política de Almacenamiento de Datos en Cliente

**Declaración explícita:** El proyecto HOLA TSOFT (XP-8) **no utiliza ningún mecanismo de almacenamiento de datos en el cliente**. Las siguientes APIs están explícitamente excluidas del proyecto:

| Mecanismo              | Estado en este proyecto |
|------------------------|-------------------------|
| `localStorage`         | ❌ No utilizado          |
| `sessionStorage`       | ❌ No utilizado          |
| `IndexedDB`            | ❌ No utilizado          |
| Cookies (cualquier tipo) | ❌ No utilizadas        |
| Web SQL (deprecated)   | ❌ No utilizado          |
| Cache API              | ❌ No utilizada          |
| Service Workers        | ❌ No utilizados         |

**Implicaciones de privacidad y cumplimiento normativo:**

El proyecto no recopila, procesa ni almacena datos personales de ningún usuario. La aplicación es completamente stateless desde la perspectiva del cliente. En consecuencia:

- **GDPR (Reglamento General de Protección de Datos — UE):** No aplican obligaciones de consentimiento, registro de tratamiento ni derechos de acceso/supresión en esta versión del proyecto.
- **LGPD (Lei Geral de Proteção de Dados — Brasil):** No aplican obligaciones de la ley en esta versión del proyecto.
- **Otras regulaciones regionales de privacidad:** No aplican en esta versión dado que no existe tratamiento de datos personales.

> **Nota:** Si en versiones futuras se incorpora cualquier forma de analítica, telemetría o almacenamiento de datos de usuario, este documento debe actualizarse y se debe realizar una evaluación de impacto de privacidad (DPIA) antes del despliegue.

---

### 3.5 Headers de Seguridad HTTP Requeridos

El servidor de producción donde se aloje HOLA TSOFT **DEBE** configurar los siguientes headers HTTP en todas las respuestas. Su ausencia constituye una configuración insegura no aceptable para producción.

| Header HTTP                    | Valor Requerido                                                                 | Propósito                                                                                          |
|-------------------------------|---------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `Strict-Transport-Security`   | `max-age=31536000; includeSubDomains`                                           | Fuerza conexiones HTTPS durante mínimo un año e incluye todos los subdominios. Previene ataques de downgrade a HTTP. |
| `X-Frame-Options`             | `DENY`                                                                          | Prohíbe que la página sea embebida en `<iframe>`, `<frame>` o `<object>`. Previene ataques de clickjacking. |
| `X-Content-Type-Options`      | `nosniff`                                                                       | Impide que el navegador intente inferir el tipo MIME de una respuesta. Previene ataques de MIME type sniffing. |
| `Referrer-Policy`             | `strict-origin-when-cross-origin`                                               | Envía el origen completo en peticiones del mismo origen y únicamente el origen (sin path ni query) en peticiones cross-origin. |
| `Permissions-Policy`          | `geolocation=(), microphone=(), camera=()`                                      | Deshabilita explícitamente el acceso a geolocalización, micrófono y cámara. La aplicación no requiere ninguno de estos permisos. |
| `Content-Security-Policy`     | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:` | Replica la misma directiva CSP del meta tag HTML. La configuración a nivel de header tiene precedencia. |

> **Referencia de implementación:** Los archivos `.htaccess` (para Apache) y `nginx.conf` (para Nginx) incluidos en la raíz del repositorio contienen la implementación completa y lista para usar de todos estos headers. Se recomienda revisar dichos archivos antes del despliegue en producción.

---

### 3.6 Política de HTTPS

**Declaración:** El despliegue en producción de HOLA TSOFT es **obligatoriamente sobre HTTPS**. No se permite el acceso a la aplicación mediante HTTP sin cifrar en entornos de producción.

**Requisitos de configuración:**

- **Redirección HTTP → HTTPS:** Toda petición entrante por HTTP (puerto 80) debe ser redirigida permanentemente (código de estado HTTP `301 Moved Permanently`) a su equivalente HTTPS (puerto 443). Esta redirección debe configurarse a nivel de servidor, no de aplicación.
- **Versión de TLS:** El certificado y la configuración del servidor deben soportar mínimo **TLS 1.2**. Se recomienda **TLS 1.3** como versión preferente. Las versiones TLS 1.0 y TLS 1.1 deben estar explícitamente deshabilitadas por ser consideradas inseguras.
- **Validez del certificado:** El certificado TLS debe estar vigente y ser emitido por una Autoridad Certificadora (CA) reconocida. No se aceptan certificados autofirmados en producción.
- **Renovación del certificado:** El certificado debe renovarse antes de su fecha de expiración. Se recomienda configurar renovación automática.

> **Referencia:** Consultar el archivo `README.md` del repositorio para instrucciones detalladas sobre la obtención e instalación de un certificado TLS gratuito mediante **Let's Encrypt** y la herramienta **Certbot**, tanto para configuraciones Apache como Nginx.

---

## 4. Vulnerabilidades Conocidas y Aceptadas

La siguiente tabla registra las vulnerabilidades identificadas que han sido evaluadas y aceptadas formalmente por el equipo de seguridad, junto con la justificación técnica o de negocio para su aceptación.

| ID     | Descripción | Severidad | Justificación de Aceptación | Fecha de Revisión |
|--------|-------------|-----------|------------------------------|-------------------|
| —      | —           | —         | —                            | —                 |

> **Nota:** Esta tabla no contiene entradas en la versión 1.0.0 del documento. Las vulnerabilidades aceptadas deben revisarse obligatoriamente en cada release del proyecto para evaluar si la justificación de aceptación sigue siendo válida o si el riesgo ha cambiado. Toda nueva vulnerabilidad aceptada debe ser aprobada por el Tech Lead y registrada en esta tabla antes del despliegue.

---

## 5. Procedimiento de Reporte de Vulnerabilidades

### 5.1 Canal de Reporte

Los reportes de vulnerabilidades de seguridad deben enviarse **exclusivamente** al siguiente canal privado:

**📧 Correo de seguridad:** `security@tsoft.com`
*(Reemplazar con el correo oficial del equipo de seguridad de TSOFT antes del despliegue)*

**⛔ Prohibición explícita:** Está **estrictamente prohibido** reportar vulnerabilidades de seguridad como issues públicos en el repositorio mientras la vulnerabilidad no haya sido corregida y el parche desplegado en producción. La divulgación pública prematura de vulnerabilidades no corregidas pone en riesgo a los usuarios de la aplicación. Se solicita seguir el principio de **Divulgación Responsable (Responsible Disclosure)**.

Una vez que la vulnerabilidad haya sido corregida y el parche desplegado, el equipo de TSOFT coordinará con el reportante la divulgación pública coordinada si así se acuerda.

---

### 5.2 Información Requerida en el Reporte

Todo reporte de vulnerabilidad enviado al canal oficial debe incluir los siguientes campos para garantizar una evaluación eficiente:

1. **Descripción detallada de la vulnerabilidad:** Explicación clara y técnica de la vulnerabilidad encontrada, incluyendo el tipo de vulnerabilidad (XSS, CSRF, inyección, etc.) y el componente afectado.

2. **Pasos reproducibles:** Secuencia numerada y detallada de los pasos necesarios para reproducir la vulnerabilidad de forma consistente. Incluir capturas de pantalla, videos o pruebas de concepto (PoC) si están disponibles.

3. **Impacto potencial estimado:** Descripción del daño que podría causar la explotación exitosa de la vulnerabilidad (robo de datos, ejecución de código, denegación de servicio, etc.) y el perfil del atacante que podría explotarla.

4. **Versión o commit afectado:** Número de versión de la aplicación o hash del commit de Git donde se identificó la vulnerabilidad.

5. **Datos de contacto del reportante:** Nombre completo, correo electrónico y, opcionalmente, handle de GitHub o perfil profesional. Esta información se utilizará únicamente para la comunicación relacionada con el reporte y no será compartida con terceros.

---

### 5.3 Tiempos de Respuesta Comprometidos

El equipo de seguridad de TSOFT se compromete a los siguientes SLAs (Service Level Agreements) de respuesta, medidos desde la recepción del reporte en el canal oficial:

| Severidad    | Tiempo de Acuse de Recibo | Tiempo de Evaluación Inicial | Tiempo de Resolución Objetivo |
|--------------|---------------------------|------------------------------|-------------------------------|
| 🔴 Crítica   | < 4 horas                 | < 24 horas                   | < 72 horas                    |
| 🟠 Alta      | < 8 horas                 | < 72 horas                   | < 7 días                      |
| 🟡 Media     | < 24 horas                | < 7 días                     | < 30 días                     |
| 🟢 Baja      | < 48 horas                | < 14 días                    | < 90 días                     |

**Definición de severidades:**

- **Crítica:** Vulnerabilidad que permite ejecución remota de código, compromiso total de la aplicación o exposición masiva de datos. Requiere atención inmediata.
- **Alta:** Vulnerabilidad que permite escalada de privilegios, bypass de controles de seguridad o exposición significativa de datos.
- **Media:** Vulnerabilidad que requiere condiciones específicas para ser explotada o cuyo impacto es limitado en alcance.
- **Baja:** Vulnerabilidad con impacto mínimo, mejoras de hardening o hallazgos informativos.

> **Nota:** Los tiempos de resolución son objetivos comprometidos. Vulnerabilidades de alta complejidad técnica pueden requerir tiempos adicionales, en cuyo caso el equipo de seguridad comunicará proactivamente el estado al reportante.

---

## 6. Historial de Versiones del Documento

| Versión | Fecha      | Autor          | Cambios                                      |
|---------|------------|----------------|----------------------------------------------|
| 1.0.0   | 2025-01-01 | Tech Lead TSOFT | Versión inicial del documento de seguridad   |

---

## 7. Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [MDN Web Docs — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN Web Docs — textContent vs innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
- [Mozilla Observatory — Análisis de headers de seguridad](https://observatory.mozilla.org/)
- [Let's Encrypt — Certificados TLS gratuitos](https://letsencrypt.org/)
- [NIST — TLS Guidelines (SP 800-52 Rev. 2)](https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final)
- Archivo `.htaccess` — Implementación de referencia para Apache (incluido en este repositorio)
- Archivo `nginx.conf` — Implementación de referencia para Nginx (incluido en este repositorio)
- Archivo `README.md` — Instrucciones de despliegue con HTTPS y Let's Encrypt (incluido en este repositorio)

---

*Este documento es parte del proyecto HOLA TSOFT (XP-8) y debe mantenerse actualizado en cada release. Para consultas sobre el contenido de este documento, contactar al Tech Lead del proyecto.*