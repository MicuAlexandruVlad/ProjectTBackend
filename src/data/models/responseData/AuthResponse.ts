import User from "../bodyData/User"

export default interface AuthResponse {
    message: string
    token: string
    user: User
}
