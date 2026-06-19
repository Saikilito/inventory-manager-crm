import React from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Spinkit from "../components/Spinkit";

import { Query } from "../components/ApolloBridge.jsx";
import { TOP_SELLERS } from "../services/queries/graphics";

const TopSellers = () => {
  return (
    <Query query={TOP_SELLERS} pollInterval={1000}>
      {({ loading, error, data, startPolling, stopPolling }) => {
        if (loading) return <Spinkit />;
        if (error) return `Error ${error.message}`;

        const topSellersGraphics = [];

        if (data?.topSellers) {
          data.topSellers.forEach((e, i) => {
            topSellersGraphics[i] = {
              ...(e.seller && e.seller[0] ? e.seller[0] : {}),
              total: e.total,
            };
          });
        }
        return (
          <div>
            {topSellersGraphics.length === 0 && (
              <p className="text-muted text-center my-2">No hay ventas registradas en estado COMPLETADO aún.</p>
            )}
            <BarChart
              width={600}
              height={300}
              data={topSellersGraphics}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </div>
        );
      }}
    </Query>
  );
};

export default TopSellers;
