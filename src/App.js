/** @format */

import React, { Suspense, Component, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  withRouter,
  Redirect,
} from "react-router-dom";
import Login from "./Containers/Login/index";
import Authorize from "./Containers/Authorize";
import RedirectDashboard from "./Containers/Redirect";
import Dashboard from "./Containers/Dashboard/index";
import { ToastContainer } from "react-toastify";

const App = () => {
  let routes = (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/social" component={Login} />
      <Route path="/authorize" component={Authorize} />
      <Route path="/login-redirect" component={RedirectDashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/" component={Login} />
      <Route exact path={"/"} component={Login}></Route>
      <Route path="*" component={Login} />
    </Switch>
  );

  return (
    <>
      <Router>
        <Suspense fallback={<div>Loading..</div>}>{routes}</Suspense>
      </Router>
      <ToastContainer newestOnTop={false} position="bottom-right" />
    </>
  );
};

export default App;
