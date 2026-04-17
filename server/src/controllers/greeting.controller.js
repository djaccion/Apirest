const { validationResult } = require('express-validator');
const greetingService = require('../services/greeting.service');

const getAllGreetings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const isActive = req.query.isActive !== undefined
      ? req.query.isActive === 'true'
      : undefined;

    const result = await greetingService.getAllGreetings({ page, limit, isActive });

    return res.status(200).json({
      success: true,
      data: result.data,
      metadata: {
        totalCount: result.totalCount,
        currentPage: page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getGreetingByCountryCode = async (req, res, next) => {
  try {
    const countryCode = req.params.countryCode.toUpperCase();

    const greeting = await greetingService.getGreetingByCountryCode(countryCode);

    if (!greeting) {
      return res.status(404).json({
        success: false,
        message: 'Greeting not found for the specified country code.',
      });
    }

    return res.status(200).json({
      success: true,
      data: greeting,
    });
  } catch (error) {
    return next(error);
  }
};

const createGreeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      countryCode,
      countryName,
      language,
      greeting,
      formalGreeting,
      flagUrl,
      isActive,
    } = req.body;

    const greetingData = {
      countryCode,
      countryName,
      language,
      greeting,
      formalGreeting,
      flagUrl,
      isActive,
    };

    const created = await greetingService.createGreeting(greetingData);

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A greeting for this country code already exists.',
      });
    }
    return next(error);
  }
};

const updateGreeting = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
      });
    }

    const countryCode = req.params.countryCode.toUpperCase();

    const {
      countryName,
      language,
      greeting,
      formalGreeting,
      flagUrl,
      isActive,
    } = req.body;

    const updateData = {
      countryName,
      language,
      greeting,
      formalGreeting,
      flagUrl,
      isActive,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updated = await greetingService.updateGreeting(countryCode, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Greeting not found for the specified country code.',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteGreeting = async (req, res, next) => {
  try {
    const countryCode = req.params.countryCode.toUpperCase();

    const deleted = await greetingService.deleteGreeting(countryCode);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Greeting not found for the specified country code.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Greeting deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

const searchGreetings = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search parameter q is required.',
      });
    }

    if (q.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Search term must not exceed 100 characters.',
      });
    }

    const results = await greetingService.searchGreetings(q.trim());

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllGreetings,
  getGreetingByCountryCode,
  createGreeting,
  updateGreeting,
  deleteGreeting,
  searchGreetings,
};