import { ApolloServer } from 'apollo-server-express';

//Modelos de la base de datos
import models from '../models'

//JWT
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({path:'variables.env'})

//Mezclando types y resolvers
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
const typeDefs = mergeTypes(fileLoader(path.join(__dirname, '../api/types')));
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, '../api/resolvers')));

const server = new ApolloServer({typeDefs, resolvers,
    context: ({req})=>({ 
        models,
        token: async() =>{
            const token = req.headers['authorization'];
            console.log("| - Token - | : ", token)
            if(token !== "null"){
                try{
                    const actualUser = await jwt.verify(token,process.env.SECRET);
                    console.log(actualUser);

                    req.actualUser = actualUser
                    return actualUser
                }
                catch(err){
                    console.error(err)
                }
                
            }
            else return "Soy nuur"
        }
    })
});



export default server
    