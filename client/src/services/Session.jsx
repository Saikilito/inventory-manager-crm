import React from 'react';
import { Query } from 'react-apollo';
import { USUARIO_ACTUAL} from './queries/users'

const Session = Component => props =>(
        <Query query={USUARIO_ACTUAL}>
        {
            ({loading,error, data, refetch})=>{
                if(loading) return null;
                return(
                    <Component {...props} session={data} refetch={refetch}/>
                )
            }
        }
        </Query>
);

export default Session;

