const greetingRepository = require('../repositories/greeting.repository');

const createServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const removeVersion = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj.__v;
  return obj;
};

const getAllActiveGreetings = async () => {
  try {
    const greetings = await greetingRepository.findAllActive();
    const mapped = greetings.map(removeVersion);
    mapped.sort((a, b) => a.countryName.localeCompare(b.countryName));
    return mapped;
  } catch (err) {
    if (err.statusCode) throw err;
    throw createServiceError('Internal service error', 500);
  }
};

const getGreetingByCountryCode = async (countryCode) => {
  try {
    const normalizedCode = countryCode.toUpperCase();

    if (normalizedCode.length !== 2) {
      throw createServiceError('Country code must be exactly 2 characters', 400);
    }

    const greeting = await greetingRepository.findByCountryCode(normalizedCode);

    if (!greeting) {
      throw createServiceError(`Greeting not found for country code: ${normalizedCode}`, 404);
    }

    return removeVersion(greeting);
  } catch (err) {
    if (err.statusCode) throw err;
    throw createServiceError('Internal service error', 500);
  }
};

const createGreeting = async ({ countryCode, countryName, language, greeting, formalGreeting, flagUrl }) => {
  try {
    const normalizedCode = countryCode.toUpperCase();

    if (normalizedCode.length !== 2) {
      throw createServiceError('Country code must be exactly 2 characters', 400);
    }

    if (!greeting || !greeting.trim()) {
      throw createServiceError('Greeting cannot be empty', 400);
    }

    if (!formalGreeting || !formalGreeting.trim()) {
      throw createServiceError('Formal greeting cannot be empty', 400);
    }

    const normalizedCountryName = countryName.trim().charAt(0).toUpperCase() + countryName.trim().slice(1);

    const existing = await greetingRepository.findByCountryCode(normalizedCode);
    if (existing) {
      throw createServiceError('Country code already exists', 409);
    }

    const newGreeting = await greetingRepository.create({
      countryCode: normalizedCode,
      countryName: normalizedCountryName,
      language,
      greeting: greeting.trim(),
      formalGreeting: formalGreeting.trim(),
      flagUrl,
      isActive: true,
    });

    return removeVersion(newGreeting);
  } catch (err) {
    if (err.statusCode) throw err;
    throw createServiceError('Internal service error', 500);
  }
};

const updateGreeting = async (countryCode, updateData) => {
  try {
    const normalizedCode = countryCode.toUpperCase();

    if (normalizedCode.length !== 2) {
      throw createServiceError('Country code must be exactly 2 characters', 400);
    }

    const allowedFields = ['countryName', 'language', 'greeting', 'formalGreeting', 'flagUrl', 'isActive'];
    const filteredData = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        filteredData[field] = updateData[field];
      }
    }

    if (filteredData.greeting !== undefined && (!filteredData.greeting || !filteredData.greeting.trim())) {
      throw createServiceError('Greeting cannot be empty', 400);
    }

    if (filteredData.formalGreeting !== undefined && (!filteredData.formalGreeting || !filteredData.formalGreeting.trim())) {
      throw createServiceError('Formal greeting cannot be empty', 400);
    }

    if (filteredData.greeting) {
      filteredData.greeting = filteredData.greeting.trim();
    }

    if (filteredData.formalGreeting) {
      filteredData.formalGreeting = filteredData.formalGreeting.trim();
    }

    if (filteredData.countryName) {
      filteredData.countryName = filteredData.countryName.trim().charAt(0).toUpperCase() + filteredData.countryName.trim().slice(1);
    }

    const updated = await greetingRepository.updateByCountryCode(normalizedCode, filteredData);

    if (!updated) {
      throw createServiceError(`Greeting not found for country code: ${normalizedCode}`, 404);
    }

    return removeVersion(updated);
  } catch (err) {
    if (err.statusCode) throw err;
    throw createServiceError('Internal service error', 500);
  }
};

const deleteGreeting = async (countryCode) => {
  try {
    const normalizedCode = countryCode.toUpperCase();

    if (normalizedCode.length !== 2) {
      throw createServiceError('Country code must be exactly 2 characters', 400);
    }

    const updated = await greetingRepository.updateByCountryCode(normalizedCode, { isActive: false });

    if (!updated) {
      throw createServiceError(`Greeting not found for country code: ${normalizedCode}`, 404);
    }

    return { success: true, message: 'Greeting deactivated successfully' };
  } catch (err) {
    if (err.statusCode) throw err;
    throw createServiceError('Internal service error', 500);
  }
};

const searchGreetingsByLanguage = async (language) => {
  try {
    const normalizedLanguage = language.trim().toLowerCase();
    const greetings = await greetingRepository.findActiveByLanguage(normalizedLanguage);
    return greetings.map(removeVersion);
  } catch (err) {
    if (err.statusCode) throw err;
    throw createServiceError('Internal service error', 500);
  }
};

module.exports = {
  getAllActiveGreetings,
  getGreetingByCountryCode,
  createGreeting,
  updateGreeting,
  deleteGreeting,
  searchGreetingsByLanguage,
};