const getPixels = require('get-pixels');
const fs = require('fs');

/**
 * Вырезает и сохраняет изображения в папку
 * @param {string}      outputDir
 * @param {{}}          image
 * @param {array}       rects
 * @param {function}    cb
 */
export function makeImageFromRects(outputDir, image, rects, cb) {
    const result = [];
    for (let i = 0; i < rects.length; i++) {
        const points = rects[i];
        if (points.length < 4) continue;

        const imageData = createImageBase64(image, points);

        let data = imageData.replace(/^data:image\/png;base64,/, "");
            data  +=  data.replace('+', ' ');

        const binaryData  =   new Buffer(data, 'base64').toString('binary');

        const imagePath = outputDir + '\\' + i + '.png';

        fs.writeFileSync(imagePath, binaryData, 'binary');

        result.push(imagePath);
    }
    return cb ? cb(result) : null;
}

export function createImageBase64(image, points) {
    const tw = Math.sqrt(Math.pow(points[0].x - points[1].x, 2) + Math.pow(points[0].y - points[1].y, 2));
    const bw =  Math.sqrt(Math.pow(points[2].x - points[3].x, 2) + Math.pow(points[2].y - points[3].y, 2));
    const lh =  Math.sqrt(Math.pow(points[0].x - points[2].x, 2) + Math.pow(points[0].y - points[2].y, 2));
    const rh =  Math.sqrt(Math.pow(points[1].x - points[3].x, 2) + Math.pow(points[1].y - points[3].y, 2));

    const width = Math.max(tw, bw);
    const height = Math.max(lh, rh);

    const dt = tw / width;
    const db = bw / width;
    const dl = lh / height;
    const dr = rh / height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const realX = (x, y) => {
        const topOffset = points[0].x + dt * x;
        const bottomOffset = points[2].x + db * x;
        const per = y / height;
        const result = ((1 - per) * topOffset + per * bottomOffset);
        return Math.round(result);
    };

    const realY = (y, x) => {
        const leftOffset = points[0].y + dl * y;
        const rightOffset = points[1].y + dr * y;
        const per = x / width;
        const result = ((1 - per) * leftOffset + per * rightOffset);
        return Math.round(result);
    };

    for (let y = 0; y < height; y++ ) {
        for (let x = 0; x < width; x ++) {
            const point = {
                x: realX(x, y),
                y: realY(y, x)
            };

            ctx.fillStyle = `rgb(${image.pixels[point.y][point.x].r},${image.pixels[point.y][point.x].g},${image.pixels[point.y][point.x].b})`;

            ctx.fillRect(x, y, 1, 1);
        }
    }

    const base64 = canvas.toDataURL('image/png');

    canvas.remove();

    return base64;
}

export function findMarksAsync(bits, cb) {
    setTimeout(() => {
        cb(findMarks(bits));
    }, 0);
}
/**
 * Ищит марки на изображение
 * @param {boolean[][]} bits Бинаризированное изображение
 * @returns {[{}]}
 */
export function findMarks(bits) {
    if (bits.length === 0) return;
    const result = [];
    const width = bits[0].length;
    const height = bits.length;
    const matrix = [];

    for (let y = 0; y < height; y++) {
        matrix[y] = [];
        for (let x = 0; x < width; x++) {
            matrix[y][x] = false;
        }
    }
    const markPlace = (x1, y1, x2, y2) => {
        for (let x = x1; x <= x2 && x < width; x++) {
            for(let y = y1; y<=y2 && y < height; y++) {
                matrix[y][x] = true;
            }
        }
    };

    const lt = [];
    const rt = [];
    const lb = [];
    const rb = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (y > 10 && x > 10 && y < height - 11 && x < width - 11) {
                let lts = 0;
                let rts = 0;
                let lbs = 0;
                let rbs = 0;

                for (let y1 = y - 10; y1 <= y + 10; y1++) {
                    for (let x1 = x - 10; x1 <= x + 10; x1++) {
                        if (y1 < y && x1 < x) {
                            lts += bits[y1][x1] ? 1 : 0;

                        } else if (y1 < y && x1 > x) {
                            rts += bits[y1][x1] ? 1 : 0;
                        } else if (y1 > y && x1 < x) {
                            lbs += bits[y1][x1] ? 1 : 0;
                        } else if (y1 > y && x1 > x) {
                            rbs += bits[y1][x1] ? 1 : 0;
                        }
                    }
                }

                const max = Math.max(lts, rts, lbs, rbs);

                if (max < 90) continue;

                if (max === lbs ) {
                    if (lts < 10 && rbs < 10 && rts < 10)
                        rt.push({x: x, y: y});
                }
                else if (max === rbs){
                    if (lts < 10 && lbs < 10 && rts < 10)
                        lt.push({x: x, y: y});
                }
                else if (max === rts) {
                    if (lbs < 10 && lts < 10 && rbs < 10)
                        lb.push({x: x, y: y});
                }
                else if (max === lts) {
                    if (rts < 10 && rbs < 10 && lbs < 10)
                        rb.push({x: x, y: y});
                }
            }
        }
    }

    for(let i = 0; i < lt.length; i++) {
        if (matrix[lt[i].y][lt[i].x]) continue;
        let length = width;
        let rtIndex = -1;
        for (let j = 0; j < rt.length; j++) {
            if (matrix[rt[j].y][rt[j].x] || rt[j].x < lt[i].x) continue;
            if (rt[j].x - lt[i].x < length) {
                if (Math.abs(rt[j].y - lt[i].y) < 20) {
                    if (rtIndex === -1 || rt[rtIndex].x - lt[i].x > rt[j].x - lt[i].x) {
                        rtIndex = j;
                        length = rt[rtIndex].x - lt[i].x;
                    }
                }
            }
        }
        if (rtIndex === -1) continue;
        let lbIndex = -1;
        length = height;
        for (let j = 0; j < lb.length; j++) {
            if (matrix[lb[j].y][lb[j].x] || lb[j].y < lt[i].y) continue;
            if (lb[j].y - lt[i].y < length) {
                if (Math.abs(lb[j].x - lt[i].x) < 20) {
                    if (lbIndex === -1 || lb[lbIndex].y - lt[i].y > lb[j].y - lt[i].y) {
                        lbIndex = j;
                        length = lb[lbIndex].y - lt[i].y;
                    }
                }
            }
        }

        if (lbIndex === -1) continue;
        let rbIndex = -1;
        length = width;
        for (let j = 0; j < rb.length; j++) {
            if (matrix[rb[j].y][rb[j].x] || rb[j].x < lb[lbIndex].x) continue;
            if (rb[j].x - lb[lbIndex].x > length)  continue;
            if (Math.abs(rb[j].y - lb[lbIndex].y) > 20) continue;
            if (rbIndex !== -1 && rb[rbIndex].x - lb[lbIndex].x < rb[j].x - lb[lbIndex].x) continue;
            rbIndex = j;
            length = rb[rbIndex].x - lb[lbIndex].x;
        }

        if (rbIndex === -1) continue;
        // const rightBottomPoint = { x: rt[rtIndex].x - (lt[i].x - lb[lbIndex].x), y: lb[lbIndex].y - (lt[i].y - rt[rtIndex].y)};
        markPlace(
            Math.min(lt[i].x - 5, lb[lbIndex].x - 5),
            Math.min(lt[i].y - 5, rt[rtIndex].y - 5),
            Math.max(rb[rbIndex].x + 5, rt[rtIndex].x + 5),
            Math.max(lb[lbIndex].y + 5, rb[rbIndex].y + 5)
        );
        result.push([ lt[i], rt[rtIndex], lb[lbIndex], rb[rbIndex]]);

    }

    return result;
}


/**
 * Преобразует изображение из матрицы с цветами в rgb
 * @param imagePath путь к изображению
 * @param cb Callback функция
 */
export function buildImage(imagePath, cb) {
    const pxs = [];
    getPixels(imagePath, (err, pixels) => {
        if (err) {
            return cb ? cb(err) : null;
        }
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
                pixels: pxs
            }) : null;
    });
}

const rgbToGray = (pixel) =>  pixel.r * 0.2999 + 0.587 * pixel.g + 0.114 * pixel.b;
/**
 * Бинаризация изображения
 * @param image Модель изображения
 *              Формат:
 *              {
 *                  width: {int},
 *                  height: {int},
 *                  pixels: [
 *                      [
 *                          {
 *                              r: int,
 *                              g: int,
 *                              b: int
 *                          }
 *                      ]
 *                  ]
 *              }
 *
 * @param threshold Порог бинаризации
 * @param cb Callback
 */
export function imageToBitMap(image, threshold, cb) {
    setTimeout(() => {
        const bits = [];
        for (let y = 0; y < image.height; y++) {
            bits[y] = [];
            for (let x = 0; x < image.width; x++) {
                bits[y][x] = rgbToGray(image.pixels[y][x]) > threshold;
            }
        }
        return cb ? cb(bits) : null;
    }, 0);
}

/**
 * Структура для представления контрольной точки
 */
class Vertex {
    constructor(l, r, t, b, lt, lb, rt, rb) {
        this.l = l;
        this.r = r;
        this.t = t;
        this.b = b;
        this.lt = lt;
        this.lb = lb;
        this.rt = rt;
        this.rb = rb;
    }
    toArray() {
        const ar = [];

        ar.push(this.l);
        ar.push(this.r);
        ar.push(this.t);
        ar.push(this.b);
        ar.push(this.lt);
        ar.push(this.lb);
        ar.push(this.rt);
        ar.push(this.rb);

        return ar;
    }
}

/**
 * Формирует дескриптор на изображение
 * @param {string} url путь к изображению
 * @param {function} callback Callback функция
 */
export function makeMarker(url, callback) {
    getPixels(url, (err, pixels) => {
        if (err) {
            return callback ? callback(err) : null;
        }
        const rgbToGray = rgb => {
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        };
        const getPixel = (x, y) => {
            const out = [];
            const pointer =
                pixels.offset + pixels.stride[0] * x + pixels.stride[1] * y;

            for (let i = 0; i < 4; i += 1) {
                out.push(pixels.data[pointer + pixels.stride[2] * i]);
            }

            return out;
        };
        const f = d => {
            if (d <= 2 && d >= -2) return 0;
            if (d >= -50 && d <= -3) return -1;
            if (d < -50) return -2;
            if (d >= 3 && d <= 50) return 1;
            return 2;
        };

        const matrix = [];
        let min = 300;
        let max = 0;
        const width = pixels.shape[0];
        const height = pixels.shape[1];

        for (let y = 0; y < height; y += 1) {
            matrix[y] = [];
            for (let x = 0; x < width; x += 1) {
                matrix[y][x] = rgbToGray(getPixel(x, y));
                if (matrix[y][x] > max) max = matrix[y][x];
                if (matrix[y][x] < min) min = matrix[y][x];
            }
        }

        const dscale = (max - min) / 255.0;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                matrix[y][x] -= min;
                matrix[y][x] *= dscale;
            }
        }

        const size = 11;
        const dx = width / size;
        const dy = height / size;
        const points = [];
        const ssize = Math.max(2, Math.min(dx, dy) / 2);
        const square = (ssize + 1) * (ssize + 1);

        for (let y = 1; y < size - 1; y += 1) {
            points[y - 1] = [];
            for (let x = 1; x < size - 1; x += 1) {
                const i = x * dx;
                const j = y * dy;
                let s = 0;

                for (let j1 = j - ssize / 2; j1 <= j + ssize / 2; j1 += 1) {
                    for (let i1 = i - ssize / 2; i1 <= i + ssize / 2; i1 += 1) {
                        s += matrix[Math.round(j1)][Math.round(i1)];
                    }
                }

                s /= square;
                points[y - 1][x - 1] = s;
            }
        }

        const vs = [];

        for (let y = 0; y < size - 2; y += 1) {
            for (let x = 0; x < size - 2; x += 1) {
                const v = new Vertex(
                    x > 0 ? f(points[y][x] - points[y][x - 1]) : 0,
                    x < size - 3 ? f(points[y][x] - points[y][x + 1]) : 0,
                    y > 0 ? f(points[y][x] - points[y - 1][x]) : 0,
                    y < size - 3 ? f(points[y][x] - points[y + 1][x]) : 0,
                    x > 0 && y > 0 ? f(points[y][x] - points[y - 1][x - 1]) : 0,
                    x > 0 && y < size - 3 ? f(points[y][x] - points[y + 1][x - 1]) : 0,
                    x < size - 3 && y > 0 ? f(points[y][x] - points[y - 1][x + 1]) : 0,
                    x < size - 3 && y < size - 3
                        ? f(points[y][x] - points[y + 1][x + 1])
                        : 0
                );
                const va = v.toArray();
                for (let i = 0; i < va.length; i += 1) {
                    vs.push(va[i]);
                }
            }
        }

        callback(null, vs);
    });
}
