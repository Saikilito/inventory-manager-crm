import mongoose from 'mongoose';
import validate from 'mongoose-validator';

const clientSchema = mongoose.Schema({
    nombre:String,
    apellido:String,  
    empresa: String,
    email:String,
    edad: Number,
    tipo: String,
    pedidos:{type:[], default:[]}
});

const clientModel = mongoose.model('Client', clientSchema);

export default clientModel ;