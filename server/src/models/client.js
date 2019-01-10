import mongoose, { Schema } from 'mongoose';
import validate from 'mongoose-validator';

const clientSchema = new Schema({
    nombre:String,
    apellido:String,  
    empresa: String,
    emails:{
        type:[],
        default:[],
        unique:true
    },
    edad: Number,
    tipo: String,
    pedidos:{type:[], default:[]}
});

const clientModel = mongoose.model('Client', clientSchema);

export default clientModel ;