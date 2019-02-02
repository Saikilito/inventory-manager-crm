import mongoose, { Schema } from 'mongoose';
// import validate from 'mongoose-validator';

const pedidoSchema = Schema({
    pedido: Array,
    total: Number,
    fecha: Date,
    cliente: mongoose.Types.ObjectId,
    estado: String
});

const pedidoModel = mongoose.model('Order', pedidoSchema);

export default pedidoModel ;