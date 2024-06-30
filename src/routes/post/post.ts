import { Hono } from "hono";
import { PostRoutes } from "../RouteConstants";
import { useProtectedRoute } from "../protectedRoute";
import { UnuploadedPost } from "../../data/models/bodyData/Post";
import { createPost, getUserPosts } from "../../data/neo4j/posts";
import { incrementCacheValue } from "../../data/redis/cache";
import { getPostsKey } from "../../data/redis/constants";

const app = new Hono()

app.post(PostRoutes.CREATE, (c, next) => useProtectedRoute(c, next), async (c) => {
    const unuploadedPost = await c.req.json<UnuploadedPost>()

    const post = await createPost(unuploadedPost).catch(err => {
        console.log('Error creating post', err)

        return c.json({
            message: 'Error creating post'
        })
    
    })

    await incrementCacheValue(getPostsKey(unuploadedPost.userId)).catch(err => {
        console.log('Error incrementing cache value', err)

        return c.json({
            message: 'Error creating post'
        })
    })

    return c.json({
        message: 'Post created',
        post
    })
})

app.get(PostRoutes.GET_USER_POSTS, (c, next) => useProtectedRoute(c, next), async (c) => {
    const { userId } = c.req.query()

    const posts = await getUserPosts(parseInt(userId))

    return c.json({
        message: 'Posts retrieved',
        posts
    })
})

export default app
