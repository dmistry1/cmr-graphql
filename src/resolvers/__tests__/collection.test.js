import nock from 'nock'

import { ApolloServer } from 'apollo-server-lambda'
import { createTestClient } from 'apollo-server-testing'

import resolvers from '..'
import typeDefs from '../../types'

import collectionSource from '../../datasources/collection'
import granuleSource from '../../datasources/granule'
import serviceSource from '../../datasources/service'
import variableSource from '../../datasources/variable'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    headers: {
      'CMR-Request-ID': 'abcd-1234-efgh-5678'
    }
  }),
  dataSources: () => ({
    collectionSource,
    granuleSource,
    serviceSource,
    variableSource
  })
})

describe('Collection', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }

    delete process.env.NODE_ENV

    process.env.cmrRootUrl = 'http://example.com'
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  describe('Query', () => {
    test('collections', async () => {
      const { query } = createTestClient(server)

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-ID': 'abcd-1234-efgh-5678'
        })
        .post(/collections\.json/, 'page_size=2')
        .reply(200, {
          feed: {
            entry: [{
              id: 'C100000-EDSC'
            }, {
              id: 'C100001-EDSC'
            }]
          }
        })

      const response = await query({
        variables: {},
        query: `{
          collections(first:2) {
            concept_id
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        collections: [{
          concept_id: 'C100000-EDSC'
        }, {
          concept_id: 'C100001-EDSC'
        }]
      })
    })

    test('collection', async () => {
      const { query } = createTestClient(server)

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-ID': 'abcd-1234-efgh-5678'
        })
        .post(/collections\.json/, 'concept_id=C100000-EDSC')
        .reply(200, {
          feed: {
            entry: [{
              id: 'C100000-EDSC'
            }]
          }
        })

      const response = await query({
        variables: {},
        query: `{
          collection(concept_id: "C100000-EDSC") {
            concept_id
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        collection: {
          concept_id: 'C100000-EDSC'
        }
      })
    })
  })

  describe('Collection', () => {
    test('granules', async () => {
      const { query } = createTestClient(server)

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-ID': 'abcd-1234-efgh-5678'
        })
        .post(/collections\.json/)
        .reply(200, {
          feed: {
            entry: [{
              id: 'C100000-EDSC'
            }, {
              id: 'C100001-EDSC'
            }]
          }
        })

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-ID': 'abcd-1234-efgh-5678'
        })
        .post(/granules\.json/, 'collection_concept_id=C100000-EDSC&page_size=20')
        .reply(200, {
          feed: {
            entry: [{
              id: 'G100000-EDSC'
            }, {
              id: 'G100001-EDSC'
            }]
          }
        })

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-ID': 'abcd-1234-efgh-5678'
        })
        .post(/granules\.json/, 'collection_concept_id=C100001-EDSC&page_size=20')
        .reply(200, {
          feed: {
            entry: [{
              id: 'G100002-EDSC'
            }, {
              id: 'G100003-EDSC'
            }]
          }
        })

      const response = await query({
        variables: {},
        query: `{
          collections {
            concept_id
            granules {
              concept_id
            }
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        collections: [{
          concept_id: 'C100000-EDSC',
          granules: [{
            concept_id: 'G100000-EDSC'
          }, {
            concept_id: 'G100001-EDSC'
          }]
        }, {
          concept_id: 'C100001-EDSC',
          granules: [{
            concept_id: 'G100002-EDSC'
          }, {
            concept_id: 'G100003-EDSC'
          }]
        }]
      })
    })

    describe('services', () => {
      describe('no associations are present in the metadata', () => {
        test('doesn\'t query for or return services', async () => {
          const { query } = createTestClient(server)

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/collections\.json/)
            .reply(200, {
              feed: {
                entry: [{
                  id: 'C100000-EDSC'
                }, {
                  id: 'C100001-EDSC'
                }]
              }
            })

          const response = await query({
            variables: {},
            query: `{
              collections {
                concept_id
                services {
                  concept_id
                }
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            collections: [{
              concept_id: 'C100000-EDSC',
              services: []
            }, {
              concept_id: 'C100001-EDSC',
              services: []
            }]
          })
        })
      })

      describe('association are present in the metadata but not service assocations', () => {
        test('doesn\'t query for or return services', async () => {
          const { query } = createTestClient(server)

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/collections\.json/)
            .reply(200, {
              feed: {
                entry: [{
                  id: 'C100000-EDSC',
                  associations: {
                    variables: ['V100000-EDSC']
                  }
                }, {
                  id: 'C100001-EDSC',
                  associations: {
                    variables: ['V100000-EDSC']
                  }
                }]
              }
            })

          const response = await query({
            variables: {},
            query: `{
              collections {
                concept_id
                services {
                  concept_id
                }
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            collections: [{
              concept_id: 'C100000-EDSC',
              services: []
            }, {
              concept_id: 'C100001-EDSC',
              services: []
            }]
          })
        })
      })

      describe('when service associations are present in the metadata', () => {
        test(' queries for and returns services', async () => {
          const { query } = createTestClient(server)

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/collections\.json/)
            .reply(200, {
              feed: {
                entry: [{
                  id: 'C100000-EDSC',
                  associations: {
                    services: ['S100000-EDSC', 'S100001-EDSC']
                  }
                }, {
                  id: 'C100001-EDSC',
                  associations: {
                    services: ['S100002-EDSC', 'S100003-EDSC']
                  }
                }]
              }
            })

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/services\.json/, 'concept_id%5B%5D=S100000-EDSC&concept_id%5B%5D=S100001-EDSC&page_size=2')
            .reply(200, {
              items: [{
                concept_id: 'S100000-EDSC'
              }, {
                concept_id: 'S100001-EDSC'
              }]
            })

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/services\.json/, 'concept_id%5B%5D=S100002-EDSC&concept_id%5B%5D=S100003-EDSC&page_size=2')
            .reply(200, {
              items: [{
                concept_id: 'S100002-EDSC'
              }, {
                concept_id: 'S100003-EDSC'
              }]
            })

          const response = await query({
            variables: {},
            query: `{
              collections {
                concept_id
                services {
                  concept_id
                }
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            collections: [{
              concept_id: 'C100000-EDSC',
              services: [{
                concept_id: 'S100000-EDSC'
              }, {
                concept_id: 'S100001-EDSC'
              }]
            }, {
              concept_id: 'C100001-EDSC',
              services: [{
                concept_id: 'S100002-EDSC'
              }, {
                concept_id: 'S100003-EDSC'
              }]
            }]
          })
        })
      })
    })

    describe('variables', () => {
      describe('no associations are present in the metadata', () => {
        test('doesn\'t query for or return variables', async () => {
          const { query } = createTestClient(server)

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/collections\.json/)
            .reply(200, {
              feed: {
                entry: [{
                  id: 'C100000-EDSC'
                }, {
                  id: 'C100001-EDSC'
                }]
              }
            })

          const response = await query({
            variables: {},
            query: `{
              collections {
                concept_id
                variables {
                  concept_id
                }
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            collections: [{
              concept_id: 'C100000-EDSC',
              variables: []
            }, {
              concept_id: 'C100001-EDSC',
              variables: []
            }]
          })
        })
      })

      describe('association are present in the metadata but not variable assocations', () => {
        test('doesn\'t query for or return variables', async () => {
          const { query } = createTestClient(server)

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/collections\.json/)
            .reply(200, {
              feed: {
                entry: [{
                  id: 'C100000-EDSC',
                  associations: {
                    services: ['S100000-EDSC']
                  }
                }, {
                  id: 'C100001-EDSC',
                  associations: {
                    services: ['S100000-EDSC']
                  }
                }]
              }
            })

          const response = await query({
            variables: {},
            query: `{
              collections {
                concept_id
                variables {
                  concept_id
                }
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            collections: [{
              concept_id: 'C100000-EDSC',
              variables: []
            }, {
              concept_id: 'C100001-EDSC',
              variables: []
            }]
          })
        })
      })

      describe('when service associations are present in the metadata', () => {
        test(' queries for and returns variables', async () => {
          const { query } = createTestClient(server)

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/collections\.json/)
            .reply(200, {
              feed: {
                entry: [{
                  id: 'C100000-EDSC',
                  associations: {
                    variables: ['V100000-EDSC', 'V100001-EDSC']
                  }
                }, {
                  id: 'C100001-EDSC',
                  associations: {
                    variables: ['V100002-EDSC', 'V100003-EDSC']
                  }
                }]
              }
            })

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/variables\.json/, 'concept_id%5B%5D=V100000-EDSC&concept_id%5B%5D=V100001-EDSC&page_size=2')
            .reply(200, {
              items: [{
                concept_id: 'V100000-EDSC'
              }, {
                concept_id: 'V100001-EDSC'
              }]
            })

          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-ID': 'abcd-1234-efgh-5678'
            })
            .post(/variables\.json/, 'concept_id%5B%5D=V100002-EDSC&concept_id%5B%5D=V100003-EDSC&page_size=2')
            .reply(200, {
              items: [{
                concept_id: 'V100002-EDSC'
              }, {
                concept_id: 'V100003-EDSC'
              }]
            })

          const response = await query({
            variables: {},
            query: `{
              collections {
                concept_id
                variables {
                  concept_id
                }
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            collections: [{
              concept_id: 'C100000-EDSC',
              variables: [{
                concept_id: 'V100000-EDSC'
              }, {
                concept_id: 'V100001-EDSC'
              }]
            }, {
              concept_id: 'C100001-EDSC',
              variables: [{
                concept_id: 'V100002-EDSC'
              }, {
                concept_id: 'V100003-EDSC'
              }]
            }]
          })
        })
      })
    })
  })
})
