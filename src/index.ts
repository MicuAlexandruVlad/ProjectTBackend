import { Hono } from 'hono'
import UserRoutes from './routes/RouteConstants'
import users from '../src/routes/user/users'
import redisClient from './data/redis'

const app = new Hono()

app.route(UserRoutes.USER_BASE_ROUTE, users)

export default app
