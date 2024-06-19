import driver from ".";
import UnregisteredUser from "../models/bodyData/UnregisteredUser";
import User from "../models/bodyData/User";

export const createUser = async (user: UnregisteredUser) => {
    const session = driver.session()
    
    const { email, password, firstName, lastName } = user

    const result = await session.run(`
        CREATE (u:User {
            email: $email,
            password: $password,
            firstName: $firstName,
            lastName: $lastName
        })
        RETURN u
    `, {
        email, password, firstName, lastName
    })

    const node = result.records[0]

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

    const node = result.records[0]

    session.close()

    return node
}

export const updateUser = async (body: User) => {
    const {
        email, firstName, lastName
    } = body

    const session = driver.session()

    const result = await session.run(`
        MATCH (u:User { email: $email })
        SET u.firstName = $firstName, u.lastName = $lastName
        RETURN u
    `, {
        email, firstName, lastName
    })

    const node = result.records[0]

    session.close()

    return node
}
