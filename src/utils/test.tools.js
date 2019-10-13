const getPixels = require('get-pixels');
const fs = require('fs');
const SIZE = 8;
const ParserV2 = require('./parsing.tools');
const htmlHead = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>`;

const htmlFooter = `
</body>
</html>`;
const cacheDir = "D:/Work/Marks/cache";

const imagePath = "D:\\Work\\Marks\\test\\real\\7.png";

buildImage(imagePath, (err, matrix) => {
    if (err) {
        return console.log(err);
    }
    let hash ={
        'h4': '',
        'h8': '',
        'h16': ''
    };
    for (let j = 4; j <= 16; j *= 2) {
        const cut = cutCenter(matrix, 0.01);
        const gray = imageToGrayMatrix(cut);
        const scale = scaleMatrix(gray, j);
        const bits = bitsMatrix(scale);
        const arr = matrixToArray(bits);
        hash['h' + j] = makeArrayHash(arr);
        console.log(`h${j}: ${hash['h' + j]}`);
    }
    const data = fs.readFileSync('D:/work/marks/newcache/USSR.json', 'utf8');
    const json = JSON.parse(data);

    let result = [];

    const p = 0.6;
    for (let i = 0; i < json.length; i++) {
        // let s = 0;
        const item = json[i];
        let compare = {
            h4: false,
            h8: false,
            h16: false
        };
        for (let j = 4; j <= 16; j*=2) {
            const h = hafman(item['h' + j], hash['h' + j]);
            // console.log(h.h/h.l);
            compare['h' + j] = (1 - h.h/h.l) >= p;
        }
        if (compare['h4'] && compare['h8'] && compare['h16']) {
            result.push({
                key: 3,
                data: item
            });
        } else if (compare['h4'] && compare['h8'] || compare['h4'] && compare['h16'] || compare['h8'] && compare['h16']) {
            result.push({
                key: 2,
                data: item
            });
        } else if (compare['h4'] || compare['h8'] || compare['h16']) {
            result.push({
                key: 1,
                data: item
            });
        }
        console.log(`progres ${i + 1}/${json.length}`)
    }
    result.sort((a1, a2) => a1.key < a2.key ? -1 : a1.key === a2.key ? 0 : 1);
    let html = "";
    console.log(result.length);
    for (let i = 0; i < result.length; i++) {
        html += `<img src='${result[i].data.img}' />`;
    }
    fs.writeFileSync("D:/work/marks/test/findresult/index.html", `${htmlHead}${html}${htmlFooter}`, 'utf8');
    console.log('Complete');
});

/**
 * Парсим
 */
// const parser2 = new ParserV2();
// console.time1('Total time');
// parser2.parseAllPages(
//     {
//         siteUrl: 'https://www.stampworld.com',
//         pageUrl: 'https://www.stampworld.com/ru/stamps/USSR/',
//         outPutDir: "d:/work/marks/newcache",
//         name: "USSR",
//         cbProgress: (progress, length) => {
//             console.log(`progress: ${progress}/${length}`);
//         }
//     })
//     .then(
//         (parseResult) => {
//             const loadImageSync = (i, cb) => {
//                 if (i === parseResult.length) {
//                     return cb();
//                 }
//                 buildImage(parseResult[i].img, (err, matrix) => {
//                     if (err) {
//                         return console.error(err);
//                     }
//
//                     for (let j = 4; j <= 16; j *= 2) {
//                         const gray = imageToGrayMatrix(matrix);
//                         const scale = scaleMatrix(gray, j);
//                         const bits = bitsMatrix(scale);
//                         const arr = matrixToArray(bits);
//                         parseResult[i]['h' + j] = makeArrayHash(arr);
//                     }
//
//                     console.log('Load complete, w:',matrix.width,' h:', matrix.height);
//                     console.log(`progress load images: ${i + 1}/${parseResult.length}`);
//
//                     setTimeout(()=>{
//                         loadImageSync(i + 1, cb);
//                     }, 0);
//                 });
//             };
//             loadImageSync(0, () => {
//                 fs.writeFile("d:/work/marks/newcache/USSR.json", JSON.stringify(parseResult), "utf8", (err) => {
//                     if (err) {
//                         return console.error('Error write file: ', err);
//                     }
//                     console.log('Write file complete');
//                     console.timeEnd('Total time');
//                 });
//
//             })
//         },
//         (err) => {
//             console.error('Error perser', err);
//         }
//     ).catch((err) => {
//         console.error('Exception: ', err)
// });

const matrixToString = (matrix) => {
    let str = `w: ${matrix.width}; h: ${matrix.height}\r\n`;
    for (let i = 0; i < matrix.height; i++){
        for(let j =0; j< matrix.width; j++) {
            str += Math.round(matrix.matrix[i][j]) + " ";
        }
        str += "\r\n";
    }
    return str;
};
// buildImage("D:\\Work\\Marks\\test\\real\\10.png", (err, matrix) => {
//     if (err) {
//         console.log(err);
//         return;
//     }
//
//     const center = matrix;//cutCenter(matrix, 0.01);
//     const gray = imageToGrayMatrix(matrix);
//     const scale = scaleMatrix(gray, 8);
//     const bits = bitsMatrix(scale);
//     const arr = matrixToArray(bits);
//     const hash = makeArrayHash(arr);
//
//     console.log('++Scale++');
//     console.log(matrixToString(scale));
//     console.log('++Gray++');
//     console.log(matrixToString(gray));
//     console.log('++Bits++');
//     console.log(matrixToString(bits));
//     console.log('Array', arrayToLineString(arr));
//     console.log('Hash', hash);
//
// });
// const testMatrix = {
//     width: 8,
//     height: 8,
//     matrix: [
//         [5, 3, 4, 2, 5, 3, 4, 2],
//         [4, 3, 4, 2, 5, 3, 4, 2],
//         [3, 3, 4, 2, 5, 3, 4, 2],
//         [2, 3, 4, 2, 5, 3, 4, 2],
//         [1, 3, 4, 2, 5, 3, 4, 2],
//         [0, 3, 4, 2, 5, 3, 4, 2],
//         [0, 3, 4, 2, 5, 3, 4, 2],
//         [0, 3, 4, 2, 5, 3, 4, 2]
//     ]
// };
//
// const scale = scaleMatrix(testMatrix, 4);
// const bits = bitsMatrix(scale);
// const arr = matrixToArray(bits);
// const hash = makeArrayHash(arr);
//
// console.log(matrixToString(testMatrix));
// console.log(matrixToString(scale));
// console.log(matrixToString(bits));
// console.log('Array', arrayToLineString(arr));
// console.log('Hash', hash);

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

// makeImageHash({
//     url: "D:\\Work\\Marks\\hand-cache\\101.jpg",
//     size: SIZE
// }, (err, hash1) => {
//     if (err) {
//         return console.error(err)
//     }
//     makeImageHash({
//         url: imagePath,
//         per: 0.015,
//         size: SIZE
//     }, (err2, hash2) => {
//         if (err2) {
//             return console.error(err2);
//         }
//         const h = hafman(hash1.hash, hash2.hash);
//         console.log(`H: ${h.h}, L: ${h.l}, P: ${1 - h.h / h.l}`);
//     })
// });

// makeImageHash(
//     {
//         url: imagePath,
//         per: 0.015,
//         size: 4
//     },
//     (err1, hash4) => {
//         if (err1) {
//             return console.error('Error 1: ', err1);
//         }
//         makeImageHash({
//             url: imagePath,
//             per: 0.015,
//             size: 8
//         }, (err2, hash8) => {
//             if (err2) {
//                 return console.error('Error 2: ', err2);
//             }
//             makeImageHash({
//                 url: imagePath,
//                 per: 0.015,
//                 size: 16
//             }, (err3, hash16) => {
//                if (err3) {
//                    return console.error('Error 3: ', err3);
//                }
//                fs.readFile(cacheDir + "/flat.cache.json", 'utf8', (err, data) => {
//                    if (err) {
//                        return console.error('Error read file: ', err);
//                    }
//                    let min = 1;
//                    const p = 0.3;
//                    const json = JSON.parse(data);
//                    const find1 = [];
//                    let oldPer = 0;
//                    for (let i = 0; i < json.length; i++) {
//                        const h = hafman(hash4.hash, json[i].h4);
//                        if (h.h / h.l < p) {
//                            find1.push(json[i]);
//                        }
//                        let per = Math.round(100 * (i + 1) / json.length);
//                        if (per !== oldPer) {
//                            oldPer = per;
//                            console.log(`Progress: ${per}%`);
//                        }
//                    }
//                    oldPer = 0;
//                    const find2 = [];
//                    for (let i = 0; i < find1.length; i++) {
//                         const h = hafman(hash8.hash, find1[i].h8);
//                         if (h.h / h.l < p) {
//                             find2.push(find1[i]);
//                         }
//                    }
//                    const find3 = [];
//                    for (let i = 0; i < find2.length; i++) {
//                        const h = hafman(hash16.hash, find2[i].h16);
//                        if (h.h / h.l < p) {
//                            find3.push(find2[i]);
//                        }
//                    }
//                    console.log('Find');
//                    console.log(find3);
//                    for (let i = 0; i < find3.length; i++) {
//                        fs.createReadStream(find3[i].img).pipe(fs.createWriteStream('d:\\work\\marks\\test\\findresult\\' + i + ".jpeg"));
//                    }
//                })
//             });
//         });
//     });


/**
 * Формирует перцептивный хэш изображания
 * @param {{url: string, per: number|null, size: number}} options Параметры изображения
 *                                             url  - локальный адрес изображения
 *                                             per  - процент обризания изображения по бокам (0...1)
 *                                             size - на сколько облостей делить изображение
 * @param {function} cb Callback функция, будет вызвана по окончанию хэширования
 */
// function makeImageHash(options, cb) {
//     let {url, per, size} = options;
//     if (!per) per = 0;
//     getPixels(url, (err, pixels) => {
//         if (err) {
//            return cb ? cb(err) : null;
//         }
//
//         let matrix = [];
//         const width = pixels.shape[0];
//         const height = pixels.shape[1];
//
//         const offsetX = (width * per) / 2;
//         const offsetY = (height * per) / 2;
//
//         const dw = (width - offsetX * 2) / size;
//         const dh = (height - offsetY * 2) / size;
//         const scale = dw * dh;
//
//
//         let y = 0;
//         let max = 0;
//         let min = 255;
//
//         for (let i = offsetY; i < height - offsetY && y < size; i += dh) {
//             matrix[y] = [];
//             let x = 0;
//             for (let j = offsetX; j < width - offsetX && x < size; j += dw) {
//                 let s = 0;
//                 for (let y1 = i; y1 < i + dh - 1 && y1 < height - offsetY; y1++) {
//                     for (let x1 = j; x1 < j + dw - 1 && x1 < width - offsetX; x1++) {
//                         const rx = Math.round(x1);
//                         const ry = Math.round(y1);
//                         const color = {r:pixels.get(rx, ry, 0), g: pixels.get(rx, ry, 1), b: pixels.get(rx, ry, 2)}
//                         s += rgbToGray(color);
//                     }
//                 }
//                 s /= scale;
//                 matrix[y][x] = s;
//                 if (s > 255) console.log(s);
//                 x++;
//                 if (s > max) max = s;
//                 if (s < min) min = s;
//             }
//             y++;
//         }
//
//
//         const t = min + (max - min) / 2;
//
//         const bits = bitsThreshold(matrix, t);//bitsDSC(matrix, size);//;
//         const hash = makeMatrixHash(bits);
//
//         return cb ? cb(null, hash) : null;
//     });
// }
//
// function bitsDSC(matrix, size) {
//     const z = Math.PI / (2 * size);
//
//     const fc = (i) =>
//         i === 0
//         ? Math.sqrt(1 / size)
//         : Math.sqrt(2 / size);
//
//     const dsc = (u, v) => {
//         let r = 0;
//         for (let y = 0; y < size; y++) {
//             for (let x = 0; x < size; x++) {
//                 r += matrix[y][x] * Math.cos((2 * y + 1) * u * z) * Math.cos((2 * x + 1) * v * z);
//             }
//         }
//         return r * fc(u) * fc(v);
//     };
//     const result = [];
//     let max = -1000;
//     let min = 1000;
//
//     for (let i = 0; i < size; i++) {
//         result[i] = [];
//         for (let j = 0; j < size; j++) {
//             const d = dsc(i, j);
//             result[i][j] = d;
//             if (i !== 0 && j !== 0) {
//                 if (d > max) max = d;
//                 if (d < min) min = d;
//             }
//         }
//     }
//     const t = min + (max - min) / 2;
//     const bits = [];
//     for (let y = 0; y < size; y++) {
//         bits[y] = [];
//         for (let x = 0; x < size; x++) {
//             bits[y][x] = result[y][x] > t ? 1 : 0;
//         }
//     }
//     return bits;
// }

/**
 * Бинаризация изображения по среднему
 * @param {[[]]} matrix Матрица изображения с яркостями
 * @param {number} t Порог бинаризации
 * @returns {[]} Бинаризированное изображение
 */
// function bitsThreshold(matrix, t) {
//     const bits = [];
//     for (let y = 0; y < matrix.length; y++) {
//         bits[y] = [];
//         for (let x = 0; x < matrix[y].length; x++) {
//             bits[y][x] = matrix[y][x] > t ? 1 : 0;
//         }
//     }
//     return bits;
// }

////HELPERS////

function arrayToLineString(array, sep = '') {
    let str = "";

    for (let i = 0; i < array.length; i++) {
        str += array[i];
        if (i !== array.length - 1) str += sep;
    }
    return str;
}

const getFlatArray = (currentPath, cb) => {
    console.time('Total time');
    const result = [];
    const nameClean = name => {
        if (name[name.length - 1] === '.') {
            name = name.substring(0, name.length - 1);
        }
        return name.replace('/', '@');
    };
    fs.readFile(currentPath + '/cache.json', 'utf8', (err, data) => {
        if (err) {
            return console.log(err);
        }
        const json = JSON.parse(data);

        const readArray = (dir, item) => {
            const currentDir = dir + '/' + nameClean(item.name);
            if (item.countries.length !== 0) {
                for (let i = 0; i < item.countries.length; i++) {
                    readArray(currentDir, item.countries[i]);
                }
            } else {
                result.push(currentDir);
            }
        };

        for (let i = 0; i < json.length; i++) {
            readArray(currentPath, json[i]);
        }
        const totalResult = [];
        for (let i = 0; i < result.length; i++) {
            const d = fs.readFileSync(result[i] + '/data.json', 'utf8');
            const dJson = JSON.parse(d);
            for (let j = 0; j < dJson.length; j++) {
                dJson[j].img = dJson[j].img.replace('./cache', currentPath).replace('./', '/');
                delete dJson[j].marker;
                totalResult.push(dJson[j]);
            }
            console.log(`Progress: ${(100 * (i + 1) / result.length).toFixed(2)}%`)
        }

        console.log('Result length: ', result.length);
        console.log('Total result length: ', totalResult.length);
        let oldPer = 0;
        console.log('foreach start');
        let forEachSync = (i, cb) => {
            if (i >= totalResult.length) {
                return cb();
            }
            const item = totalResult[i];
            const path = item.img;
            makeImageHash({
                url: path,
                size: 16
            }, (err16, hash16) => {
                if (err16) {
                    console.error('Error16: ', err16);
                    return forEachSync(i + 1, cb);
                }
                makeImageHash({
                    url: path,
                    size: 8
                }, (err8, hash8) => {
                    if (err8) {
                        console.error('Error8:', err8);
                        return forEachSync(i + 1, cb);
                    }
                    makeImageHash({
                        url: path,
                        size: 4
                    }, (err4, hash4) => {
                        if (err4) {
                            console.error('Error4: ', err4);
                            return forEachSync(i + 1, cb);
                        }
                        totalResult[i].h4 = hash4.hash;
                        totalResult[i].h8 = hash8.hash;
                        totalResult[i].h16 = hash16.hash;
                        const per = Math.round((100 * (i + 1) / totalResult.length));
                        if (per !== oldPer) {
                            oldPer = per;
                            console.log(`Progress: ${per}%`);
                        }
                        forEachSync(i + 1, cb);
                    })
                })
            });
        };
        forEachSync(0, () => {
            fs.writeFileSync(currentPath + "/flat.cache.json", JSON.stringify(totalResult), 'utf8');
            console.timeEnd('Total time');
            console.log('foreach end');
        });
    });
};


// getFlatArray(cacheDir, (err, data) => {
//     console.log(data);
// });