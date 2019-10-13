import React from 'react';
import RowCurrentItem from "./row.current.item";
import RowDuplicates from "./row.duplicates.list";

export default class AutoFindResult extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className={'auto-find-result'}>
                {this.props.result.map((current, index) => {
                    return (
                      <div key={index} className={'find-row'}>
                          <RowCurrentItem item={current.current} />
                          <RowDuplicates items={current.duplicates} />
                      </div>
                    );
                })}
            </div>
        );
    }
}