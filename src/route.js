import {Route, HashRouter} from 'react-router-dom';
import React from "react";
import MainMenu from "./controls/main.menu";
import FindImagePage from "./controls/findImage.page";
import CatalogPage from "./controls/catalog.page";
import AutoFindPage from "./controls/autofind.page";
import FindOnePage from "./controls/findOne.page";

export function Router() {
    return (
        <HashRouter>
            <div>
                <MainMenu />
                <Route path={'/catalog'} component={CatalogPage} />
                <Route path={'/find-by-image'} component={FindImagePage}/>
                <Route path={'/auto-find'} component={AutoFindPage}/>
                <Route path={'/find-one:query'} component={FindOnePage}/>
            </div>
        </HashRouter>
    )
}