const Greeting = require('../models/greeting.model');

// Objeto repositorio que encapsula todo el acceso a datos de la colección greetings
const greetingRepository = {

  // Recupera todos los saludos activos ordenados alfabéticamente por nombre de país
  findAll: async () => {
    return await Greeting.find({ isActive: true }, { __v: 0 }).sort({ countryName: 1 });
  },

  // Busca un saludo activo por código de país exacto
  findByCountryCode: async (countryCode) => {
    return await Greeting.findOne({ countryCode: countryCode, isActive: true }, { __v: 0 });
  },

  // Busca un saludo por su ID de MongoDB sin filtrar por estado activo (uso administrativo)
  findById: async (id) => {
    return await Greeting.findById(id);
  },

  // Crea un nuevo documento de saludo usando instancia del modelo y save()
  create: async (greetingData) => {
    const greeting = new Greeting(greetingData);
    return await greeting.save();
  },

  // Actualiza un saludo por ID retornando el documento actualizado con validación de esquema
  updateById: async (id, updateData) => {
    return await Greeting.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  },

  // Elimina físicamente un documento por ID y retorna el documento eliminado
  deleteById: async (id) => {
    return await Greeting.findByIdAndDelete(id);
  },

  // Busca todos los saludos activos que coincidan con el idioma especificado
  findByLanguage: async (language) => {
    return await Greeting.find({ language: language, isActive: true }, { __v: 0 }).sort({ countryName: 1 });
  },

  // Cuenta el total de documentos con estado activo en la colección
  countActive: async () => {
    return await Greeting.countDocuments({ isActive: true });
  },

};

module.exports = greetingRepository;