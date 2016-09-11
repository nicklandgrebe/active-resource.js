describe 'ActiveResource', ->
  beforeEach ->
    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  describe 'Interfaces::JsonApi', ->
    describe '#get()', ->
      describe 'getting resources', ->
        beforeEach ->
          ActiveResource::Interfaces::JsonApi
          .get(MyLibrary::Product.links()['related'])
          .done window.onSuccess
          .fail window.onFailure

        describe 'on success', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
            expect(window.onSuccess).toHaveBeenCalled()
            @collection = window.onSuccess.calls.mostRecent().args[0]

          it 'returns a collection', ->
            expect(@collection.isA?(ActiveResource::Collection)).toBeTruthy()

          it 'returns a collection of resources of the queried type', ->
            @collection.each (resource) =>
              expect(resource.isA?(MyLibrary::Product)).toBeTruthy()

          it 'returns a collection of resources with links', ->
            @collection.each (resource) =>
              expect(resource.links()['self']).toBeDefined()

      describe 'getting a resource', ->
        beforeEach ->
          ActiveResource::Interfaces::JsonApi
          .get(MyLibrary::Product.links()['related'] + '1')
          .done window.onSuccess
          .fail window.onFailure

        describe 'on success', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
            expect(window.onSuccess).toHaveBeenCalled()
            @resource = window.onSuccess.calls.mostRecent().args[0]

          it 'returns a resource of the queried type', ->
            expect(@resource.isA?(MyLibrary::Product)).toBeTruthy()

          it 'returns a resource with a link', ->
            expect(@resource.links()['self']).toBeDefined()

        describe 'on failure', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.failure)
            expect(window.onFailure).toHaveBeenCalled()

          it 'returns an error', ->
            error = window.onFailure.calls.mostRecent().args[0].responseJSON[0]
            expect(error.key).toBeDefined()

      describe 'using fields queryParam', ->
        beforeEach ->
          queryParams =
            fields:
              product: ['title','updatedAt'],
              orders: ['price','createdAt']

          ActiveResource::Interfaces::JsonApi
          .get(MyLibrary::Product.links()['related'], queryParams)
          .done window.onSuccess
          .fail window.onFailure

          @paramStr = decodeURIComponent(jasmine.Ajax.requests.mostRecent().url.split('?')[1])

        it 'builds a field set into the query URL', ->
          expect(@paramStr).toEqual('fields[product]=title,updated_at&fields[orders]=price,created_at')

      describe 'using include queryParam', ->
        beforeEach ->
          queryParams =
            include: ['merchant', 'attributeValues', { orders: 'transactions' }]

          ActiveResource::Interfaces::JsonApi
          .get(MyLibrary::Product.links()['related'], queryParams)
          .done window.onSuccess
          .fail window.onFailure

          @paramStr = decodeURIComponent(jasmine.Ajax.requests.mostRecent().url.split('?')[1])

        it 'builds an include tree into the query URL', ->
          expect(@paramStr).toEqual('include=merchant,attribute_values,orders.transactions')

      describe 'using sort queryParam', ->
        beforeEach ->
          queryParams =
            sort: { updatedAt: 'asc', createdAt: 'desc' }

          ActiveResource::Interfaces::JsonApi
          .get(MyLibrary::Product.links()['related'], queryParams)
          .done window.onSuccess
          .fail window.onFailure

          @paramStr = decodeURIComponent(jasmine.Ajax.requests.mostRecent().url.split('?')[1])

        it 'builds an include tree into the query URL', ->
          expect(@paramStr).toEqual('sort=updated_at,-created_at')

    describe '#post', ->
      describe 'persisting resource data', ->
        beforeEach ->
          @product = MyLibrary::Product.build(title: 'Another title')
          @product.orders().assign([MyLibrary::Order.build(id: 3)])

          ActiveResource::Interfaces::JsonApi
          .post(MyLibrary::Product.links()['related'], @product)
          .done window.onSuccess
          .fail window.onFailure

        it 'builds a resource document', ->
          resourceDocument =
            {
              data: {
                type: 'products',
                attributes: {
                  title: 'Another title'
                },
                relationships: {
                  orders: {
                    data: [
                      {
                        id: 3,
                        type: 'orders'
                      }
                    ]
                  }
                }
              }
            }
          expect(requestData(jasmine.Ajax.requests.mostRecent())).toEqual(resourceDocument)

        describe 'when persistence succeeds', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
            @resource = window.onSuccess.calls.mostRecent().args[0]

          it 'indicates the resource is persisted', ->
            expect(@resource.persisted?()).toBeTruthy()

          it 'updates the resource with attributes from the server', ->
            expect(@resource.description).toEqual('Another description')

        describe 'when persistence fails', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.failure)
            @resource = window.onFailure.calls.mostRecent().args[0]

          it 'adds errors the resource', ->
            expect(@resource.errors().empty?()).toBeFalsy()

      describe 'persisting changes involving resource identifiers', ->
        beforeEach ->
          @product = MyLibrary::Product.build(id: 1, title: 'A product title')
          @product2 = MyLibrary::Product.build(id: 2, title: 'Another title')

          ActiveResource::Interfaces::JsonApi
          .post(MyLibrary::Product.links()['related'], [@product, @product2], onlyResourceIdentifiers: true)
          .done window.onSuccess
          .fail window.onFailure

        it 'builds a resource identifier document', ->
          resourceDocument =
            {
              data: [
                {
                  id: 1,
                  type: 'products'
                },
                {
                  id: 2,
                  type: 'products'
                }
              ]
            }
          expect(requestData(jasmine.Ajax.requests.mostRecent())).toEqual(resourceDocument)

    describe '#delete', ->
      beforeEach ->
        MyLibrary::Product.last().then window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        @resource = window.onSuccess.calls.mostRecent().args[0]

      describe 'with resource data', ->
        beforeEach ->
          ActiveResource::Interfaces::JsonApi
          .delete(MyLibrary::Product.links()['self'], @resource)
          .done window.onSuccess
          .fail window.onFailure

        it 'builds a resource identifier document', ->
          resourceDocument =
            {
              data: {
                id: @resource.id,
                type: 'products'
              }
            }
          expect(requestData(jasmine.Ajax.requests.mostRecent())).toEqual(resourceDocument)

      describe 'without resource data', ->
        beforeEach ->
          ActiveResource::Interfaces::JsonApi
          .delete(MyLibrary::Product.links()['self'])
          .done window.onSuccess
          .fail window.onFailure

        it 'sends no data', ->
          expect(requestData(jasmine.Ajax.requests.mostRecent())).toEqual({})
