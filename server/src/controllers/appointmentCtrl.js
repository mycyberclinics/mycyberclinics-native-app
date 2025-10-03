const Appointment = require('../models/appointmentModel')

exports.createAppointment = async (ctx) => {
  const { userId, doctorId, time, notes } = ctx.request.body
  try {
    const appointment = new Appointment({ userId, doctorId, time, notes })
    await appointment.save()
    ctx.body = { success: true, appointment }
  } catch (err) {
    ctx.status = 500
    ctx.body = { success: false, message: err.message }
  }
}

exports.getAppointments = async (ctx) => {
  const { userId } = ctx.request.query
  try {
    const appointments = await Appointment.find({ userId })
    ctx.body = { success: true, appointments }
  } catch (err) {
    ctx.status = 500
    ctx.body = { success: false, message: err.message }
  }
}
