import qs from 'querystring';
import fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

const GOOGLE_ASR_URL = 'http://www.google.com/speech-api/v2/recognize?';
const DEFAULT_CLIENT = 'chromium';
const DEFAULT_CONTENT_TYPE = 'audio/x-flac; rate=16000;'; // Tipo de arquivo
const DEFAULT_DEVELOPER_KEY = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw'; // `API Keys http://www.chromium.org/developers/how-tos/api-keys
const DEFAULT_LANGUAGE = 'pt-br'; // Lista de tags suportadas http://stackoverflow.com/a/14302134
const DEFAULT_PROFANITY_FILTER = 0; // 0 desativado. 1 ativado. Mostra palavrões com ****
const DEFAULT_OUTPUT = 'json'; // Não faz muita diferença

interface IOptions {
	audioFilepath: string;
	key?: string;
	client?: 'client';
	contentType?: 'audio/x-flac; rate=16000;';
	language?: string;
	profanityFilter?: 0 | 1;
	output?: 'json';
	raw?: boolean;
}

interface IGoogleData {
	type: 'success';
	alternative: Array<{ transcript: string; confidence: number }>;
	final: boolean;
}

type IReturnType = Promise<
	{ type: 'raw'; result: string } | { type: 'nothing'; result: [] } | IGoogleData | null
>;

export async function GoogleASR(options: IOptions): IReturnType {
	// Verifique se os parâmetros obrigatórios estão presentes e se seus valores estão corretos.
	if (options?.audioFilepath === '') {
		throw new Error('audioFilepath is required');
	}

	const file = {
		path: options.audioFilepath,
		contentType: options.contentType ?? DEFAULT_CONTENT_TYPE,
	};

	const params = {
		client: options.client ?? DEFAULT_CLIENT,
		key: options.key ?? DEFAULT_DEVELOPER_KEY,
		lang: options.language ?? DEFAULT_LANGUAGE,
		pFilter: options.profanityFilter ?? DEFAULT_PROFANITY_FILTER,
		output: options.output ?? DEFAULT_OUTPUT,
	};

	const fullUrl = GOOGLE_ASR_URL + qs.encode(params);

	const data = await readFileAsync(file.path);
	const response = await axios.post(fullUrl, data, {
		headers: {
			'Content-Type': file.contentType,
		},
	});

	const responseString = response.data as string | { result: [] };

	if (typeof responseString !== 'string') return responseString as { type: 'nothing'; result: [] };

	if (options?.raw ?? false) {
		return { type: 'raw', result: responseString };
	}

	let actualResult: IGoogleData | null = null;
	const lines = responseString.split('\n');

	for (const line of lines) {
		if (line.length <= 0) continue;
		const parsed = JSON.parse(line) as { result: IGoogleData[] };

		if (parsed.result.length !== 0) {
			actualResult = parsed.result[0];
			break;
		}
	}

	if (actualResult == null) return actualResult;

	return { ...actualResult, type: 'success' };
}
