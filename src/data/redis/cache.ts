import redisClient from "."
import { getFollowersKey, getFollowingKey, getPostsKey } from "./constants"

// save data to cache for 24 hours
export const saveToCache = async (key: string, value: string) => {
    return new Promise<void>((resolve, reject) => {
        redisClient.setex(key, 86400, value, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export const getFromCache = async (key: string) => {
    return new Promise<string | null | undefined>((resolve, reject) => {
        redisClient.get(key, (err, value) => {
            if (err) {
                reject(err)
            } else {
                resolve(value)
            }
        })
    })
}

export const incrementCacheValue = async (key: string) => {
    return new Promise<void>((resolve, reject) => {
        redisClient.incr(key, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export const decrementCacheValue = async (key: string) => {
    return new Promise<void>((resolve, reject) => {
        redisClient.decr(key, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}
