import bcrypt from 'bcrypt';

export default {
    Query:{
        getAllClients: (parent, args, {models}) => models.Client.find(),
        getClient: (parent, args, {models}) => models.Client.findOne(args)
    },
    Mutation:{
        setClient: async (parent, args, {models:{Client}}) =>{
            console.log(args.input)
            const client = new Client(args.input)
            const resp = await client.save()
                        .then(  newClient => console.log(newClient) )
                        .catch( error => console.log(error) )
            console.log("-----",resp);
            return resp
            
        }
    }
}