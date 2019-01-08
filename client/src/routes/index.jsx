import React from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

const Hello = () => <h1>Hellow Skeletor</h1>
const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route exact path="/" render={Hello}/>
            </Switch>
        </Router>
    );
}

export default Routes;
