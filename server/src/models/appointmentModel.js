const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AppointmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
  time: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  notes: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Appointment', AppointmentSchema)
