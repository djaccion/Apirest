const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      unique: true,
      trim: true,
      minlength: [4, 'El nombre de usuario debe tener al menos 4 caracteres'],
      maxlength: [30, 'El nombre de usuario no puede superar los 30 caracteres'],
      lowercase: true,
      match: [
        /^[a-zA-Z0-9_]+$/,
        'El nombre de usuario solo puede contener caracteres alfanuméricos y guiones bajos',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'El hash de contraseña es obligatorio'],
      minlength: [
        60,
        'El campo passwordHash debe contener un hash válido de al menos 60 caracteres',
      ],
    },
    role: {
      type: String,
      required: [true, 'El rol del usuario es obligatorio'],
      enum: {
        values: ['admin', 'superadmin'],
        message: 'El rol "{VALUE}" no es válido. Los roles permitidos son: admin, superadmin',
      },
      default: 'admin',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: [true, 'El estado activo del usuario es obligatorio'],
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      min: [0, 'El contador de intentos de login no puede ser negativo'],
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    strict: true,
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

userSchema.methods.isLocked = function () {
  if (this.lockedUntil && this.lockedUntil > Date.now()) {
    return true;
  }
  return false;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  return {
    _id: obj._id,
    username: obj.username,
    role: obj.role,
    isActive: obj.isActive,
    lastLogin: obj.lastLogin,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

userSchema.statics.findByUsername = function (username) {
  const normalizedUsername = username.toLowerCase().trim();
  return this.findOne({ username: normalizedUsername });
};

userSchema.pre('save', function (next) {
  if (this.isModified('username')) {
    this.username = this.username.toLowerCase().trim();
  }

  // NOTA: El hash de contraseña NO se realiza en este hook.
  // Esa responsabilidad pertenece exclusivamente a la capa de servicio (UserService).
  // Este modelo solo almacena el hash ya procesado en el campo passwordHash.

  next();
});

userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    delete ret.loginAttempts;
    delete ret.lockedUntil;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;