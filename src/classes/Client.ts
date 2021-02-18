import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import { LoginFailed } from '../errors'
import querystring from 'querystring'

interface IClientOptions {
	api: string
	username: string
	password: string
}

export default class {
	readonly api: string
	readonly username: string
	readonly password: string
	private cookies: string
	private csrf?: string

	constructor({ api, username, password }: IClientOptions) {
		this.api = api
		this.username = username
		this.password = password
		this.cookies = ''
	}

	async login() {
		const tokenreq = await fetch(`${this.api}?action=query&meta=tokens&format=json&type=login`)
		const tokenres = await tokenreq.json()
		this.cookies = tokenreq.headers.get('set-cookie')!
		const logintoken = tokenres.query.tokens.logintoken

		const loginData = new FormData()
		loginData.append('lgname', this.username)
		loginData.append('lgpassword', this.password)
		loginData.append('lgtoken', logintoken)

		const req = await fetch(`${this.api}?action=login&format=json`, {
			method: 'post',
			body: loginData,
			headers: {
				Cookie: this.cookies
			}
		})
		const res = await req.json()
		this.cookies = req.headers.get('set-cookie')!
		console.log(this.cookies)
		if (res.login.result !== 'Success') throw new LoginFailed()
	}

	async get(params: querystring.ParsedUrlQueryInput) {
		params.format = 'json'
		const qs = querystring.encode(params)
		const req = await fetch(`${this.api}?${qs}`, {
			headers: {
				Cookie: this.cookies
			}
		})
		return await req.json()
	}

	async post({ params, form }: { params?: querystring.ParsedUrlQueryInput, form: FormData }) {
		if (!params) params = {}
		params.format = 'json'
		const qs = querystring.encode(params)
		const req = await fetch(`${this.api}?${qs}`, {
			method: 'post',
			headers: {
				Cookie: this.cookies
			},
			body: form
		})
		return await req.json()
	}

	async getCSRFToken(force = false) {
		if (!force && this.csrf) return this.csrf
		const req = await this.get({ action: 'query', meta: 'tokens', type: 'csrf' })
		this.csrf = req.query.tokens.csrftoken
		return this.csrf
	}

	async delete({ title, reason }: { title: string, reason?: string }) {
		const form = new FormData()
		form.append('title', title)
		if (reason) form.append('reason', reason)
		const token = await this.getCSRFToken()
		form.append('token', token)
		const params = { action: 'delete' }
		return await this.post({ params, form })
	}

	async upload({ filename, file }: { filename: string, file: Buffer }) {
		const form = new FormData()
		const token = await this.getCSRFToken()
		form.append('token', token)
		form.append('filename', filename)
		form.append('file', file, filename)
		const params = {
			action: 'upload',
			ignorewarnings: 1
		}
		const req = await this.post({ params, form })
		return req
	}
}