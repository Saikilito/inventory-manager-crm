import mongoose from 'mongoose';

export default {
    Query:{
        getAllClients: (parent, {limite, offset, sellerID}, {models:{Client}}) => {
            let idSistem = {sellerID}
            if(!sellerID) idSistem = {}
            return Client.find(idSistem).limit(limite).skip(offset)
        },
        getClient: (parent, args, {models:{Client}}) => Client.findOne(args),
        totalClients: (parent, args, {models:{Client}}) => Client.countDocuments(args).catch((err)=>console.error(err))
    },
    Mutation:{
        setClient: async (parent, args, {models:{Client}}) =>{
            try{
                console.log("Recibiendo-------", args)
                const client = new Client(args.input)
                await client.save()
                            .then( resp => console.log(resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.log(err)
                return false
            }
            
        },
        updateClient: async (parent, args, {models:{Client}})=>{
            try{
                const {input} = args;
                console.log("inputID", input._id)
                const {nombre, apellido, empresa, edad, emails, tipo} = input
                const argsInput = {nombre, apellido, empresa, edad, emails, tipo}
                await Client.findOneAndUpdate({_id: input._id},input, {new:false})
                            .then( resp => console.log("Mongo",resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.error(err)
                return false;
            }
        },
        deleteClient: async(parent, args, {models:{Client}})=>{
            try{                
                await Client.findOneAndDelete(args)
                    .then("Cliente Eliminado")
                    .catch(err=>{throw err})
                return true;
            }
            catch(err){
                console.error(err)
                return false;
            }
        }
    }
}   