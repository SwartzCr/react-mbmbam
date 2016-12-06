import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import { Router, Route, Link, browserHistory } from 'react-router';
import CommentBox from "./CommentBox";
import "../opentip-native.js"
import "../opentip.css"

ReactDOM.render(

  <Router history={browserHistory}>
    <Route path="/" component={CommentBox}/>
  </Router>
  ,
  document.getElementById('root')
);
