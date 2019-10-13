import React from 'react';
import Preloader from "./custom/preloader";
import {loadCacheFile} from "../utils/hash.tools";
import {findDuplicate} from "../../app/utils/hash.tools";
import ProductsList from "./custom/products.list";
import {DONOR_CACHE_PATH, MAIN_CACHE_PATH} from "../configs";

export default class FindOnePage extends React.Component {
    constructor(props) {
        super(props);
        this.preloader = undefined;
        const hash = location.hash;
        const split = hash.split(':');
        if (split.length < 2) {
            console.error(`${location.hash} отсуствует параметр ::query`);
            return alert('Ошибка парамтра. Подробнее в консоли');
        }
        this.index = Number(split[1]);
        this.findItem = {};
        this.findResult = [];
    }

    componentDidMount() {
        this.preloader = document.querySelector("#preloader");
        this.load(true);

        loadCacheFile(MAIN_CACHE_PATH)
            .then(
                (items) => {
                    this.findItem = items[this.index];
                    console.log(this.findItem);
                    this.forceUpdate(()=>{
                        loadCacheFile(DONOR_CACHE_PATH)
                            .then(
                                (items) => {
                                    findDuplicate(this.findItem, items, 0.4)
                                        .then(
                                            (duplicates) => {
                                                this.findResult = duplicates;
                                                this.forceUpdate(() => {
                                                    this.load(false);
                                                    console.log(this.findResult);
                                                });
                                            },
                                            (error) => {
                                                this.load(false);
                                                console.error(error);
                                                alert('Ошибка сравнения файлов. Подробнее в консоли');
                                            }
                                        )
                                    console.log(items.length);
                                },
                                (error) => {
                                    this.load(false);
                                    console.error(error);
                                    alert('Ошибка загрузки файла кэша. Подробнее в консоли');
                                }
                            )
                    })
                },
                (error) => {
                    this.load(false);
                    console.error(error);
                    alert('Ошибка загрузки файла кеша. Подробнее в консоли.');
                }
            )
    }

    load(wait) {
        this.preloader.style.display = wait ? 'block' : 'none';
    }

    render() {
        const FindItem = () => {
            if (!this.findItem) return (<span/>);
            return (
                <div className={'finded-item'}>
                    <img src={this.findItem.img} alt={''}/><br/>
                    <button className={'btn'}>Открыть на сайте</button>
                </div>
            )
        };
        return (
            <div className={'page'}>
                <h1>Поиск одного изображения</h1>
                <FindItem/>
                <h4>{this.findResult.length === 0 ? 'Изображения не найдены': 'Результаты поиска'}</h4>
                <ProductsList items={this.findResult} findBtn={false} linkBtn={true}/>
                <Preloader id={'preloader'} />
            </div>
        )
    }
}