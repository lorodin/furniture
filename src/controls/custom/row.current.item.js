import React from 'react';
const shell = require('electron').shell;

export default class RowCurrentItem extends React.Component {
    render() {
        return (
            <div className={'row-current-item'}>
                <div style={
                            {
                                backgroundImage:`url(${this.props.item.img})`
                            }
                        }
                     className={'image'}
                />
                <div className={'links'}>
                    <button
                        className={'btn'}
                        onClick={()=>{shell.openExternal(this.props.item.url)}}>
                        Открыть на сайте
                    </button>
                </div>
            </div>
        )
    }
}