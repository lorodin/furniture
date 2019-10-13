const request = require('request');
const cheerio = require('cheerio');

class ParserV2 {

    parsePage(pageUrl) {
        return new Promise((res, rej) => {
            request(pageUrl, 'GET', (err, response, body) => {
                if (err) {
                    return rej(err);
                }
                const $ = cheerio.load(body);
                const images = $(`img.stamp_img`);
                const result = [];
                const parseRow = (id) => {
                    const tr = $(`#${id}`);
                    if (tr.length === 0) return {url: pageUrl};
                    const tds = $(tr[0]).find('td');
                    const data = {
                        number:     $(tds[0]).text(),
                        type:       $(tds[1]).text(),
                        d:          $(tds[2]).text(),
                        color:      $(tds[4]).text(),
                        description: $(tds[6]).text(),
                        count:      $(tds[7]).text(),
                        newPrice:   $(tds[9]).text(),
                        notUsed:    $(tds[10]).text(),
                        used:       $(tds[11]).text(),
                        postKPD:    $(tds[12]).text(),
                        currency:   $(tds[13]).text()
                    };
                    return data;
                };
                for (let i = 0; i < images.length; i++) {
                    result.push({
                        img: images[i].attribs['src'],
                        data: parseRow(images[i].attribs['id'].replace('pic', 'line'))
                    });
                }
                res(result);
            });
        });
    }

    /**
     * Парсит всю страницу в папку и сохраняет данные в json
     * @param {{
     *     siteUrl: {string},
     *     pageUrl: {string},
     *     outPutDir: {string},
     *     name: {string}
     * }} options Опции парсера, каждое поле обязательно к заполнению
     * @returns {Promise<[]>}
     */
    parseAllPages(options) {
        const {siteUrl, pageUrl, outPutDir, name, cbProgress} = options;
        return new Promise((res, rej) => {
            this.getPageInfo(pageUrl)
                .then(
                    (pageInfo) => {
                        const promises = [];
                        for (let i = 1; i <= pageInfo.pages; i++) {
                            promises.push(this.parsePage(siteUrl + pageInfo.url + i));
                        }

                        const allPromises = () => {
                            let progress = 0;
                            const length = promises.length;
                            function tick(promise) {
                                promise.then(() => {
                                    progress++;
                                    if (cbProgress) cbProgress(progress, length);
                                });
                                return promise;
                            }
                            return Promise.all(promises.map(tick));
                        };

                        allPromises().then(
                                (items) => {
                                    const result = [];
                                    for (let i = 0; i < items.length; i++) {
                                        for (let j = 0; j < items[i].length; j++) {
                                            result.push(items[i][j]);
                                        }
                                    }
                                    res(result);
                                },
                                (error) => {
                                    rej(error);
                                }
                            );
                    },
                    (error) => {
                        rej(error);
                    })
                .catch(
                    (error) => {
                        rej(error);
                    }
                )
        })
    }

    /**
     * Возвращает информацию о странице (количество страниц)
     * @param {string} pageUrl
     * @returns {Promise<{url: {string}, pages: {number}}>}
     */
    getPageInfo(pageUrl) {
        const single = {
            url: pageUrl,
            pages: 0
        };
        return new Promise((res, rej) => {
            request(pageUrl, 'GET', (err, response, body) => {
                if (err) {
                    return rej(err);
                }
                const $ = cheerio.load(body);
                const links = $(`a.navLinks`);
                if (links.length === 0) {
                    return res(single);
                }
                const last = links[links.length - 1];
                if (!last) {
                    return res(single);
                }
                const reg = /page=\d*/gm;
                let url = last.attribs['href'];
                const lastPage = url.match(reg);
                if (lastPage.length === 0) {
                    return res(single);
                }
                const strNumber = lastPage[0].replace(/page=/g, '');
                url = url.substr(0, url.length - strNumber.length);
                res({
                    url: url,
                    pages: Number(strNumber)
                });
            });
        });
    }
}

module.exports = ParserV2;