import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config({path:'variables.env'})
const createToken = (userLogin, secret, expiresIn)=>{
    const {user} = userLogin

    return jwt.sign({user}, secret, {expiresIn})
}

export default {
    Mutation:{
        setUser: async (parents, {user, password}, {models:{User}})=>{
            try{

                const userFound = await User.findOne({user})
                if(userFound) throw new Error('Usuario ya existe')

                const newUser = new User({
                    user,
                    password
                })

                await newUser.save() 
                .catch(err => {throw err} )

                console.log(newUser)
                return true
            }
            catch(err){
                console.log(err)
                throw err
                return false;
            }
        },
        authenticateUser: async (parents, {user,password}, {token} )=>{
            token()
            const nameUser = await User.findOne({user});
            
            if(!nameUser) throw new Error('Usuario no encontrado');

            const rigthPassword = await bcrypt.compare(password, nameUser.password);
            if(!rigthPassword) throw new Error('Password Incorrecto')
            else return{
                token: createToken(nameUser,process.env.SECRET,'1hr')
            } 

        }
            
    }
}