import React from 'react';
import Preloader from "./custom/preloader";
import {loadCacheFile} from "../utils/hash.tools";
import ProductsList from "./custom/products.list";
import {MAIN_CACHE_PATH} from "../configs";

export default class CatalogPage extends React.Component {

    constructor(props) {
        super(props);
        this.preloader = undefined;
        this.catalog = [];
    }

    componentDidMount() {
        this.preloader = document.querySelector("#preloader");
        this.load(true);
        loadCacheFile(MAIN_CACHE_PATH)
            .then(
                (catalog) => {
                    this.catalog = catalog;
                    this.forceUpdate(() => {
                        console.log('Файл успешно загружен');
                        this.load(false);
                    });
                },
                (error) => {
                    console.error(error);
                    alert('Ошибка чтения файла. Подробнее в консоли.');
                    this.load(false);
                }
            )
    }

    load(wait) {
        this.preloader.style.display = wait ? 'block' : 'none';
    }

    render() {
        return (
            <div className={'page'}>
                <h1>Поиск по каталогу</h1>
                <ProductsList items={this.catalog} linkBtn={true} findBtn={true} />
                <Preloader id={'preloader'}/>
            </div>
        );
    }
}