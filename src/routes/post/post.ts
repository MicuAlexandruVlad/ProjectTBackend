import { Hono } from "hono";
import { PostRoutes } from "../RouteConstants";
import { useProtectedRoute } from "../protectedRoute";
import { UnuploadedPost } from "../../data/models/bodyData/Post";
import { createPost, getUserPosts } from "../../data/neo4j/posts";
import { incrementCacheValue } from "../../data/redis/cache";
import { getPostsKey } from "../../data/redis/constants";
import { HTTPException } from "hono/http-exception";

const app = new Hono()

app.post(PostRoutes.CREATE, (c, next) => useProtectedRoute(c, next), async (c) => {
    const unuploadedPost = await c.req.json<UnuploadedPost>()

    try {
        const post = await createPost(unuploadedPost).catch(err => {
            console.log('Error creating post', err)
    
            throw new HTTPException(500, { message: 'Error creating post' })
        
        })

        await incrementCacheValue(getPostsKey(unuploadedPost.userId)).catch(err => {
            console.log('Error incrementing cache value', err)

            throw new HTTPException(500, { message: 'Error creating post' })
        })

        if (post) {
            return c.json({
                message: 'Post created',
                post
            })
        } else {
            c.status(400)
            return c.json({ message: 'Post not created' })
        }
    } catch (err: any) {
        c.status(err.status)
        return c.json({ message: err.message })
    }
})

app.get(PostRoutes.GET_USER_POSTS, (c, next) => useProtectedRoute(c, next), async (c) => {
    const { userId } = c.req.query()

    try {
        const posts = await getUserPosts(parseInt(userId)).catch(err => {
            console.log('Error getting posts', err)

            throw new HTTPException(500, { message: 'Error getting posts' })
        })

        if (posts) {
            return c.json({
                message: 'Posts retrieved',
                posts
            })
        } else {
            c.status(400)
            return c.json({ message: 'No posts found' })
        }
    } catch (err: any) {
        c.status(err.status)
        return c.json({ message: err.message })
    }
})

export default app
