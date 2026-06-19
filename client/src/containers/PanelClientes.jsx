import React from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Spinkit from "../components/Spinkit";

import { Query } from "../components/ApolloBridge.jsx";
import { TOP_CLIENTS } from "../services/queries/graphics";

const TopClients = () => {
  return (
    <Query query={TOP_CLIENTS} pollInterval={1000}>
      {({ loading, error, data, startPolling, stopPolling }) => {
        if (loading) return <Spinkit />;
        if (error) return `Error ${error.message}`;

        const topClientsGraphics = [];

        if (data?.topClients) {
          data.topClients.forEach((e, i) => {
            topClientsGraphics[i] = {
              ...(e.client && e.client[0] ? e.client[0] : {}),
              total: e.total,
            };
          });
        }
        return (
          <div>
            {topClientsGraphics.length === 0 && (
              <p className="text-muted text-center my-2">No hay ventas registradas en estado COMPLETADO aún.</p>
            )}
            <BarChart
              width={600}
              height={300}
              data={topClientsGraphics}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
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

export default TopClients;
