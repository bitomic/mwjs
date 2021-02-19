export interface IPurgeResponse {
	purge: {
		ns: number
		title: string
		missint?: ''
		purged?: ''
	}[]
	normalized: {
		from: string
		to: string
	}[]
}