class LoginFailed extends Error {
	constructor() {
		super('The username and/or password might be wrong.')
	}
}

export default LoginFailed