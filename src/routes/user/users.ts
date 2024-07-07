import { Hono } from "hono"
import { HTTPException } from 'hono/http-exception'
import { sign } from 'hono/jwt'
import UserRoutes from "../RouteConstants"
import * as bcrypt from 'bcryptjs'
import UnregisteredUser from "../../data/models/bodyData/UnregisteredUser"
import redisClient from "../../data/redis"
import { createUser, queryUser, searchUser, updateUser } from "../../data/neo4j/users"
import { setCookie } from "hono/cookie"
import AuthResponse from "../../data/models/responseData/AuthResponse"
import { useProtectedRoute } from "../protectedRoute"
import User from "../../data/models/bodyData/User"

const app = new Hono()

app.post(UserRoutes.REGISTER, async (c) => {
    const unregisteredUser = await c.req.json<UnregisteredUser>()

    if (unregisteredUser.email && unregisteredUser.password) {
        const hashedPassword = await bcrypt.hash(unregisteredUser.password, 10)
        try {
            const result = await redisClient.get(unregisteredUser.email)
            console.log('result', result)

            if (!result) {
                c.status(201)

                const node = await createUser(unregisteredUser)


                if (node == null) {
                    return c.json({ message: 'Username already exists' })
                } else {
                    await redisClient.setnx(unregisteredUser.email, hashedPassword)
                }

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
                        email: userNode._fields[0].properties.email,
                        username: userNode._fields[0].properties.username,
                        followers: userNode._fields[0].properties.followers,
                        following: userNode._fields[0].properties.following,
                        posts: userNode._fields[0].properties.posts
                    }
                })
            } else {
                c.status(401)
                return c.json({ message: 'Invalid credentials' })
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

app.post(UserRoutes.UPDATE_PROFILE, (c, next) => useProtectedRoute(c, next), async (c) => {
    const user = await c.req.json<User>()
    const { id, email, firstName, lastName } = user

    if (firstName && lastName) {
        try {
            const userNode = await queryUser(email).catch((err) => {
                console.log(UserRoutes.UPDATE_PROFILE, 'err ->', err)
                
                throw new HTTPException(500, { message: 'Error querying user' })
            })

            if (userNode) {
                const result = await updateUser(user)

                c.status(200)
                return c.json({ message: 'User updated' })
            } else {
                throw new HTTPException(404, { message: 'User profile not found' })
            }

        } catch (err: any) {
            c.status(err.status)
            return c.json({ message: err.message })
        }
    }
})

app.get(UserRoutes.SEARCH, (c, next) => useProtectedRoute(c, next), async (c) => {
    const { query, offset } = c.req.query()

    if (query) {
        try {
            const res = await searchUser(query, typeof offset === 'string' ? parseInt(offset) : 0).catch(err => {
                console.log(UserRoutes.SEARCH, 'err ->', err)
                
                throw new HTTPException(500, { message: 'Error searching user' })
            })

            if (res.length === 0) {
                c.status(200)
                return c.json({ message: 'No users found', users: [] })
            } else {
                const users = res.map((u: any) => {
                    return {
                        ...u._fields[0],
                        id: u._fields[0].id.low,
                    }
                
                })
                c.status(200)
                return c.json({ message: 'Users found', users })
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

app.get(UserRoutes.GET_USER, (c, next) => useProtectedRoute(c, next), async (c) => {
    const { userId } = c.req.query()

    if (userId) {
        try {
            const userNode = await queryUser(userId, true).catch((err) => {
                console.log(UserRoutes.GET_USER, 'err ->', err)
                
                throw new HTTPException(500, { message: 'Error querying user' })
            })

            if (userNode) {
                c.status(200)
                return c.json({
                    message: 'User found',
                    user: {
                        id: userNode._fields[0].identity.low,
                        firstName: userNode._fields[0].properties.firstName,
                        lastName: userNode._fields[0].properties.lastName,
                        email: userNode._fields[0].properties.email,
                        username: userNode._fields[0].properties.username,
                        followers: userNode._fields[0].properties.followers,
                        following: userNode._fields[0].properties.following,
                        posts: userNode._fields[0].properties.posts
                    }
                })
            } else {
                throw new HTTPException(404, { message: 'User not found' })
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

