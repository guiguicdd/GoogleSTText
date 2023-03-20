"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const index_1 = require("../app/index");
const inputFile = './audios/audio.m4a';
const outputFile = './audios/audio.flac';
function audioParser(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = (0, child_process_1.exec)(`ffmpeg -i ${inputFile} -acodec flac -ar 16000 -ac 1 ${outputFile}`);
        ffmpegProcess.on('exit', code => {
            if (code === 0) {
                resolve(outputFile);
            }
            else {
                reject(`O processo ffmpeg falhou com o código de saída: ${code}`);
            }
        });
    });
}
async function getTextFromAudio(audioPath) {
    if (typeof audioPath !== 'string')
        return;
    const response = await (0, index_1.GoogleASR)({
        audioFilepath: audioPath,
    });
    if (response !== null && response.type === 'success') {
        return response.alternative[0].transcript;
    }
}
async function start() {
    console.log('Convertendo o audio');
    const parsedFile = await audioParser(inputFile, outputFile);
    console.log('Transcrevendo o audio');
    const text = await getTextFromAudio(parsedFile);
    console.log(text);
}
start();
