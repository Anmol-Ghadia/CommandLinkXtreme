import fs from 'fs';

const logFileName = 'log.txt';

fs.writeFile('log.txt','',(err)=>{if (err) console.log('error writing log',err)});

// Levels:
//   0: SERVER/CRITICAL/ERRORS level
//   1: general checks, user interactions, db interactions
//   2: succes of anything
export function log(level:0|1|2,tag:string,msg:string) {
    const selectedLevel = parseInt(process.env.LOGGING_LEVEL as string);
    if (level>selectedLevel) return;
    const spaces = ' '.repeat(15-tag.length);
    const data = `${Date.now()} [${tag}]${spaces}: ${msg}\n`;
    fs.appendFile(logFileName, data, (err)=>{
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}
