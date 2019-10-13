const getPixels = require('get-pixels');
const fs = require('fs');
const FParser = require('./sleep.room.test.parser');

const cacheDir = "D:\\Work\\Stores\\furniture\\cache.json";
const parser = new FParser();
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

//"https://domson.ru/mebel_po_kategoriyam/spalni/0/"

const timerLabel = 'Total time';
console.time(timerLabel);
// parser.getImagesWithLinks()
//         .then(
//             (info) => {
//                 const buildHashSync = (i, cb) => {
//                     if (i === info.length) {
//                         return cb ? cb() : null;
//                     }
//                     buildImage(info[i].img, (err, matrix) => {
//                         if (err) {
//                             return cb ? cb(err) : null;
//                         }
//                         for (let j = 4; j <= 16; j *= 2) {
//                             const gray = imageToGrayMatrix(matrix);
//                             const scale = scaleMatrix(gray, j);
//                             const bits = bitsMatrix(scale);
//                             const arr = matrixToArray(bits);
//                             info[i]['h' + j] = makeArrayHash(arr);
//                         }
//
//                     console.log('Load complete, w:',matrix.width,' h:', matrix.height);
//                     console.log(`progress load images: ${i + 1}/${info.length}`);
//
//                         setTimeout(()=>{
//                             buildHashSync(i + 1, cb);
//                         }, 200);
//                     });
//                 };
//                 console.log('Loading pages complete');
//                 buildHashSync(0, (err) => {
//                     if (err) {
//                         return console.error('Error build hash: ', err);
//                     }
//                     console.log('Make hash complete, saving file');
//                     fs.writeFileSync(cacheDir, JSON.stringify(info), 'utf8');
//                     console.log('Complete');
//                     console.timeEnd(timerLabel);
//                 })
//             },
//             (error) => {
//                 console.error(error);
//             }
//         );

function findImage(img, cb) {
    buildImage(img, (err, matrix) => {
        if (err) {
            return cb ? cb(err) : null;
        }
        const result = [];
        try{
            const hash = {
                h4: '',
                h8: '',
                h16: ''
            };
            for (let j = 4; j <= 16; j *= 2) {
                const gray = imageToGrayMatrix(matrix);
                const scale = scaleMatrix(gray, j);
                const bits = bitsMatrix(scale);
                const arr = matrixToArray(bits);
                hash['h' + j] = makeArrayHash(arr);
            }
            const data = fs.readFileSync(cacheDir, 'utf8');
            const json = JSON.parse(data);
            const p = 0.8;
            for (let i = 0; i < json.length; i++) {
                const h4 = hafman(json[i]['h4'], hash['h4']);
                const h8 = hafman(json[i]['h8'], hash['h8']);
                const h16 = hafman(json[i]['h16'], hash['h16']);
                const total = (1 - h4.h / h4.l + 1 - h8.h / h8.l + 1 - h16.h / h16.l) / 3;
                if (total >= 0.5) {//1 - h4.h / h4.l >= 0.7 && 1 - h8.h / h8.l >= 0.4 && 1 - h16.h / h16.l >= 0.3) {
                    console.log(`h4: ${1 - h4.h / h4.l}`);
                    console.log(`h8: ${1 - h8.h / h8.l}`);
                    console.log(`h16: ${1 - h16.h / h16.l}`);
                    console.log(total);
                    result.push({p: total, data: json[i]});
                }
            }
        }catch (e) {
            return cb ? cb(e) : null;
        }
        if (cb) cb(null, result);
    });
}
const imgPath = "D:\\Work\\Stores\\furniture\\6.jpg";
console.log('Find start');
findImage(imgPath, (err, result) => {
    if (err) {
        return console.error(err);
    }
    let html = '<ul>';
    result.sort((a1, a2) => a1.p === a2.p ? 0 : a1.p > a2.p ? -1 : 1);
    for(let i = 0; i < result.length; i++) {
        html += `<li><a href="${result[i].data.url}" target="_blank">Link ${i + 1}: Похожи на: ${(100 * result[i].p).toFixed(2)}%</a></li>`;
    }
    html += "</ul>";
    fs.writeFile("D:\\Work\\Stores\\furniture\\find.html", `${htmlHead}${html}${htmlFooter}`,'utf8',  (err) =>{
        if (err) {
            return console.error(err);
        }
        console.log('Complete');
        console.timeEnd(timerLabel);
    });
});

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