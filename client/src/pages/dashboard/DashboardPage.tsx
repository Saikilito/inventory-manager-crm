import React, { useEffect, Fragment } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useDashboardPloc } from '@contexts/dashboard-context';
import { DashboardStateKind } from '@modules/dashboard/presentation/ploc/dashboard-state';

// @ts-ignore
import Spinkit from '../../components/Spinkit';

export const DashboardPage: React.FC = () => {
  const ploc = useDashboardPloc();
  const state = usePlocState(ploc);

  useEffect(() => {
    ploc.loadStats();
  }, [ploc]);

  return (
    <Fragment>
      {match(state)
        .with({ kind: DashboardStateKind.LOADING }, () => (
          <div className="text-center my-5">
            <Spinkit />
          </div>
        ))
        .with({ kind: DashboardStateKind.ERROR }, (st) => (
          <div className="alert alert-danger text-center my-5" role="alert">
            <b>Error:</b> {st.errorMessage}
          </div>
        ))
        .with({ kind: DashboardStateKind.LOADED }, (st) => (
          <div className="row justify-content-center">
            {/* Top Clients Chart */}
            <div className="col-md-6 mb-5">
              <h1 className="text-center my-5" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                Top 10 clientes que más compran
              </h1>
              {st.topClients.length === 0 ? (
                <p className="text-muted text-center my-5">No hay ventas registradas en estado COMPLETADO aún.</p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={st.topClients}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="clientName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Sellers Chart */}
            <div className="col-md-6 mb-5">
              <h1 className="text-center my-5" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                Top 10 mejores Vendedores
              </h1>
              {st.topSellers.length === 0 ? (
                <p className="text-muted text-center my-5">No hay ventas registradas en estado COMPLETADO aún.</p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={st.topSellers}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sellerName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))
        .exhaustive()}
    </Fragment>
  );
};
export default DashboardPage;
