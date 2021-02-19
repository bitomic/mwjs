import fetch from 'node-fetch'
import FormData from 'form-data'
import { LoginFailed } from '../errors'
import querystring from 'querystring'

import { ILoginResponse, ITokensResponse } from '../typings'

export interface IAPIOptions {
	api: string
	username: string
	password: string
}

class API {
	readonly api: string
	readonly username: string
	readonly password: string
	private cookies: string
	private csrf?: string

	constructor({ api, username, password }: IAPIOptions) {
		this.api = api
		this.username = username
		this.password = password
		this.cookies = ''
	}

	async login() {
		const tokenreq = await fetch(`${this.api}?action=query&meta=tokens&format=json&type=login`)
		const tokenres: ITokensResponse = await tokenreq.json()
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
		const res: ILoginResponse = await req.json()
		this.cookies = req.headers.get('set-cookie')!
		if (res.login.result !== 'Success') throw new LoginFailed()
		return res
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

	async post({ params, csrf }: { params: querystring.ParsedUrlQueryInput, csrf?: boolean }) {
		const form = new FormData()
		for (const prop in params) {
			if (params[prop] === undefined) continue
			let value = params[prop]
			if (value === true) value = '1'
			else if (value === false) value = '0'
			else if (typeof value === 'number') value = value.toString()
			form.append(prop, value)
		}
		form.append('format', 'json')
		form.append('assert', 'user')
		if (csrf) form.append('token', await this.getCSRFToken())
		const req = await fetch(`${this.api}`, {
			method: 'post',
			headers: {
				Cookie: this.cookies
			},
			body: form
		})
		return await req.json()
	}

	async postForm({ params, form, csrf }: { params?: querystring.ParsedUrlQueryInput, form?: FormData, csrf?: boolean }) {
		if (!params) params = {}
		if (!form) form = new FormData()
		params.format = 'json'
		const qs = querystring.encode(params)
		form.append('assert', 'user')
		if (csrf) form.append('token', await this.getCSRFToken())
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
		const req: ITokensResponse = await this.get({ action: 'query', meta: 'tokens', type: 'csrf' })
		this.csrf = req.query.tokens.csrftoken!
		return this.csrf
	}
}

export default API