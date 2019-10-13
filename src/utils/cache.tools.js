import Parser from "./parser";

const fs = require('fs');

const cacheDir = "D:/Work/Marks/cache";

export function dist(v1, v2) {
    let xy = 0;
    let x2 = 0;
    let y2 = 0;

    for (let i = 0; i < v1.length && i < v2.length; i++) {
        x2 += Math.pow(v1[i], 2);
        y2 += Math.pow(v2[i], 2);
        xy += 2 * v1[i] * v2[i];
    }
    return Math.sqrt(x2 - xy + y2) / (Math.sqrt(x2) + Math.sqrt(y2));
};

export function findCacheMarks(vs, cb) {
    let time = performance.now();
    fs.readFile(cacheDir + '/cache.json', 'utf8', (err, data) => {
        if (err) {
            return cb ? cb(err) : null;
        }
        const json = JSON.parse(data);
        const parser = new Parser(cacheDir, json);
        const flatArray = parser.getFlatArray();
        let finded = {
            d: 100,
            path: ''
        };
        for (let i = 0; i < flatArray.length; i++) {
            try{
                const result = fs.readFileSync(flatArray[i].uri + '/data.json', 'utf8');
                const resultJson = JSON.parse(result);
                for (let j = 0; j < resultJson.length; j++) {
                    const vPath = resultJson[j].marker.replace(/.\/cache/g, cacheDir);
                    const data = fs.readFileSync(vPath, 'utf8');
                    const dataV = JSON.parse(data);
                    const d = dist(vs, dataV);
                    if (d < finded.d) {
                        finded.d = d;
                        finded.path = vPath;
                    }
                        // console.log('Dist: ', d, 'path: ', vPath);

                    // console.log(vPath, dataV);
                }
            }catch(e){
                console.log('Error read');
            }
            console.log(`Progress: ${i + 1}/${flatArray.length}`);
        }
        console.log(finded);
        console.log('Total time: ', performance.now() - time);
        return cb ? cb(null, flatArray) : null;
    });
}
