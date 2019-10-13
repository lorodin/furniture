//// TOTAL PARSING TIME: 291311
const fs = require('fs');

export function findAllDuplicates(items1, items2, per) {
    return new Promise((res, rej) => {
       setTimeout(()=>{
           const result = [];
           for (let i = 0; i < items1.length; i++) {
               let item = items1[i];
               let itemResult = [];
               for (let j = 0; j < items2.length; j++) {
                   const h4 = hafman(item.h4, items2[j].h4);
                   const h8 = hafman(item.h8, items2[j].h8);
                   const h16 = hafman(item.h16, items2[j].h16);
                   const rh4 = hafman(item.rh4, items2[j].h4);
                   const rh8 = hafman(item.rh8, items2[j].h8);
                   const rh16 = hafman(item.rh16, items2[j].h16);

                   const p4  = (1 - h4.h / h4.l);
                   const p8  = (1 - h8.h / h8.l);
                   const p16 = (1 - h16.h / h16.l);
                   const total = (p4 + p8 + p16) / 3;

                   const rp4 = (1 - rh4.h / rh4.l);
                   const rp8 = (1 - rh8.h / rh8.l);
                   const rp16 = (1 - rh16.h / rh16.l);
                   const rtotal = (rp4 + rp8 + rp16) / 3;

                   if (per <= total || per <= rtotal) {
                       itemResult.push({
                           p4: total > rtotal ? p4 : rp4,
                           p8: total > rtotal ? p8 : rp8,
                           p16: total > rtotal ? p16 : rp16,
                           totalP: total > rtotal ? total : rtotal,
                           ...items2[j]
                       });
                   }
               }
               itemResult.sort((r1, r2) => r1.totalP === r2.totalP ? 0 : r1.totalP > r2.totalP ? -1 : 1);
               result.push({
                   current: item,
                   duplicates: itemResult
               });
           }
            result.sort((t1, t2) => {
               if (t1.duplicates.length === 0 && t2.duplicates.length === 0) {
                   return 0;
               }
               if (t1.duplicates.length !== 0 && t2.duplicates.length === 0) {
                   return -1;
               }
               if (t1.duplicates.length === 0 && t2.duplicates.length !== 0) {
                   return 1;
               }
               if (t1.duplicates[0].totalP > t2.duplicates[0].totalP) {
                   return -1;
               } else if(t1.duplicates[0].totalP < t2.duplicates[0].totalP) {
                   return 1;
               }
                if (t1.duplicates[0].p16 > t2.duplicates[0].p16) {
                    return -1
                } else if(t1.duplicates[0].p16 < t2.duplicates[0].p16) {
                    return 1;
                }
                if (t1.duplicates[0].p8 > t2.duplicates[0].p8) {
                    return -1
                } else if(t1.duplicates[0].p8 < t2.duplicates[0].p8) {
                    return 1;
                }
                if (t1.duplicates[0].p4 > t2.duplicates[0].p4) {
                    return -1
                } else if(t1.duplicates[0].p4 < t2.duplicates[0].p4) {
                    return 1;
                }

                return 0;
            });
           res(result);
       }, 0);
    });
}

export function findDuplicate(item, items, per) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            const result = [];
            for (let i = 0; i < items.length; i++) {
                const h4 = hafman(item.h4, items[i].h4);
                const h8 = hafman(item.h8, items[i].h8);
                const h16 = hafman(item.h16, items[i].h16);
                const p4  = (1 - h4.h / h4.l);
                const p8  = (1 - h8.h / h8.l);
                const p16 = (1 - h16.h / h16.l);
                if (per <= (p4 + p8 + p16) / 3) {
                    result.push({
                        p4: p4,
                        p8: p8,
                        p16: p16,
                        totalP: (p4 + p8 + p16) / 3,
                        ...items[i]
                    });
                }
            }
            result.sort((r1, r2) => r1.totalP === r2.totalP ? 0 : r1.totalP > r2.totalP ? -1 : 1);
            res(result);
        }, 0);
    });
}

export function loadCacheFile(path) {
    return new Promise((res, rej) => {
       fs.readFile(path, 'utf8', (err, data) => {
           if (err) {
               return rej(err);
           }
           res(JSON.parse(data));
       })
    });
}

export function matrixToArray(matrix) {
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
export function hafman(h1, h2) {
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
export function makeArrayHash(arr) {
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

/**
 * Бинаризация матрицы
 * @param matrix
 * @returns {{width: *, matrix: *, height: *}}
 */
export function bitsMatrix(matrix) {
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

/**
 * Изменяет размер матрицы (делает ее квадратной)
 * @param matrix
 * @param size
 * @returns {{width: *, matrix: *, height: *}}
 */
export function scaleMatrix(matrix, size) {
    size = size <= 0 ? 1 : 0;
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

/**
 * Вырезает цент изображения
 *
 * @param {{width: {number}, matrix: [[]], height: {number}}} matrix
 * @param {number} perOffset Процент отсутпов со всех сторон (0...1)
 * @returns {{width: {number}, matrix: [[]], height: {number}}}
 */
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

/**
 * Преобразует изображение в градации серого
 * @param {{width: {number}, matrix: [[]], height: {number}}} matrix
 * @returns {{width: {number}, matrix: [[]], height: {number}}}
 */
export function imageToGrayMatrix(matrix) {
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
export function buildImage(imagePath, cb) {
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