import { gql } from '@apollo/client';

export const USUARIO_ACTUAL = gql`
    query getUser{
        getUser{
            _id,
            user,
            name,
            rol
        }
    }
`;