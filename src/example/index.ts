import { exec } from 'child_process';
import { GoogleASR } from '../app/index';

const inputFile = './audios/audio.m4a';
const outputFile = './audios/audio.flac';

function audioParser(inputFile: string, outputFile: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const ffmpegProcess = exec(`ffmpeg -i ${inputFile} -acodec flac -ar 16000 -ac 1 ${outputFile}`);

		// Caso queira ver o progresso do ffmpeg
		// ffmpegProcess.stderr?.on('data', (data: Buffer | string) => {
		// 	console.log(data.toString());
		// });

		ffmpegProcess.on('exit', code => {
			if (code === 0) {
				resolve(outputFile);
			} else {
				reject(`O processo ffmpeg falhou com o código de saída: ${code}`);
			}
		});
	});
}

async function getTextFromAudio(audioPath: string) {
	if (typeof audioPath !== 'string') return;

	const response = await GoogleASR({
		audioFilepath: audioPath,
	});

	if (response !== null && response.type === 'success') {
		return response.alternative[0].transcript;
	}
}

/**
    Apague o audio.flac caso tente novamente.
    Assim evitando erro de conversão no ffmpeg por conta do nome repetido
 */
async function start() {
	console.log('Convertendo o audio');
	const parsedFile = await audioParser(inputFile, outputFile);

	console.log('Transcrevendo o audio');
	const text = await getTextFromAudio(parsedFile);

	console.log(text);
}

start();
