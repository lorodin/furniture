const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const getPixels = require('get-pixels');

const baseURL = "https://meb-elite.ru";
const firstPageURL = "https://meb-elite.ru/catalog/varianty_komplektov/";
const exampleProductPage = "https://meb-elite.ru/catalog/varianty_komplektov/bosfor-lyuks-spalnya-komplekt-krovat-160kh200-2-tumby-prikrovatnye-komod-bez-zerkala-tualetnyy-stol-/";
const cachePath = 'D:/work/stores/furniture/';
const timerLabel = 'Total time';
console.time(timerLabel);

fs.readFile(cachePath + 'main.json', 'utf8', (err, data) => {
    if (err) {
        return console.error("Error loading file", err);
    }
    const json = JSON.parse(data);
    const result = [];
    const loadSync = (i, cb) => {
        if (i >= json.length) {
            return cb ? cb() : null;
        }
        buildImage(json[i].img, (err, matrix) => {
            if (err) {
                return cb ? cb(err) : null;
            }
            const hash = {
                h4: '',
                h8: '',
                h16: '',
                rh4: '',
                rh8: '',
                rh16: ''
            };
            const gray = imageToGrayMatrix(matrix);
            for (let j = 4; j <= 16; j *= 2) {
                const scale = scaleMatrix(gray, j);
                const bits = bitsMatrix(scale);
                const r = revertMatrix(bits);
                const arr = matrixToArray(bits);
                const rarr = matrixToArray(r);
                hash['h' + j] = makeArrayHash(arr);
                hash['rh' + j] = makeArrayHash(rarr);
            }
            result.push({
                url: json[i].url,
                img: json[i].img,
                h4: hash['h4'],
                h8: hash['h8'],
                h16: hash['h16'],
                rh4: hash['rh4'],
                rh8: hash['rh8'],
                rh16: hash['rh16']
            });
            console.log(`Progress: ${i + 1}/${json.length}`);
            setTimeout(()=>{
                loadSync(i + 1, cb);
            }, 100);
        });
    }
    loadSync(0, (err) => {
        if (err) {
            return console.error('Error loading image: ', err);
        }
        fs.writeFileSync(cachePath + 'main.result.json', JSON.stringify(result), 'utf8');
        console.log('Loading complete');
        console.timeEnd(timerLabel);
    })
});

// function stringMatrix (matrix) {
//     let result = "";
//     for (let i = 0; i < matrix.height; i++) {
//         for (let j = 0; j < matrix.width; j++) {
//             result += matrix.matrix[i][j]+"";
//         }
//         result += "\r\n";
//     }
//     return result;
// }
// const matrix = {
//     width: 3,
//     height: 3,
//     matrix: [
//         [0, 0, 1],
//         [0, 1, 1],
//         [1, 0, 0]
//     ]
// };
//
// const r = revertMatrix(matrix);
// console.log(stringMatrix(r));


function revertMatrix(matrix) {
    const result = [];
    for (let i = 0; i < matrix.height; i++) {
        result[i] = [];
        let x = 0;
        for(let j = matrix.width - 1; j >= 0; j--) {
            result[i][x++] = matrix.matrix[i][j];
        }
    }
    return {
        width: matrix.width,
        height: matrix.height,
        matrix: result
    };
}

// loadAllPagesWithImages(
//     firstPageURL,
//     (p, l) => {
//         console.log(`Progress: ${p}/${l}`);
//     })
//     .then((result) => {
//             console.log('Loading complete');
//             fs.writeFile(cachePath + 'main.json', JSON.stringify(result), 'utf8', (err) => {
//                 if (err) return console.error(err);
//                 console.timeEnd(timerLabel);
//             });
//         },
//         (error) => {
//             console.error(error);
//         });

function loadAllPagesWithImages(firstPage, onProgress) {
    return new Promise((res, rej) => {
        getAllPageUrls(firstPage)
            .then(
                (urls) => {
                    const promises = [];
                    for (let i = 0; i < urls.length; i++) {
                        promises.push(getPageImage(urls[i]));
                    }
                    const allPromises = () => {
                        let progress = 0;
                        const length = promises.length;
                        function tick(promise) {
                            promise.then(() => {
                                progress++;
                                if (onProgress) onProgress(progress, length);
                            });
                            return promise;
                        }
                        return Promise.all(promises.map(tick));
                    };

                    allPromises()
                        .then(
                            (result) => {
                                res(result);
                            },
                            (error) => {
                                rej(error);
                            });
                },
                (error) => {
                    rej(error);
                }
            )
    })
}

function getPageImage(url) {
    return new Promise((res, rej) => {
        request(url, 'GET', (error, response, body) => {
            if (error) {
                return rej(error);
            }
            const $ = cheerio.load(body);
            const img = $('.lazy');
            if (img.length !== 0) {
                return res({
                    url: url,
                    img: baseURL + $(img[0]).attr('data-original')
                });
            }
            return res();
        });
    });
}

function getAllPageUrls(url) {
    return new Promise((res, rej) => {
        const result = [];
        const loadPagesSync = (url, cb) => {
            if (!url) {
                return cb ? cb() : null;
            }
            getPageUrls(url)
                .then(
                    (urls) => {
                        for (let i = 0; i < urls.products.length; i++) {
                            result.push(urls.products[i]);
                        }
                        loadPagesSync(urls.nextLink, cb);
                    },
                    (error) => {
                        cb(error);
                    }
                )
        };
        loadPagesSync(url, (error) => {
            if (error) return rej(error);
            res(result);
        })
    })
}

function getPageUrls(url) {
    return new Promise((res, rej) => {
        request(url, 'GET', (error, response, body) => {
            if (error) {
                return rej(error);
            }
            const $ = cheerio.load(body);
            const productsLinks = $(".item_content a");
            const links = [];
            for (let i = 0; i < productsLinks.length; i++) {
                const link = $(productsLinks[i]).attr('href');
                links.push(baseURL + link);
            }
            const nextBtn = $(".next.btn.i_block");
            let nextLink = undefined;
            if (nextBtn.length !== 0) {
                nextLink = baseURL + $(nextBtn[0]).attr('href');
            }
            res({
                products: links,
                nextLink: nextLink
            });
        })
    })
}


function matrixToArray(matrix) {
    const result = [];
    for (let i = 0; i < matrix.height; i++) {
        for (let j = 0; j < matrix.width; j++) {
            result.push(matrix.matrix[i][j]);
        }
    }
    return result;
}

/**
 * Сравнивает два хеша методом хафмена
 * @param {array|string} h1 первый элемент сравнения
 * @param {array|string} h2 второй элемент сравнения
 * @returns {{h: number, l: *}} h - количество не совпавших элементов последовательности
 *                              l - длина перовй последовательности
 */
function hafman(h1, h2) {
    const r = {
        h: 0,
        l: h1.length
    };
    for (let i = 0; i < h1.length; i++) {
        r.h += i >= h2.length ? 1 : h1[i] === h2[i] ? 0 : 1;
    }
    return r;
}

/**
 * Формирует hash матрицы
 * @param {number[]} arr Бинарный массив
 * @returns {string} полученный хеш из массива
 */
function makeArrayHash(arr) {
    const str16 = ['0', '1', '2', '3', '4', '5','6','7','8','9','A','B','C', 'D','E','F'];
    let str = "";
    for (let i = 0; i < arr.length; i += 4) {
        let sum = 0;
        for (let j = i; j < i + 4; j++) {
            sum += j > arr.length ? 0 : arr[(j - i) + i] * Math.pow(2, j - i);
        }
        str += str16[sum];
    }

    return str;
}

/**
 * Преобразует цвет в градации серого
 *
 * @param {{r: number, g: number, b: number}} rgb Цвет в формате RGB
 * @returns {number} Яркость элемента (0...255)
 */
const rgbToGray = rgb => 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;;


function bitsMatrix(matrix) {
    const result = [];
    let max = 0;
    let min = 300;

    for (let i = 0; i < matrix.height; i++) {
        for (let j = 0; j < matrix.width; j++) {
            try{
                if (matrix.matrix[i][j] > max) max = matrix.matrix[i][j];
                if (matrix.matrix[i][j] < min) min = matrix.matrix[i][j];
            }catch (e) {
                // console.log(matrix);
                console.log(i, j);
                throw e;
            }
        }
    }

    const t = min + (max - min) / 2;

    for (let i = 0; i < matrix.height; i++) {
        result[i] = [];
        for (let j = 0; j < matrix.width; j++) {
            result[i][j] = matrix.matrix[i][j] > t ? 1 : 0;
        }
    }

    return {
        width: matrix.width,
        height: matrix.height,
        matrix: result
    }
}

function scaleMatrix(matrix, size) {
    if (size <= 0) size = 1;

    const result = [];
    const dx = matrix.width / size;
    const dy = matrix.height / size;

    for (let i = 0; i < matrix.height; i += dy) {
        let ry = Math.round(i / dy);
        result[ry] = [];
        for (let j = 0; j < matrix.width; j += dx) {
            let s = 0;
            let total = 0;

            let y = Math.round(i);
            const maxY = Math.round(i + dy);

            for (; y < maxY && y < matrix.height; y++) {
                let x = Math.round(j);
                const maxX = Math.round(j + dx);

                for (; x < maxX && x < matrix.width; x++) {
                    s += matrix.matrix[y][x];
                    total ++;
                }
            }
            s /= total;
            result[ry][ j / dx] = Math.round(s);
        }
    }

    return {
        matrix: result,
        width: size,
        height: size
    };
}

function cutCenter(matrix, perOffset) {
    perOffset /= 2;
    let offsetX = Math.round(perOffset);
    let offsetY = Math.round(perOffset);
    let result = [];
    for (let i = offsetY; i < matrix.height - offsetY; i++) {
        result[i] = [];
        for (let j = offsetX; j < matrix.width - offsetX; j++) {
            result[i - offsetY][j - offsetX] = matrix.matrix[i][j];
        }
    }
    return {
        width: result.length > 0 ? result[0].length : 0,
        height: result.length,
        matrix: result
    };
}

function imageToGrayMatrix(matrix) {
    let min = 255;
    let max = 0;
    const result = [];
    for (let i = 0; i < matrix.height; i++) {
        result[i] = [];
        for (let j = 0; j < matrix.width; j++) {
            result[i][j] = rgbToGray(matrix.matrix[i][j]);
            if (result[i][j] > max) max = result[i][j];
            if (result[i][j] < min) min = result[i][j];
        }
    }
    return {
        width: matrix.width,
        height: matrix.height,
        matrix: result
    };
}

/**
 * Преобразует изображение из матрицы с цветами в rgb
 * @param imagePath путь к изображению
 * @param cb Callback функция
 */
function buildImage(imagePath, cb) {
    getPixels(imagePath, (err, pixels) => {
        if (err) {
            return cb ? cb(err) : null;
        }
        const pxs = [];

        for (let y = 0; y < pixels.shape[1]; y++) {
            pxs[y] = [];
            for (let x = 0; x < pixels.shape[0]; x++) {
                pxs[y][x] = {r: pixels.get(x, y, 0), g: pixels.get(x, y, 1), b: pixels.get(x, y, 2)};
            }
        }

        return cb ? cb(null,
            {
                width: pixels.shape[0],
                height: pixels.shape[1],
                matrix: pxs
            }) : null;
    });
}