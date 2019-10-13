import React from 'react';
import ReactDOM from 'react-dom';
import {Router} from "./route";

window.onload = () => {
    ReactDOM.render(
        <Router />,
        document.getElementById('app'));
};
