import gql from 'graphql-tag';

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