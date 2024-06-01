import { Hono } from "hono"
import { HTTPException } from 'hono/http-exception'
import { sign } from 'hono/jwt'
import UserRoutes from "../RouteConstants"
import * as bcrypt from 'bcryptjs'
import UnregisteredUser from "../../data/models/bodyData/UnregisteredUser"
import redisClient from "../../data/redis"
import { createUser, queryUser } from "../../data/neo4j/users"
import { setCookie } from "hono/cookie"
import AuthResponse from "../../data/models/responseData/AuthResponse"

const app = new Hono()

app.post(UserRoutes.REGISTER, async (c) => {
    const { email, password, firstName, lastName } = await c.req.json<UnregisteredUser>()

    console.log(firstName, lastName)

    if (email && password) {
        const hashedPassword = await bcrypt.hash(password, 10)

        try {
            const result = await redisClient.setnx(email, hashedPassword)
            console.log('result', result)

            if (result === 1) {
                c.status(201)

                const node = await createUser({ email, password, firstName, lastName })

                return c.json({ message: 'User created' })
            } else {
                // this propagates to the catch
                throw new HTTPException(409, { message: 'User already exists' })
            }
        } catch (err: any) {
            c.status(err.status)
            return c.json({ message: err.message })
        }
    } else {
        c.status(400)
        return c.json({ message: 'Request is missing parameters' })
    }
})

app.get(UserRoutes.LOGIN, async (c) => {
    const { email, password } = c.req.query()

    if (email && password) {
        const hashedPassword = await redisClient.get(email)

        if (hashedPassword) {
            const result = await bcrypt.compare(password, hashedPassword)

            if (result) {
                const expiresIn = 60 * 60 * 24 * 30 // 30 days
                const token = await sign({email}, Bun.env.JWT_SECRET!, 'HS256')

                setCookie(c, token, token, { maxAge: expiresIn })

                const userNode: any = await queryUser(email).catch((err) => {
                    console.log(UserRoutes.LOGIN, 'err ->', err)
                    
                    throw new HTTPException(500, { message: 'Error querying user' })
                })

                c.status(200)
                return c.json<AuthResponse, 200>({
                    message: 'User logged in',
                    token,
                    user: {
                        id: userNode._fields[0].identity.low,
                        firstName: userNode._fields[0].properties.firstName,
                        lastName: userNode._fields[0].properties.lastName,
                        email: userNode._fields[0].properties.email
                    }
                })
            }
        } else {
            c.status(404)
            return c.json({ message: 'User not found' })
        }
    } else {
        c.status(400)
        return c.json({ message: 'Request is missing parameters' })
    }
})

export default app
