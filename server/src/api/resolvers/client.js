// import bcrypt from 'bcrypt';

export default {
    Query:{
        getAllClients: (parent, args, {models}) => models.Client.find().limit(args.limite),
        getClient: (parent, args, {models}) => models.Client.findOne(args)
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
                console.log("Recibiendo-------", args)
                const {_id,input} = args;
                await Client.findOneAndUpdate({_id},input, {new:false})
                            .then( resp => console.log("Mongo",resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.log(err)
                return false
            }
        },
        deleteClient: async (parent, args, {models:{Client}})=>{
            try{
                console.log("--id-- ",args);
                await Client.findOneAndDelete(args)
                            .then( resp => console.log("Cliente Eliminado", resp))
                            .catch( err => {throw err} )
                return true
            }
            catch(err){
                console.log(err)
                return false
            }
        }
    }
}