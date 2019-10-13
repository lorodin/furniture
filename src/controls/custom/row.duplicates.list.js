import React from 'react';
import RowDuplicateItem from "./row.duplicate.item";

export default class RowDuplicates extends React.Component {
    render() {
        return (
            <div className={'row-duplicates'}>
                {this.props.items.map((item, index) => {
                    return (
                        <RowDuplicateItem key={index} item={item} />
                    )
                })}
            </div>
        )
    }
}