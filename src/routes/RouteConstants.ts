
export default class UserRoutes {
    static readonly USER_BASE_ROUTE = '/user'
    static readonly REGISTER = '/register'
    static readonly LOGIN = '/login'
    static readonly LOGOUT = '/logout'
    static readonly COMPLETE_PROFILE = '/complete-profile'
    static readonly UPDATE_PROFILE = '/update-profile'
    static readonly SEARCH = '/search'
}

export class PostRoutes {
    static readonly POST_BASE_ROUTE = '/post'
    static readonly CREATE = '/create'
    static readonly GET_USER_POSTS = '/get-user-posts'
}

export class RedisRoutes {
    static readonly REDIS_BASE_ROUTE = '/redis'
    static readonly NUKE = '/nuke'
    static readonly GET_USER = '/get-user'
}
