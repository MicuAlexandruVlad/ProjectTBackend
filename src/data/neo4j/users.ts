import { int } from "neo4j-driver";
import driver from ".";
import UnregisteredUser from "../models/bodyData/UnregisteredUser";
import User from "../models/bodyData/User";
import { getFromCache, saveToCache } from "../redis/cache";
import { getFollowersKey, getFollowingKey, getPostsKey } from "../redis/constants";
import { neo4jConstants } from "./Constants";

export const createUser = async (user: UnregisteredUser) => {
    const session = driver.session()
    
    const { email, password, firstName, lastName, username } = user

    const result = await session.run(`
        OPTIONAL MATCH (existingUser:${neo4jConstants.USER_ROLE} {username: $username})
        WITH existingUser
        WHERE existingUser IS NULL
        CREATE (u:${neo4jConstants.USER_ROLE} {
            email: $email,
            password: $password,
            firstName: $firstName,
            lastName: $lastName,
            username: $username
        })
        RETURN u
    `, {
        email, password, firstName, lastName, username
    })

    const node = result.records[0] ? result.records[0] : null

    console.log(result.records)

    session.close()

    return node
}

export const queryUser = async (email: string) => {
    const session = driver.session()

    const result = await session.run(`
        MATCH (u:User { email: $email })
        RETURN u
    `, {
        email
    })

    const userNode = result.records[0] ? result.records[0] as any : null
    
    if (!userNode) {
        return new Promise((_, reject) => {
            reject('User not found')
        })
    } else {
        const id = userNode._fields[0].identity.low
        const postsKey = getPostsKey(id)
        const followersKey = getFollowersKey(id)
        const followingKey = getFollowingKey(id)

        const [cachedPosts, cachedFollowers, cachedFollowing] = await Promise.all([
            getFromCache(postsKey),
            getFromCache(followersKey),
            getFromCache(followingKey)
        ])

        const missingStats = {
            posts: typeof cachedPosts !== 'string',
            followers: typeof cachedFollowers !== 'string',
            following: typeof cachedFollowing !== 'string'
        }

        if (!missingStats.posts && !missingStats.followers && !missingStats.following) {
            console.log('stats retrieved from cache')
            return {
                ...userNode,
                _fields: [{
                    ...userNode._fields[0],
                    properties: {
                        ...userNode._fields[0].properties,
                        posts: JSON.parse(cachedPosts!),
                        followers: JSON.parse(cachedFollowers!),
                        following: JSON.parse(cachedFollowing!)
                    }
                }]
            }
        }

        let query = `MATCH (u:${neo4jConstants.USER_ROLE}) WHERE ID(u) = $id `
        let returnClause = `RETURN `
        const conditions = []

        if (missingStats.posts) {
            query += `OPTIONAL MATCH (u)-[:${neo4jConstants.POSTED_RELATIONSHIP}]->(p:${neo4jConstants.POST_ROLE}) `
            conditions.push(`COUNT(DISTINCT p) AS postCount`)
        } else {
            conditions.push(`null AS postCount`)
        }

        if (missingStats.followers) {
            query += `OPTIONAL MATCH (u)<-[:${neo4jConstants.FOLLOWS_RELATIONSHIP}]-(follower:${neo4jConstants.USER_ROLE}) `
            conditions.push(`COUNT(DISTINCT follower) AS followerCount`)
        } else {
            conditions.push(`null AS followerCount`)
        }

        if (missingStats.following) {
            query += `OPTIONAL MATCH (u)-[:${neo4jConstants.FOLLOWS_RELATIONSHIP}]->(following:${neo4jConstants.USER_ROLE}) `
            conditions.push(`COUNT(DISTINCT following) AS followingCount`)
        } else {
            conditions.push(`null AS followingCount`)
        }

        query += returnClause + conditions.join(', ')

        try {
            const result = await session.run(query, { id })

            // Extract the results from the query
            let postCount = cachedPosts
            let followerCount = cachedFollowers
            let followingCount = cachedFollowing

            result.records.forEach(record => {
                if (record.has('postCount')) postCount = record.get('postCount').low
                if (record.has('followerCount')) followerCount = record.get('followerCount').low
                if (record.has('followingCount')) followingCount = record.get('followingCount').low
            })

            // Update the cache with the missing stats
            const cachePromises = []
            if (missingStats.posts) cachePromises.push(saveToCache(postsKey, postCount!))
            if (missingStats.followers) cachePromises.push(saveToCache(followersKey, followerCount!))
            if (missingStats.following) cachePromises.push(saveToCache(followingKey, followingCount!))
            await Promise.all(cachePromises)

            return {
                ...userNode,
                _fields: [{
                    ...userNode._fields[0],
                    properties: {
                        ...userNode._fields[0].properties,
                        posts: JSON.parse(postCount!),
                        followers: JSON.parse(followerCount!),
                        following: JSON.parse(followingCount!)
                    }
                }]
            }
        } finally {
            await session.close()
        }
    }
}

export const searchUser = async (
    query: string,
    offset: number = 0
) => {
    const session = driver.session()

    const result = await session.run(`
        MATCH (u:${neo4jConstants.USER_ROLE})
        WHERE toLower(u.firstName) CONTAINS toLower($query)
        OR toLower(u.lastName) CONTAINS toLower($query)
        OR toLower(u.username) CONTAINS toLower($query)
        RETURN {
            id: ID(u),
            firstName: u.firstName,
            lastName: u.lastName,
            username: u.username
        }
        SKIP toInteger($offset)
        LIMIT 20
    `, {
        query, offset: int(offset)
    })

    const users = result.records

    session.close()

    return users

}

export const updateUser = async (body: User) => {
    const {
        email, firstName, lastName, username
    } = body

    const session = driver.session()

    const result = await session.run(`
        MATCH (u:User { email: $email })
        SET u.firstName = $firstName, u.lastName = $lastName, u.username = $username
        RETURN u
    `, {
        email, firstName, lastName, username
    })

    const node = result.records[0]

    session.close()

    return node
}
