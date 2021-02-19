export interface ILoginParameters {

}

export interface ILoginFailedResponse {
	result: 'Failed'
	reason: string
}

export interface ILoginSuccessResponse {
	result: 'Success'
	lguserid: number
	lgusername: string
}

export interface ILoginNeedTokenResponse {
	result: 'NeedToken'
	token: string
}

export interface ILoginResponse {
	login: ILoginFailedResponse | ILoginSuccessResponse | ILoginNeedTokenResponse
}