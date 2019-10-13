const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');

const BASE_URL = `https://www.stampworld.com`;

export default class Parser {
    constructor(cachePath, areas = null) {
        this.cachePath = cachePath;
        this.areas = areas || [
            {
                name: 'Европа',
                pageUrl: 'https://www.stampworld.com/ru/maps/Europe/',
                countries: []
            },
            {
                name: 'Северная Америка',
                pageUrl: 'https://www.stampworld.com/ru/maps/North-America/',
                countries: []
            },
            {
                name: 'Южная Америка',
                pageUrl: 'https://www.stampworld.com/ru/maps/South-America/',
                countries: []
            },
            {
                name: 'Африка',
                pageUrl: 'https://www.stampworld.com/ru/maps/Africa/',
                countries: []
            },
            {
                name: 'Азия',
                pageUrl: 'https://www.stampworld.com/ru/maps/Asia/',
                countries: []
            },
            {
                name: 'Океания',
                pageUrl: 'https://www.stampworld.com/ru/maps/Oceania/',
                countries: []
            }
        ];
    }

    loadCountries(progress, cb) {
        const start = 0;
        const areasNum = this.areas.length;
        const loadAreaAsync = (index, maxCount) => {
            if (index === maxCount) {
                fs.writeFile(
                    `${this.cachePath}/cache.json`,
                    JSON.stringify(this.areas),
                    'utf8',
                    () => {}
                );
                return cb ? cb(null, this.areas) : null;
            }
            if (progress) progress(`Load areas: (${index + 1}/${this.areas.length})`);
            this.loadRegionByUrl(this.areas[index].pageUrl, (error, result) => {
                if (error) {
                    return cb ? cb(error) : null;
                }
                this.areas[index].countries = result;
                setTimeout(() => {
                    loadAreaAsync(index + 1, maxCount);
                }, 1000);
            });
        };
        loadAreaAsync(start, areasNum);
    }

    /**
     * Возвращает дерево категорий в виде плоского массива
     * @returns {[{
     *   url:{string},
     *   uri:{string}
     * }]} - массив с адресами страниц на сайте и соответсвующих дирректорий на диске, в которых есть марки
     */
    // eslint-disable-next-line class-methods-use-this
    getFlatArray() {
        const result = [];
        const nameClean = name => {
            return name.replace('/', '@');
        };
        const makeArray = (path, obj) => {
            const currentFolderUri = `${path}/${nameClean(obj.name)}`;
            if (obj.countries.length === 0) {
                result.push({
                    uri: currentFolderUri,
                    url: obj.pageUrl
                });
                return;
            }
            for (let i = 0; i < obj.countries.length; i += 1) {
                makeArray(currentFolderUri, obj.countries[i]);
            }
        };
        for (let i = 0; i < this.areas.length; i += 1) {
            makeArray(this.cachePath, this.areas[i]);
        }
        return result;
    }

    /**
     * Загружает все марки и данные о них
     * @param progress
     * @param cb
     */
    loadAllMarks(progress, cb) {
        this.lineAr = [];
        const nameClean = name => {
            return name.replace('/', '@');
        };
        const createAr = (path, obj) => {
            const currentFolderUri = `${path}/${nameClean(obj.name)}`;
            if (obj.countries.length === 0) {
                this.lineAr.push({
                    uri: currentFolderUri,
                    url: obj.pageUrl
                });
                return;
            }
            for (let i = 0; i < obj.countries.length; i += 1) {
                createAr(currentFolderUri, obj.countries[i]);
            }
        };
        for (let i = 0; i < this.areas.length; i += 1) {
            createAr(this.cachePath, this.areas[i]);
        }

        const loadMarksSync = (i, maxCount, callback) => {
            if (i === maxCount) {
                return callback ? callback() : null;
            }
            if (progress) {
                progress(
                    `[${i + 1}/${maxCount}] {${this.lineAr[i].uri}, ${this.lineAr[i].url}`
                );
            }
            this.loadMarks(this.lineAr[i].uri, this.lineAr[i].url, err => {
                if (err) {
                    console.error(err);
                }
                setTimeout(() => {
                    loadMarksSync(i + 1, maxCount, callback);
                }, 1000);
            });
        };

        loadMarksSync(0, this.lineAr.length, () => {
            return cb ? cb() : null;
        });
    }

    /**
     * Загружает марки с конкретной страницы
     * @param uri Адрес папки в которую все будет сохранено
     * @param url URL-страницы с которой будет производиться загрузка
     * @param cb  Callback-функция, возовиться при полной загрузки страницы (в т.ч. изображений)
     */
    // eslint-disable-next-line class-methods-use-this
    loadMarks(uri, url, cb) {
        request(url, (err, responce, body) => {
            const data = [];
            if (err) {
                return cb ? cb(err) : null;
            }
            const $ = cheerio.load(body);
            const rows = $(`tr.stamp_tr`);
            rows.each((index, row) => {
                if (row.attribs.id) {
                    const { id } = row.attribs;
                    const imageId = id.replace(`line_`, `pic_`);
                    const imgDom = $(`#${imageId}`);
                    if (imgDom && imgDom.length !== 0) {
                        const imageUrl = imgDom[0].attribs.src;
                        const filename = `${uri}/${data.length + 1}.jpg`;
                        const markName = `${uri}/${data.length + 1}.txt`;
                        const tds = $(row).find('td');
                        const cacheItem = {
                            number: $(tds[0]).text(),
                            type: $(tds[1]).text(),
                            d: $(tds[2]).text(),
                            color: $(tds[4]).text(),
                            description: $(tds[6]).text(),
                            count: $(tds[7]).text(),
                            newPrice: $(tds[9]).text(),
                            notUsed: $(tds[10]).text(),
                            used: $(tds[11]).text(),
                            postKPD: $(tds[12]).text(),
                            currency: $(tds[13]).text(),
                            img: filename,
                            marker: markName
                        };
                        data.push(cacheItem);
                        request(imageUrl)
                            .pipe(fs.createWriteStream(filename))
                            .on('close', () => {});
                    }
                }
                if (index === rows.length - 1) {
                    if (cb) cb();
                }
            });
            if (rows.length === 0) {
                if (cb) {
                    cb();
                }
            }
            fs.writeFile(`${uri}/data.json`, JSON.stringify(data), 'utf8', () => {});
        });
    }

    /**
     * Сохраняет все ссылки в папку с кэшем
     */
    saveLinks() {
        // eslint-disable-next-line no-unused-vars
        const deleteFolderRecursive = function(path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function(file) {
                    const curPath = `${path}/${file}`;
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };
        if (fs.existsSync(this.cachePath)) {
            deleteFolderRecursive(this.cachePath);
        }
        const nameClean = name => {
            return name.replace('/', '@');
        }
        fs.mkdirSync(this.cachePath);
        const makeCacheDirs = (path, obj) => {
            console.log(path);
            const currentFolderUri = `${path}/${nameClean(obj.name)}`;
            if (!fs.existsSync(`${path}/${nameClean(obj.name)}`)) {
                fs.mkdirSync(currentFolderUri);
            }
            if (obj.countries.length === 0) {
                // Тут можно начать загружать контент, только аккуратно
                const cache = {
                    uri: currentFolderUri,
                    name: obj.name,
                    url: obj.pageUrl
                };
                fs.writeFileSync(
                    `${currentFolderUri}/cache.json`,
                    JSON.stringify(cache),
                    'utf8'
                );
                return;
            }
            const cacheData = [];
            for (let i = 0; i < obj.countries.length; i += 1) {
                makeCacheDirs(currentFolderUri, obj.countries[i]);
                const uri = `${currentFolderUri}/${nameClean(obj.countries[i].name)}`;
                const cacheItem = {
                    name: obj.countries[i].name,
                    pageUrl: obj.countries[i].pageUrl,
                    folder: uri
                };
                cacheData.push(cacheItem);
            }
            fs.writeFileSync(
                `${currentFolderUri}/cache.json`,
                JSON.stringify(cacheData),
                'utf8'
            );
        };
        for (let i = 0; i < this.areas.length; i += 1) {
            makeCacheDirs(`${this.cachePath}`, this.areas[i]);
        }
    }

    /**
     * Загружает один узел в дереве регионов
     * @param url URL-адрес узла
     * @param cb Callback-функция
     */
    // eslint-disable-next-line class-methods-use-this
    loadRegionByUrl(url, cb) {
        const result = [];
        let currentIndex = 0;
        request(url, (error, responce, body) => {
            if (error) return cb ? cb(error) : null;
            const $ = cheerio.load(body);
            const links = $(`a.country-link`);
            links.each((index, link) => {
                const text = $(link)
                    .text()
                    .replace(/\r\n/g, '')
                    .trim();
                const linkURL = BASE_URL + $(link).attr('href');
                result.push({
                    name: text,
                    pageUrl: linkURL,
                    countries: []
                });
                const splitter = linkURL.split('/');
                if (splitter[4] === 'maps') {
                    const finalIndex = index;
                    this.loadRegionByUrl(linkURL, (error2, countries) => {
                        if (error2) return cb ? cb(error2) : null;
                        result[finalIndex].countries = countries;
                        currentIndex += 1;
                        if (currentIndex === links.length) {
                            return cb ? cb(null, result) : null;
                        }
                    });
                } else {
                    currentIndex += 1;
                    if (currentIndex === links.length) {
                        return cb ? cb(null, result) : null;
                    }
                }
            });
        });
    }
}
