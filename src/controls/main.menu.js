import {Link, NavLink} from "react-router-dom";
import React from "react";

export default class MainMenu extends React.Component {

    render() {
        return (
            <div className={'main-menu'}>
                <ul>
                    <li>
                        <NavLink to={'catalog'}>
                            Поиск по каталогу
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to={'auto-find'}>
                            Автоматический поиск
                        </NavLink>
                    </li>
                </ul>
            </div>
        );
    }
}