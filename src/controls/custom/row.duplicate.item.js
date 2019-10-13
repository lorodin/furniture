import React from 'react';
const shell = require('electron').shell;

export default class RowDuplicateItem extends React.Component {
    render() {
        const {item} = this.props;
        const TableCompare = () => {
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
            );
        };
        return (
            <div className={'row-duplicate-item'}>
                <div className={'image'}
                     style={
                         {
                             backgroundImage: `url(${this.props.item.img})`
                         }
                     } />
                 <div className={'link'}>
                    <button className={'btn'} onClick={()=>shell.openExternal(this.props.item.url)}>
                        Открыть на сайте
                    </button>
                 </div>
                <TableCompare/>
            </div>
        )
    }
}