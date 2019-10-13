import React from 'react';
const shell = require('electron').shell;

export default class ProductListItem extends React.Component {

    constructor(props) {
        super(props);
        this.openExternal = this.openExternal.bind(this);
        this.openFind = this.openFind.bind(this);
    }

    openExternal(link) {
        shell.openExternal(link);
    }

    openFind() {
        // const str = JSON.stringify(this.props.item);
        location.hash = `#/find-one:${this.props.index}`;
    }

    render() {
        const {item, index, findBtn, linkBtn} = this.props;
        const FindBtn = () => {
            if (!findBtn) {
                return (
                    <span />
                );
            }
            return (
                <button className={'btn btn-find'} onClick={()=>{this.openFind()}}>Искать</button>
            );
        };
        const LinkBtn = () => {
            if (!linkBtn) {
                return (
                    <span />
                );
            }
            return (
                <button className={'btn btn-link'} onClick={() => this.openExternal(item.url) }>Открыть на сайте</button>
            )
        };
        const CompareResult = () => {
            if (!item.totalP) return (<span/>);
            return (
                <div className={'compare-products'}>
                    {/*<h5>Результат сравнения</h5>*/}
                    <table>
                        <thead>
                            <tr>
                                <th>h4</th>
                                <th>h8</th>
                                <th>h16</th>
                                <th>total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{(100 * item.p4).toFixed(0)}%</td>
                                <td>{(100 * item.p8).toFixed(0)}%</td>
                                <td>{(100 * item.p16).toFixed(0)}%</td>
                                <td><strong>{(100 * item.totalP).toFixed(0)}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )
        }
        return (
            <div className={'product-list-item'}>
                <div className={'product-image'} style={{backgroundImage: `url(${item.img})`}} />
                <CompareResult/>
                <div className={'links'}>
                    <FindBtn/>
                    <LinkBtn/>
                </div>
            </div>
        );
    }
}