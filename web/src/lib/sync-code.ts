// Sync codes are two French words, like "boussole-cerisier". People may
// type them with or without accents, capitals, a space or a dash: this turns
// any of those into the form the server stores ("boussole-cerisier").
export function normalizeCode(input: string): string {
	return input
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.split(/[^a-z]+/)
		.filter(Boolean)
		.join('-');
}
