const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const utils = require('../utils');
const logger = require('../logger');
const { staticVars } = require('../utils');
const { generateUserToken, validateJwtToken } = require('../auth/jwt');
const { patientSignupValidation, patientLogInValidation, patientJwtValidation } = require('./patientValidations');
const { patientEmailExists, patientPhoneExists, create, getPatientDetails, checkPatientExists } = require('../stores/patientStore');

router.post('/patient/signUp', async (req, res, next) => {
     const { error } = patientSignupValidation(req.body)
     let user;
     if (error) {
          logger.error(error);
          return res.status(400).send({
               error: error.details[0].message,
               message: utils.staticVars.GENERAL_ERROR
          });
     } else {
          try {
               const { email, phoneNumber, dob, fullName, password, roomNo } = req.body;
               let userExists = await checkPatientExists(email);
               if (userExists.rows[0].sumcount != 0) {
                    logger.info(`email ${email} or number ${phoneNumber} already exists, could not sign-up`);
                    return res
                         .status(400)
                         .send(
                              {
                                   error: utils.staticVars.SIGNUP_ERROR,
                                   message: utils.staticVars.ALREADY_EXISTS,
                                   data: null
                              }
                         );
               }
               let userId = await create({ email, phoneNumber, dob, fullName, password, roomNo });
               user = await getPatientDetails(userId[0]);
               logger.info(`user created successfully, id : ${user.id}`);
               let token = generateUserToken({ id: user.id, email: user.email, scope: 'Patient' });
               res.cookie('authorization', token, { httpOnly: true });
               return res
                    .status(200)
                    .send(
                         {
                              error: '',
                              message: 'user created successfully',
                              data: user
                         }
                    )
          } catch (e) {
               logger.error(e)
               return res.status(500).send({ error: e, data: null });
          }
     }
})

router.post('/patient/login/email', async (req, res, next) => {
     try {
          if (req.headers.authorization) {
               const { error } = patientJwtValidation(req.headers);
               if (error) {
                    logger.error(error);
                    return res.status(400).send({ error: error.details[0].message });
               } else {
                    const token = req.headers.authorization;
                    const payload = validateJwtToken(token, res, next);
                    if (payload.scope === 'Patient') {
                         let userDetails = await getPatientDetails(payload.id);
                         if (userDetails) {
                              return res
                                   .status(200)
                                   .send({
                                        error: '',
                                        message: 'Logged In successfully',
                                        data: userDetails,
                                   });
                         } else {
                              return res
                                   .status(400)
                                   .send({
                                        error: utils.staticVars.GENERAL_ERROR,
                                        data: null
                                   });
                         }
                    }
               }
          }
     } catch (e) {
          logger.error(e);
          return res
               .status(500)
               .send({
                    error: e,
                    data: null
               });
     }
     const { error } = patientLogInValidation(req.body);
     if (error) {
          logger.error(error);
          return res.status(400).send(error.details[0].message);
     } else {
          try {
               const { email, password } = req.body;
               let emailExists = await patientEmailExists(email);
               if (!emailExists) {
                    return res
                         .status(400)
                         .send({
                              error: `email ${email} does not exist, failed to Log-In`,
                              data: null
                         })
               }
               else {
                    let userDetails = await getPatientDetails(emailExists.id);
                    let passwordMatch = bcrypt.compareSync(password, emailExists.password);
                    if (passwordMatch) {
                         let token = generateUserToken({ id: userDetails.id, email: userDetails.email, scope: 'Patient' });
                         res.cookie('authorization', token, { httpOnly: true });
                         return res
                              .status(200)
                              .send({
                                   error: '',
                                   message: 'Logged In successfully',
                                   data: userDetails,
                              });
                    } else {
                         return res
                              .status(400)
                              .send({
                                   error: 'Incorrect Password, failed to Log-In',
                                   data: null
                              });
                    }
               }
          } catch (e) {
               logger.error(e);
               return res
                    .status(500)
                    .send({
                         error: e,
                         data: null
                    });
          }
     }
})


module.exports = router;
