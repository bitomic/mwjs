export interface IEditResponse {
	edit: {
		new?: ''
		result: string
		pageid: number
		title: string
		contentmodel: string
		oldrevid: number
		newrevid: number
		newtimestamp: string
	}
}