import { mergeResolvers } from 'merge-graphql-schemas'

import collectionResolver from './collection'
import granuleResolver from './granule'
import serviceResolver from './service'
import toolResolver from './tool'
import variableResolver from './variable'

const resolvers = [
  collectionResolver,
  granuleResolver,
  serviceResolver,
  toolResolver,
  variableResolver
]

export default mergeResolvers(resolvers)
