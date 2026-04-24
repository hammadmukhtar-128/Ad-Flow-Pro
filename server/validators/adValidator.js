const Joi = require('joi');

const createAdSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  category: Joi.string().required(),
  city: Joi.string().required(),
  mediaURL: Joi.string().uri().allow('', null),
  package: Joi.string().valid('Basic', 'Standard', 'Premium').required(),
  publish_at: Joi.date().iso().allow(null).optional(),
});

const paymentSchema = Joi.object({
  transactionId: Joi.string().min(5).max(50).required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().required(),
  senderName: Joi.string().required(),
  screenshotUrl: Joi.string().uri().allow('', null),
});

module.exports = {
  createAdSchema,
  paymentSchema
};


