import { requestUrl } from "obsidian";

export interface TagDefinition {
	name: string;
	instructions: string;
	matchCriteria: string;
	otherCriteria: string;
	enabled: boolean;
}

export interface JevAnswer {
	choice?: string;
	confidence?: number;
	probabilities?: Record<string, number>;
}

export interface JevResponse {
	model: string;
	answers: Record<string, JevAnswer>;
	usage?: {
		input_tokens: number;
		output_tokens: number;
	};
}

export interface NoteEvaluationResult {
	tagName: string;
	probability: number;
	confidence: number;
	isMatch: boolean;
	description: string;
}

export class JevClient {
	private apiKey: string;
	private endpoint: string;

	constructor(apiKey: string, endpoint: string = "https://api.typesafe.ai/v1/systemone") {
		this.apiKey = apiKey;
		this.endpoint = endpoint;
	}

	public setApiKey(key: string) {
		this.apiKey = key;
	}

	public async evaluateNote(
		state: Record<string, any>,
		tags: TagDefinition[]
	): Promise<NoteEvaluationResult[]> {
		if (!this.apiKey) {
			throw new Error("Jev API Key is not configured. Please set it in the plugin settings.");
		}

		const enabledTags = tags.filter((t) => t.enabled);
		if (enabledTags.length === 0) {
			return [];
		}

		// Bundle questions for Jev
		const questions: Record<string, any> = {};
		for (const tag of enabledTags) {
			questions[`q_${tag.name}`] = {
				type: "choice",
				instructions: tag.instructions,
				criteria: {
					match: tag.matchCriteria,
					other: tag.otherCriteria,
				},
			};
		}

		const payload = {
			model: "jev-latest",
			state: state,
			questions: questions,
		};

		const response = await requestUrl({
			url: this.endpoint,
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
				"User-Agent": "obsidian-jev-tagger/1.0",
			},
			body: JSON.stringify(payload),
		});

		if (response.status !== 200) {
			throw new Error(`Jev API Error (${response.status}): ${response.text}`);
		}

		const data = response.json as JevResponse;
		const results: NoteEvaluationResult[] = [];

		for (const tag of enabledTags) {
			const ans = data.answers[`q_${tag.name}`];
			if (!ans) continue;

			let matchProb = 0;
			if (ans.probabilities && typeof ans.probabilities.match === "number") {
				matchProb = ans.probabilities.match;
			} else if (ans.choice === "match") {
				matchProb = ans.confidence ?? 1.0;
			} else {
				matchProb = 0.0;
			}

			results.push({
				tagName: tag.name,
				probability: matchProb,
				confidence: ans.confidence ?? matchProb,
				isMatch: ans.choice === "match",
				description: tag.matchCriteria,
			});
		}

		// Sort by probability descending
		results.sort((a, b) => b.probability - a.probability);
		return results;
	}
}
