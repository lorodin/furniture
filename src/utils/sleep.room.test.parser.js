const cheerio = require('cheerio');
const request = require('request');
const baseURL = "https://domson.ru";
const pageURL = 'https://domson.ru/mebel_po_kategoriyam/spalni/';

class FParser {
    getPageInfo() {
        return new Promise((res, rej) => {
           request(pageURL, 'GET', (err, response, body) => {
               if (err) {
                   return rej(err);
               }
               const $ = cheerio.load(body);
               const links = $('.paginator_page');
               const lastPage = Number($(links[links.length - 2]).text());
               res({
                   pages: lastPage
               });
           })
        });
    }
    getImages(url) {
        return new Promise((res, rej) => {
            request(url, 'GET', (error, response, body) => {
                if (error) {
                    return rej(error);
                }
                const $ = cheerio.load(body);
                const links = $('.is_collection_list a.item');
                const result = [];
                for (let i = 0; i < links.length; i++) {
                    const img = $(links[i]).find('.img_cont img');
                    result.push({
                        url: baseURL + $(links[i]).attr('href'),
                        img: baseURL + $(img).attr('src')
                    })
                }
                res(result);
            });
        });
    }
    getImagesWithLinks() {
        return new Promise((res, rej) => {
            this.getPageInfo()
                .then(
                    (pageInfo) => {
                        let promises = [];
                        for (let i = 0; i < pageInfo.pages; i++) {
                            promises.push(this.getImages(pageURL + i + '/'));
                        }
                        Promise.all(promises)
                            .then(
                                (info) => {
                                    const result = [];
                                    for (let i = 0; i < info.length; i++) {
                                        for (let j = 0; j < info[i].length; j++) {
                                            result.push(info[i][j]);
                                        }
                                    }
                                    res(result);
                                },
                                (error) => {
                                    rej(error);
                                }
                            )
                    },
                    (error) => {
                        rej(error);
                    }
                )
        })
    }
}

module.exports = FParser;