describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

    MyLibrary::Order.last().then window.onSuccess

    jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
    @resource = window.onSuccess.calls.mostRecent().args[0]

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '::Fields', ->
    describe '.fields()', ->
      it 'returns fields', ->
        expect(@resource.klass().fields().toArray().sort()).toEqual([
          'price', 'comments', 'giftCard', 'orderItems', 'product', 'transactions'
        ].sort())

    describe 'updating changed fields', ->
      describe 'changing attribute', ->
        beforeEach ->
          @resource.price = 1000.0

        it 'adds attribute to resource document', ->
          @resource.save()

          resourceDocument =
            {
              data: {
                type: 'orders',
                id: '2',
                attributes: {
                  price: 1000.0
                },
                relationships: {}
              }
            }
          expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

      describe 'changing relationship', ->
        describe 'singular', ->
          beforeEach ->
            @resource.assignProduct(MyLibrary::Product.build(id: '10'))

          it 'adds relationship to resource document', ->
            @resource.save()

            resourceDocument =
              {
                data: {
                  type: 'orders',
                  id: '2',
                  attributes: {},
                  relationships: {
                    product: {
                      data: {
                        type: 'products',
                        id: '10'
                      }
                    }
                  }
                }
              }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

        describe 'collection', ->
          beforeEach ->
            @resource.orderItems().build(id: '5')
            @resource.orderItems().build(id: '10')
            @resource.save()
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.find.includes)

          it 'adds relationship to resource document', ->
            resourceDocument =
              {
                data: {
                  type: 'orders',
                  id: '2',
                  attributes: {},
                  relationships: {
                    order_items: {
                      data: [{
                        type: 'order_items',
                        id: '5'
                      },{
                        type: 'order_items',
                        id: '10'
                      }]
                    }
                  }
                }
              }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          describe 'when replacing an item (same length)', ->
            beforeEach ->
              @resource.orderItems().target().delete(@resource.orderItems().target().last())
              @resource.orderItems().build(id: '6')

            it 'replaces relationship to resource document', ->
              @resource.save()

              resourceDocument =
                {
                  data: {
                    type: 'orders',
                    id: '1',
                    attributes: {},
                    relationships: {
                      order_items: {
                        data: [{
                          type: 'order_items',
                          id: '5'
                        },{
                          type: 'order_items',
                          id: '6'
                        }]
                      }
                    }
                  }
                }
              expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

        describe 'autosave', ->
          beforeEach ->
            @resource.transactions().build(amount: 5.0)
            @resource.transactions().build(amount: 10.0)

          it 'adds relationship to resource document', ->
            @resource.save()

            resourceDocument =
              {
                data: {
                  type: 'orders',
                  id: '2',
                  attributes: {},
                  relationships: {
                    transactions: {
                      data: [{
                        type: 'transactions',
                        attributes: {
                          amount: 5.0
                        },
                        relationships: {}
                      },{
                        type: 'transactions',
                        attributes: {
                          amount: 10.0
                        },
                        relationships: {}
                      }]
                    }
                  }
                }
              }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)