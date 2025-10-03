const Router = require('koa-router')
const AuthController = require('../controllers/authCtrl')
const AppointmentController = require('../controllers/appointmentCtrl')
const passport = require('../config/passport')

const router = new Router({ prefix: '/api' })

router.post('/signup', AuthController.signup)
router.post('/login', AuthController.login)
router.get('/getProfile', AuthController.getProfile)
router.post('/setProfile', AuthController.setProfile)
router.post('/createAppointment', passport.authenticate('jwt', { session: false }), AppointmentController.createAppointment)
router.get('/getAppointments', passport.authenticate('jwt', { session: false }), AppointmentController.getAppointments)

module.exports = router
