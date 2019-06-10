import React from 'react';

import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';
import Spinkit from '../components/Spinkit';

import { Query } from 'react-apollo';
import { TOP_SELLERS } from '../services/queries/graphics';

const TopSellers = () => {
    return (
        <Query query={TOP_SELLERS} pollInterval={1000}>
        {({ loading, error, data, startPolling, stopPolling }) => {
				if (loading) return <Spinkit/>;
				if (error) return `Error ${error.message}`;
                console.log(data)
                const topSellersGraphics = []
            
                data.topSellers.map((e,i)=>{
                    topSellersGraphics[i] = {
                        ...e.seller[0],
                        total: e.total
                    }
                    return null;
                })
				return (
                     <BarChart width={600} height={300} data={topSellersGraphics}
                        margin={{top:5, right:30, left:20, bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
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

export default TopSellers;
