import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const logFileName = 'log.txt';
const logLevel = process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL as string) : 2;
const logFilePath = `logs/${logFileName}`;

fs.writeFile(logFilePath, '', (err) => { if (err) console.log('error writing log', err) });

// Levels:
//   0: SERVER/CRITICAL/ERRORS level
//   1: general checks, user interactions, db interactions
//   2: succes of anything
export function log(level: 0 | 1 | 2, tag: string, msg: string) {
    const selectedLevel = logLevel;
    if (level > selectedLevel) return;
    const spacesLeft = ' '.repeat(15 - tag.length);
    const spacesRight = ' '.repeat(2);
    const levelWord = level == 2 ? 'LOW' : (level == 1 ? 'MED' : "HIG");
    const data = `${Date.now()} [${tag}]${spacesLeft}(${levelWord})${spacesRight}: ${msg}\n`;
    fs.appendFile(logFilePath, data, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
}

log(0, 'SERVER', `logging at level: ${logLevel}`);
