import neo4j from 'neo4j-driver'
import { neo4jConstants } from './Constants'

const driver = neo4j.driver(`${neo4jConstants.DRIVER}`, neo4j.auth.basic(neo4jConstants.USERNAME, neo4jConstants.PASSWORD))

export default driver
