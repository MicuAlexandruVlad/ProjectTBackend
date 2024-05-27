import { Hono } from "hono"
import { HTTPException } from 'hono/http-exception'
import { sign } from 'hono/jwt'
import UserRoutes from "../RouteConstants"
import * as bcrypt from 'bcryptjs'
import UnregisteredUser from "../../data/models/bodyData/UnregisteredUser"
import redisClient from "../../data/redis"
import { createUser } from "../../data/neo4j/users"

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

export default app
