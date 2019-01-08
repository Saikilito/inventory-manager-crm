import bcrypt from 'bcrypt';

const formatErrors = (error, otherErrors) =>{
    const errors = error.errors
    let objErrors = []

    if(errors){
        Object.entries(errors).map(error=>{
            const {path, message} = error[1]
            objErrors.push({path, message})
        });

        objErrors = objErrors.concat(otherErrors)
        console.log(objErrors);
        return objErrors;
    }
    else if(otherErrors.length){
        console.log(otherErrors)
        return otherErrors
    }

    const unknowError = {}

    switch(error.code)
    {
        case 11000:
            unknowError.path = "username"
            unknowError.message = "Nombre de usuario ya existe"
            break;
        default: 
            unknowError.path = "Desconocido"
            unknowError.message = error.message
    }

    console.log([unknowError])
    return [unknowError]
}

export default {
    Query:{
        // HolaBebe: (parent, args, context, info) => "Beebeee!"
        allUsers: (parent, args, {models}) => models.User.find(),
        getUser: (parent, args, {models}) => models.User.findOne(args)
    },
    Mutation:{
        createUser: async (parent, args, {models}) => {
            const otherErrors = []
            try{
                const {password} = args
                if(password.length <= 8 ){
                    otherErrors.push({path:'password', message:'Password debe ser mayor a 8 caracteres'});
                    throw otherErrors ;
                }

                const hashPassword = await bcrypt.hash(password, 8)
                console.log(hashPassword);
                const user = await models.User.create({...args, password: hashPassword})
                console.log("Usuario",user)
                
                const band = (user && user._id) ? true : false ;
                console.log("try:", band)

                return {
                    success: band ,
                    errors:[]
                }
            }
            catch(error){
                console.log("Reject");
                return {
                    success: false,
                    errors: formatErrors(error, otherErrors)
                };
            }
        }
    }
}