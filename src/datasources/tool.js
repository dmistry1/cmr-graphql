import camelCaseKeys from 'camelcase-keys'

import { get } from 'lodash'

import { parseCmrTools } from '../utils/parseCmrTools'
import { queryCmrTools } from '../utils/queryCmrTools'
import { parseCmrError } from '../utils/parseCmrError'
import { parseRequestedFields } from '../utils/parseRequestedFields'

import toolKeyMap from '../utils/umm/toolKeyMap.json'

export default async (params, headers, parsedInfo) => {
  try {
    const result = {}

    let totalCount = 0

    const requestInfo = parseRequestedFields(parsedInfo, toolKeyMap, 'tool')
    const {
      ummKeys,
      isList
    } = requestInfo

    const cmrResponse = await queryCmrTools(params, headers, requestInfo)

    const [jsonResponse, ummResponse] = cmrResponse

    if (jsonResponse) {
      const { headers } = jsonResponse
      const { 'cmr-hits': cmrHits } = headers
      totalCount = cmrHits

      const tools = parseCmrTools(jsonResponse)

      tools.forEach((tool) => {
        // Alias concept_id for consistency in responses
        const { concept_id: id } = tool

        // There are no keys in the json endpoint that are not available
        // in the umm endpoint so variables should never make two requests
        // meaning that result will never be already set for a particular id
        result[id] = camelCaseKeys(tool)
      })
    }

    if (ummResponse) {
      // Pull out the key mappings so we can retrieve the values below
      const { ummKeyMappings } = toolKeyMap

      const { headers } = ummResponse
      const { 'cmr-hits': cmrHits } = headers
      totalCount = cmrHits

      const tools = parseCmrTools(ummResponse)

      tools.forEach((tool) => {
        const { meta } = tool
        const { 'concept-id': id } = meta

        // There are no keys in the json endpoint that are not available
        // in the umm endpoint so variables should never make two requests
        // meaning that result will never be already set for a particular id
        result[id] = {}

        // Loop through the requested umm keys
        ummKeys.forEach((ummKey) => {
          // Use lodash.get to retrieve a value from the umm response given they
          // path we've defined above
          const keyValue = get(tool, ummKeyMappings[ummKey])

          if (keyValue) {
            // Snake case the key requested and any children of that key
            Object.assign(result[id], camelCaseKeys({ [ummKey]: keyValue }, { deep: true }))
          }
        })
      })
    }

    if (isList) {
      return {
        count: totalCount,
        items: Object.values(result)
      }
    }
    return Object.values(result)
  } catch (error) {
    return parseCmrError(error)
  }
}
