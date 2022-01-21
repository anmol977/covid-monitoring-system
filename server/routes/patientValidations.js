const joi = require('joi');

const patientSignupValidation = data => {
     const schema = joi.object({
          fullName: joi.string().required(),
          email: joi.string().email().required(),
          phoneNumber: joi.string().required().max(10).min(10),
          password: joi.string().required().min(8),
          dob: joi.string().required(),
          roomNo: joi.string()
     })
     return schema.validate(data);
}

const patientLogInValidation = data => {
     const schema = joi.object({
          fullName: joi.string(),
          email: joi.string().email().required(),
          phoneNumber: joi.string().max(10).min(10),
          password: joi.string().required(),
     })
     return schema.validate(data);
}

const patientJwtValidation = data => {
     const schema = joi.object({
          authorization: joi.required()
     }).unknown(true);
     return schema.validate(data);
}

module.exports = { patientSignupValidation, patientLogInValidation, patientJwtValidation };
