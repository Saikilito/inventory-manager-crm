import bcrypt from 'bcrypt';

export default {
    Query:{
        getAllClients: (parent, args, {models}) => models.Client.find(),
        getClient: (parent, args, {models}) => models.Client.findOne(args)
    },
    Mutation:{
        setClient: async (parent, args, {models:{Client}}) =>{
            // console.log(args.input)
            try{
                const client = new Client(args.input)
                await client.save()
                            .then( resp => console.log(resp))
                return true

            }
            catch(err){
                console.log(erro)
                return false
            }
            
        }
    }
}