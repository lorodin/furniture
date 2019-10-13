import React from 'react';
import Preloader from "./custom/preloader";
import {findAllDuplicates, loadCacheFile} from "../utils/hash.tools";
import {DONOR_CACHE_PATH, MAIN_CACHE_PATH} from "../configs";
import AutoFindResult from "./custom/autoFind.result";

export default class AutoFindPage extends React.Component {
    constructor(props) {
        super(props);
        this.preloader = undefined;
        this.result = [];
    }

    componentDidMount() {
        this.preloader = document.querySelector("#preloader");
        this.load(true);
        loadCacheFile(MAIN_CACHE_PATH)
            .then(
                (items1) => {
                    loadCacheFile(DONOR_CACHE_PATH)
                        .then(
                            (items2) => {
                                findAllDuplicates(items1, items2, 0.4)
                                    .then(
                                        (result) => {
                                            this.result = result;
                                            this.forceUpdate(()=>{
                                                this.load(false);
                                            })
                                        },
                                        (error) => {
                                            this.error('Ошибка сравнения двух кешей. Подробнее в консоли.', error);
                                        }
                                    )
                            },
                            (error) => {
                                this.error('Ошибка загрузки кэша сайта донора. Подробнее в консоли.', error);
                            }
                        )
                },
                (error) => {
                    this.error('Ошибка загрузки кэша галвного сайта. Подробнее в консоли.', error);
                }
            )
    }

    error(msg, error) {
        this.load(false);
        console.error(error);
        alert(msg)
    }

    load(wait) {
        this.preloader.style.display = wait ? 'block' : 'none';
    }

    render() {
        return (
            <div className={'page'}>
                <h1>Автоматический поиск</h1>
                <AutoFindResult result={this.result}/>
                <Preloader id={'preloader'} />
            </div>
        );
    }
}