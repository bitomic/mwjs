export interface ITokensParameters {
	type: 'createaccount' | 'csrf' | 'deleteglobalaccount'
	| 'login' | 'patrol' | 'rollback'
	| 'setglobalaccountstatus' | 'userrights' | 'watch'
}

export interface ITokensResponse {
	query: {
		tokens: Partial<{
			createaccounttoken: string
			csrftoken: string
			logintoken: string
			patroltoken: string
			rollbacktoken: string
			userrightstoken: string
			watchtoken: string
		}>
	}
}
