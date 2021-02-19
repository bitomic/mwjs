import chalk from 'chalk'
import { diffChars } from 'diff'

export default (string1: string, string2: string) => {
	let s = ''
	const diff = diffChars(string1, string2);
	for (const part of diff) {
		const color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray
		s += color(part.value)
	}
	return s
}