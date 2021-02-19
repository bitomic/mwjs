import API, { IAPIOptions } from './API'
import { chunkify, sleep } from '../utils'
import fetch from 'node-fetch'
import FormData from 'form-data'
import Signale from 'signale'

class Client {
	private api: API
	private logger: Signale.Signale
	constructor(apiOptions: IAPIOptions, clientOptions?: { log: boolean }) {
		this.api = new API(apiOptions)
		this.logger = new Signale.Signale()
		if (!clientOptions?.log) this.logger.disable()
		this.logger.config({
			displayDate: true,
			displayTimestamp: true
		})
	}

	async login() {
		const status = await this.api.login()
			.catch(e => this.logger.error('Could not login into your account.'))
		this.logger.success(`Successfully logged in as ${this.api.username}`)
	}

	async delete({ title, reason }: { title: string, reason?: string }) {
		const form = new FormData()
		form.append('title', title)
		if (reason) form.append('reason', reason)

		const params = { action: 'delete' }
		return await this.api.post({ params, form, csrf: true })
	}

	async edit({ title, summary, text, minor, mode }: { title: string, summary?: string, text: string, minor?: boolean, mode?: 'text' | 'appendtext' | 'prependtext' }) {
		if (!mode) mode = 'text'
		if (!minor) minor = false
		const form = new FormData()
		form.append('title', title)
		if (summary) form.append('summary', summary)
		form.append(mode, text)
		const params = { action: 'edit', bot: true, minor }
		return await this.api.post({ params, form, csrf: true })
	}

	async move(options: { from: string, to: string, reason?: string, noredirect?: boolean }) {
		const params = {
			action: 'move',
			...options
		}
		return await this.api.post({ params, csrf: true })
	}
	
	async purge(title: string): Promise<void>
	async purge(title: string[]): Promise<void>
	async purge(title: string | string[]) {
		if (typeof title === 'string') {
			await this.purgeAction(title)
			return
		}
		const chunks = chunkify(title, 50)
		for (const chunk of chunks) {
			await this.purgeAction(chunk.join('|'))
			sleep(2000)
		}
	}

	async read(title: string) {
		const params = {
			action: 'query',
			prop: 'revisions',
			titles: title,
			rvslots: '*',
			rvprop: 'content'
		}
		// TODO: check if page exists before-hand
		try {
			const req = await this.api.get(params)
			const page: any = Object.values(req.query.pages)[0]
			const content = page.revisions[0].slots.main['*']
			return content
		} catch {
			return ''
		}
	}

	async upload({ filename, file }: { filename: string, file: Buffer }) {
		const form = new FormData()
		form.append('filename', filename)
		form.append('file', file, filename)
		const params = {
			action: 'upload',
			ignorewarnings: 1
		}
		const req = await this.api.post({ params, form, csrf: true })
		return req
	}

	// utilities
	private async purgeAction(titles: string) {
		const form = new FormData()
		form.append('titles', titles)
		const params = { action: 'purge' }
		const req = await this.api.post({ params, form })
		return req
	}
}

export default Client