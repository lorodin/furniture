import React from 'react';
import ProductListItem from "./product.list.item";

export default class ProductsList extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className={'products-list'}>
                {this.props.items.map((item, i) => {
                    return (
                        <ProductListItem key={i} index={i} item={item} findBtn={this.props.findBtn} linkBtn={this.props.linkBtn} />
                    )
                })}
            </div>
        )
    }
}