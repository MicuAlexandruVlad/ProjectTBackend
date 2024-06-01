import User from "../User"

export default interface AuthResponse {
    message: string
    token: string
    user: User
}
