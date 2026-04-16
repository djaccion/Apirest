module.exports = {
  // Entornos de ejecución activos
  env: {
    node: true,
    es2021: true,
    jest: true,
  },

  // Configuraciones base (el orden importa para resolución de conflictos)
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended',
  ],

  // Plugins requeridos
  plugins: [
    'security',
    'node',
  ],

  // Opciones del parser
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
  },

  rules: {
    // =========================================================
    // Bloque 1: Calidad General de Código
    // =========================================================

    // En producción usar logger estructurado, no console directamente
    'no-console': 'warn',

    // Error en variables no usadas, excepto las que empiezan con _ (patrón intencional en callbacks Express)
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // Prohibir var, obligar uso de const y let
    'no-var': 'error',

    // Usar const siempre que la variable no sea reasignada
    'prefer-const': 'error',

    // Prohibir == y !=, obligar === y !==
    'eqeqeq': ['error', 'always'],

    // Siempre usar llaves en bloques if/else/for/while
    'curly': ['error', 'all'],

    // =========================================================
    // Bloque 2: Seguridad (crítico para DevSecOps)
    // =========================================================

    // Previene acceso inseguro a propiedades de objetos con variables no validadas (prototype pollution)
    'security/detect-object-injection': 'error',

    // Detecta construcción de RegExp con strings dinámicos (vector de ReDoS)
    'security/detect-non-literal-regexp': 'error',

    // Detecta expresiones regulares con backtracking catastrófico
    'security/detect-unsafe-regex': 'error',

    // Detecta uso inseguro de Buffer
    'security/detect-buffer-noassert': 'error',

    // Alerta sobre uso de child_process, debe ser revisado manualmente
    'security/detect-child-process': 'warn',

    // Detecta deshabilitación del escape de mustache
    'security/detect-disable-mustache-escape': 'error',

    // Prohibir eval con expresiones dinámicas
    'security/detect-eval-with-expression': 'error',

    // Detecta uso del constructor Buffer() deprecado e inseguro
    'security/detect-new-buffer': 'error',

    // Detecta ausencia de protección CSRF antes de method-override
    'security/detect-no-csrf-before-method-override': 'error',

    // Detecta comparaciones de strings vulnerables a timing attacks (relevante para tokens y contraseñas)
    'security/detect-possible-timing-attacks': 'error',

    // Prohibir Math.random() para valores de seguridad, obligar uso de crypto
    'security/detect-pseudoRandomBytes': 'error',

    // =========================================================
    // Bloque 3: Buenas Prácticas Node.js
    // =========================================================

    // Desactivar porque archivos de config y testing requieren devDependencies
    'node/no-unpublished-require': 'off',

    // Consistente con runtime Node.js 18 declarado en el Dockerfile
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        version: '18.0.0',
        ignores: [],
      },
    ],

    // Detecta imports de módulos que no existen en node_modules
    'node/no-missing-require': 'error',

    // Detecta imports de paquetes no declarados en package.json
    'node/no-extraneous-require': 'error',

    // =========================================================
    // Bloque 4: Estilo de Código (consistencia del equipo)
    // =========================================================

    // Punto y coma obligatorio
    'semi': ['error', 'always'],

    // Comillas simples para strings
    'quotes': ['error', 'single', { avoidEscape: true }],

    // Indentación de 2 espacios, consistente con proyectos Node.js/Express estándar
    'indent': ['error', 2, { SwitchCase: 1 }],

    // Coma al final de elementos en arrays, objetos y parámetros multilínea
    'comma-dangle': ['error', 'always-multiline'],
  },
};