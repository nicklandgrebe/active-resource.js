describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    jasmine.Ajax.uninstall()

  describe 'Interfaces::JsonApi', ->
    beforeEach ->
      @lib = window.MyLibrary
      @interface = @lib.interface

    describe '#get()', ->
      describe 'getting resources', ->
        beforeEach ->
          @interface
          .get(@lib::Product.links()['related'])
          .done(window.onSuccess)
          .fail(window.onFailure)

        describe 'on success', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
            expect(window.onSuccess).toHaveBeenCalled()
            @collection = window.onSuccess.calls.mostRecent().args[0]

          it 'returns a collection', ->
            expect(@collection.isA?(ActiveResource::Collection)).toBeTruthy()

          it 'returns a collection of resources of the queried type', ->
            @collection.each (resource) =>
              expect(resource.isA?(@lib::Product)).toBeTruthy()

          it 'returns a collection of resources with links', ->
            @collection.each (resource) =>
              expect(resource.links()['self']).toBeDefined()

      describe 'getting a resource', ->
        beforeEach ->
          @interface
          .get(@lib::Product.links()['related'] + '1')
          .done(window.onSuccess)
          .fail(window.onFailure)

        describe 'on success', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
            expect(window.onSuccess).toHaveBeenCalled()
            @resource = window.onSuccess.calls.mostRecent().args[0]

          it 'returns a resource of the queried type', ->
            expect(@resource.isA?(@lib::Product)).toBeTruthy()

          it 'returns a resource with a link', ->
            expect(@resource.links()['self']).toBeDefined()

        describe 'on failure', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.failure)
            expect(window.onFailure).toHaveBeenCalled()

          it 'returns a collection of errors', ->
            expect(window.onFailure.calls.mostRecent().args[0].klass()).toBe(ActiveResource::Collection)

          it 'returns a parameter error', ->
            error = window.onFailure.calls.mostRecent().args[0].first()
            expect(error.parameter).toEqual('id')

      describe 'using fields queryParam', ->
        beforeEach ->
          queryParams =
            fields:
              product: ['title','updatedAt'],
              orders: ['price','createdAt']

          @interface
          .get(@lib::Product.links()['related'], queryParams)
          .done(window.onSuccess)
          .fail(window.onFailure)

          @paramStr = decodeURIComponent(jasmine.Ajax.requests.mostRecent().url.split('?')[1])

        it 'builds a field set into the query URL', ->
          expect(@paramStr).toEqual('fields[product]=title,updated_at&fields[orders]=price,created_at')

      describe 'using include queryParam', ->
        beforeEach ->
          queryParams =
            include: ['merchant', 'attributeValues', { orders: 'transactions' }]

          @interface
          .get(@lib::Product.links()['related'], queryParams)
          .done(window.onSuccess)
          .fail(window.onFailure)

          @paramStr = decodeURIComponent(jasmine.Ajax.requests.mostRecent().url.split('?')[1])

        it 'builds an include tree into the query URL', ->
          expect(@paramStr).toEqual('include=merchant,attribute_values,orders.transactions')

      describe 'using sort queryParam', ->
        beforeEach ->
          queryParams =
            sort: { updatedAt: 'asc', createdAt: 'desc' }

          @interface
          .get(@lib::Product.links()['related'], queryParams)
          .done(window.onSuccess)
          .fail(window.onFailure)

          @paramStr = decodeURIComponent(jasmine.Ajax.requests.mostRecent().url.split('?')[1])

        it 'builds an include tree into the query URL', ->
          expect(@paramStr).toEqual('sort=updated_at,-created_at')

    describe '#post', ->
      describe 'persisting resource data', ->
        beforeEach ->
          @order = @lib::Order.build(price: 1.0)
          @order.transactions().assign(
            [
              @lib::Transaction.build(
                amount: 1.0,
                paymentMethod: @lib::PaymentMethod.build(id: 100)
              )
            ]
          )

          @order.timestamp = new Date()

          @interface
          .post(@lib::Order.links()['related'], @order)
          .done(window.onSuccess)
          .fail(window.onFailure)

        it 'builds a resource document', ->
          resourceDocument =
            {
              data: {
                type: 'orders',
                attributes: {
                  price: 1.0,
                  timestamp: @order.timestamp.toJSON()
                },
                relationships: {
                  transactions: {
                    data: [
                      {
                        type: 'transactions',
                        attributes: {
                          amount: 1.0,
                          payment_method_id: 100
                        },
                        relationships: {
                          payment_method: {
                            data: { type: 'payment_methods', id: 100 }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

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

          it 'converts a pointer to a base error field', ->
            expect(@resource.errors().forBase()).toEqual({ invalid: "A problem occurred with the base of the product." })

          it 'converts a pointer to a attribute error field', ->
            expect(@resource.errors().forAttribute('title')).toEqual({ blank: 'Title cannot be blank.' })

          it 'camelizes an underscored attribute name', ->
            expect(@resource.errors().include('phoneNumber')).toBeTruthy()

          it 'converts a pointer to a relationship error field', ->
            expect(@resource.errors().forAttribute('orders.price')).toEqual({ blank: 'Price cannot be blank.' })

      describe 'persisting changes involving resource identifiers', ->
        beforeEach ->
          @product = @lib::Product.build(id: 1, title: 'A product title')
          @product2 = @lib::Product.build(id: 2, title: 'Another title')

          @interface
          .post(@lib::Product.links()['related'], [@product, @product2], onlyResourceIdentifiers: true)
          .done(window.onSuccess)
          .fail(window.onFailure)

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
          expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

    describe '#delete', ->
      beforeEach ->
        @lib::Product.last().then window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        @resource = window.onSuccess.calls.mostRecent().args[0]

      describe 'with resource data', ->
        beforeEach ->
          @interface
          .delete(@lib::Product.links()['self'], @resource)
          .done(window.onSuccess)
          .fail(window.onFailure)

        it 'builds a resource identifier document', ->
          resourceDocument =
            {
              data: {
                id: @resource.id,
                type: 'products'
              }
            }
          expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

      describe 'without resource data', ->
        beforeEach ->
          @interface
          .delete(@lib::Product.links()['self'])
          .done(window.onSuccess)
          .fail(window.onFailure)

        it 'sends no data', ->
          expect(jasmine.Ajax.requests.mostRecent().data()).toEqual({})
