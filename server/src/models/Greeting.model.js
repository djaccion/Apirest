const mongoose = require('mongoose');

const greetingSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      required: [true, 'El código de país es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, 'El código de país debe tener al menos 2 caracteres'],
      maxlength: [3, 'El código de país no puede tener más de 3 caracteres'],
      validate: {
        validator: function (value) {
          return /^[A-Za-z]+$/.test(value);
        },
        message: 'El código de país solo puede contener letras del alfabeto, sin números ni caracteres especiales',
      },
    },
    countryName: {
      type: String,
      required: [true, 'El nombre del país es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre del país debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre del país no puede tener más de 100 caracteres'],
    },
    language: {
      type: String,
      required: [true, 'El idioma es obligatorio'],
      trim: true,
      minlength: [2, 'El idioma debe tener al menos 2 caracteres'],
      maxlength: [50, 'El idioma no puede tener más de 50 caracteres'],
    },
    greeting: {
      type: String,
      required: [true, 'El saludo informal principal es obligatorio'],
      trim: true,
      minlength: [1, 'El saludo debe tener al menos 1 carácter'],
      maxlength: [200, 'El saludo no puede tener más de 200 caracteres'],
    },
    formalGreeting: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, 'El saludo formal no puede tener más de 200 caracteres'],
      default: '',
    },
    flagUrl: {
      type: String,
      required: [true, 'La URL de la bandera es obligatoria'],
      trim: true,
      validate: {
        validator: function (value) {
          return value.startsWith('/') || value.startsWith('https://');
        },
        message: 'Solo se permiten rutas relativas (comenzando con /) o URLs HTTPS (comenzando con https://). Las URLs HTTP no están permitidas.',
      },
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  {
    strict: true,
    timestamps: true,
    collection: 'greetings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice principal de búsqueda: countryCode ya tiene índice único declarado en el campo
// Se documenta aquí que es el campo de búsqueda principal de la colección

// Índice simple sobre isActive para filtrar eficientemente los saludos activos
greetingSchema.index({ isActive: 1 });

// Índice compuesto sobre language + isActive para consultas que filtren por idioma y estado activo
greetingSchema.index({ language: 1, isActive: 1 });

// Virtual: displayName - concatena countryName con language en formato legible
greetingSchema.virtual('displayName').get(function () {
  return `${this.countryName} (${this.language})`;
});

// Método estático: findAllActive
// Retorna todos los documentos activos ordenados alfabéticamente por countryName
greetingSchema.statics.findAllActive = function () {
  return this.find({ isActive: true })
    .sort({ countryName: 1 })
    .select('countryCode countryName language greeting formalGreeting flagUrl -__v');
};

// Método estático: findByCountryCode
// Busca un documento por código de país normalizado a uppercase con isActive: true
greetingSchema.statics.findByCountryCode = function (code) {
  const normalizedCode = code.toUpperCase();
  return this.findOne({ countryCode: normalizedCode, isActive: true }).select('-__v');
};

// Método de instancia: toSafeObject
// Retorna una representación plana del documento sin el campo __v
greetingSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Greeting = mongoose.model('Greeting', greetingSchema);

module.exports = Greeting;