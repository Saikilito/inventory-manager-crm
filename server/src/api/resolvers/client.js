// import bcrypt from 'bcrypt';

export default {
    Query:{
        getAllClients: (parent, args, {models}) => models.Client.find(),
        getClient: (parent, args, {models}) => models.Client.findOne(args)
    },
    Mutation:{
        setClient: async (parent, args, {models:{Client}}) =>{
            console.log(args)
            try{
                const client = new Client(args.input)
                await client.save()
                    .then(res => { console.log('Salvado',res) })
                    .catch(err => { throw err });
                return true
            }
            catch(err){
                console.log("Error al salvar", err)
                return false
            }
        },
        updateClient: async (parent, args, {models:{Client}}) =>{
            try{
                await Client.findOneAndUpdate(args.input._id,args.input, {new: false})
                    .then("Cliente Actualizado")
                    .catch(err=>{throw err})
                return true
            }
            catch(err){
                console.error(err)
                return false;
            }
        },
        deleteClient: async(parent, {_id}, {models:{Client}})=>{
            try{                
                await Client.findOneAndDelete(_id)
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