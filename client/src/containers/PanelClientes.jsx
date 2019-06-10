import React from 'react';

import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';
import Spinkit from '../components/Spinkit';

import { Query } from 'react-apollo';
import { TOP_CLIENTS } from '../services/queries/graphics';

const TopClientes = () => {
    return (
        <Query query={TOP_CLIENTS} pollInterval={1000}>
        {({ loading, error, data, startPolling, stopPolling }) => {
				if (loading) return <Spinkit/>;
				if (error) return `Error ${error.message}`;

                const topClientsGraphics = []

                data.topClients.map((e,i)=>{
                    topClientsGraphics[i] = {
                        ...e.client[0],
                        total: e.total
                    }
                    return null;
                })
				return (
                     <BarChart width={600} height={300} data={topClientsGraphics}
                        margin={{top:5, right:30, left:20, bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="nombre"/>
                        <YAxis/>
                        <Tooltip/>
                        <Bar dataKey="total" fill="#82ca9d"/>
                    </BarChart>
                 )
             }
        }
        </Query>
    );
}

export default TopClientes;
