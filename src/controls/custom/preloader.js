import React from 'react';

export default class Preloader extends React.Component {
    render() {
        return (
            <div className={'preloader'} id={this.props.id}>
                <div className={'preloader-info'}>
                    <img src={'./assets/preloader.gif'} alt={'preloader'}/>
                    <span className={'preloader-text'}>{this.props.title ? this.props.title : 'загрузка'}</span>
                </div>
            </div>);
    }
}