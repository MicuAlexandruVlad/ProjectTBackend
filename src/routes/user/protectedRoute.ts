import { Next } from "hono";
import { getCookie } from 'hono/cookie'

export const useProtectedRoute = (c: any, next: Next) => {
    const token = c.req.raw.headers.get('Authorization')?.split(' ')[1]

    if (!token) {
        c.status(401)
        return c.json({ message: 'Unauthorized' })
    
    } else {
        const tokenExists = getCookie(c, token)

        if (!tokenExists) {
            c.status(401)
            return c.json({ message: 'Unauthorized' })
        } else {
            return next()
        }
    }
}
