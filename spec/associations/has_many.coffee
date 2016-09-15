describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '::Associations', ->
    describe '::HasManyAssociation', ->
      describe 'reading', ->
        beforeEach ->
          MyLibrary::Product.includes('orders').find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.includes)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'returns a CollectionProxy', ->
          expect(@resource.orders().klass()).toBe(ActiveResource::Associations::CollectionProxy)

        describe '#all(cached: true)', ->
          it 'returns a collection', ->
            expect(@resource.orders().all(cached: true).klass()).toBe(ActiveResource::Collection)

          it 'returns resources already loaded', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(2)

      describe 'loading', ->
        beforeEach ->
          MyLibrary::Product.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'uses relationship data URL', ->
          relationshipLinks = {
            self: 'https://example.com/api/v1/products/1/relationships/orders/',
            related: 'https://example.com/api/v1/products/1/orders/'
          }
          expect(@resource.orders().links()).toEqual(relationshipLinks)

        describe '#loadTarget()', ->
          beforeEach ->
            @resource.association('orders').loadTarget()
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @target = window.onSuccess.calls.mostRecent().args[0]

          it 'returns a collection', ->
            expect(@target.klass()).toBe(ActiveResource::Collection)

          it 'returns a collection of resources of reflection klass type', ->
            expect(@target.first().klass()).toBe(MyLibrary::Order)

          it 'caches the result on the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(@target.size())

        describe '#all()', ->
          beforeEach ->
            @resource.orders().all()
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @result = window.onSuccess.calls.mostRecent().args[0]

          it 'returns a collection', ->
            expect(@result.klass()).toBe(ActiveResource::Collection)

          it 'returns a collection of resources of reflection klass type', ->
            expect(@result.first().klass()).toBe(MyLibrary::Order)

          it 'does not assign the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(0)

        describe '#first()', ->
          beforeEach ->
            @resource.orders().first()
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @result = window.onSuccess.calls.mostRecent().args[0]

          it 'queries the first resource of the relationship data URL', ->
            expect(requestParams(jasmine.Ajax.requests.mostRecent())).toEqual('page[size]=1')

          it 'gets a resource of the relationship', ->
            expect(@result.klass()).toBe(MyLibrary::Order)

          it 'does not assign the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(0)

        describe '#last()', ->
          beforeEach ->
            @resource.orders().last()
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @result = window.onSuccess.calls.mostRecent().args[0]

          it 'queries the first resource of the relationship data URL', ->
            expect(requestParams(jasmine.Ajax.requests.mostRecent())).toEqual('page[number]=-1&page[size]=1')

          it 'gets a resource of the relationship', ->
            expect(@result.klass()).toBe(MyLibrary::Order)

          it 'does not assign the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(0)

        describe '#find()', ->
          beforeEach ->
            @resource.orders().find(1)
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.find.success)
            @result = window.onSuccess.calls.mostRecent().args[0]

          it 'queries a specific member of the relationship data URL', ->
            memberLink = 'https://example.com/api/v1/products/1/orders/1'
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual(memberLink)

          it 'gets a resource of the relationship', ->
            expect(@result.klass()).toBe(MyLibrary::Order)

          it 'does not assign the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(0)

        describe '#findBy()', ->
          beforeEach ->
            @resource.orders().findBy(token: 'abc123')
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @result = window.onSuccess.calls.mostRecent().args[0]

          it 'queries the first relationship resource with filters', ->
            expect(requestParams(jasmine.Ajax.requests.mostRecent())).toEqual('filter[token]=abc123&page[size]=1')

          it 'gets a resource of the relationship', ->
            expect(@result.klass()).toBe(MyLibrary::Order)

          it 'does not assign the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(0)

        describe 'when using a Relation extension method', ->
          it 'extends the association relation', ->
            expect(@resource.orders().where().klass()).toBe(ActiveResource::Associations::CollectionProxy)

          it 'adds query params to the relationship URL query', ->
            @resource.orders().where(price: 5).all()
            expect(requestParams(jasmine.Ajax.requests.mostRecent())).toEqual('filter[price]=5')

          describe '#select()', ->
            beforeEach ->
              @resource.orders().select('price','verificationCode').all()

            it 'uses the correct model name for shallow fields', ->
              expect(requestParams(jasmine.Ajax.requests.mostRecent())).toEqual('fields[orders]=price,verification_code')

          describe '#includes()', ->
            beforeEach ->
              @resource.orders().includes('orderItems').all()
              .done window.onSuccess

              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.includes)
              @result = window.onSuccess.calls.mostRecent().args[0]

            it 'associates included resources', ->
              expect(@result.first().orderItems().all(cached: true).size()).toEqual(1)
              expect(@result.last().orderItems().all(cached: true).size()).toEqual(1)

      describe 'assigning when owner is unpersisted', ->
        beforeEach ->
          @resource = MyLibrary::Product.build(id: 2)

          @target = [MyLibrary::Order.build(id: 1), MyLibrary::Order.build(id: 2)]
          @resource.orders().assign(@target)

        it 'replaces the target with the resource(s)', ->
          _.each @target, (t) =>
            expect(@resource.orders().all(cached: true).toArray()).toContain(t)

        it 'replaces the inverse target(s) of the resource(s)', ->
          _.each @target, (t) =>
            expect(t.product()).toBe(@resource)

        it 'replaces the resources(s) foreign key(s)', ->
          _.each @target, (t) =>
            expect(t.productId).toEqual(@resource.id)

        describe 'when assigning wrong type', ->
          it 'throws an error', ->
            expect(=> @resource.orders().assign(MyLibrary::OrderItem.build())).toThrow()

        describe 'when foreignKey defined', ->
          beforeEach ->
            class MyLibrary::HasManyClass extends ActiveResource::Base
              this.className = 'HasManyClass'

              @hasMany 'orders', foreignKey: 'hasManyClassToken'

            @resource = MyLibrary::HasManyClass.build(id: 2)

            @target = MyLibrary::Order.build()

            @resource.orders().assign(@target)

          it 'assigns the inverse\'s foreign key', ->
            expect(@target.hasManyClassToken).toEqual(2)

        describe 'when primaryKey defined', ->
          beforeEach ->
            class MyLibrary::HasManyClass extends ActiveResource::Base
              this.className = 'HasManyClass'

              @hasMany 'orders', primaryKey: 'token', foreignKey: 'hasManyClassToken'

            @resource = MyLibrary::HasManyClass.build(token: 'abc123')

            @target = MyLibrary::Order.build()

            @resource.orders().assign(@target)

          it 'assigns the inverse\'s foreign key', ->
            expect(@target.hasManyClassToken).toEqual('abc123')

        describe 'when target is polymorphic', ->
          beforeEach ->
            class MyLibrary::HasManyClass extends ActiveResource::Base
              this.className = 'HasManyClass'

              @hasMany 'belongsToPolymorphics', as: 'hasManyAlias'

            class MyLibrary::BelongsToPolymorphic extends ActiveResource::Base
              this.className = 'BelongsToPolymorphic'

              @belongsTo 'hasManyAlias', polymorphic: true

            @resource = MyLibrary::HasManyClass.build(id: 1)

            @target = MyLibrary::BelongsToPolymorphic.build()

            @resource.belongsToPolymorphics().assign(@target)

          it 'assigns the inverse\'s foreign key', ->
            expect(@target.hasManyAliasId).toEqual(1)

          it 'assigns the inverse\'s foreign type', ->
            expect(@target.hasManyAliasType).toEqual('HasManyClass')

        # TODO: Make `foreignType` option work with specs

      describe 'assigning when owner is persisted', ->
        beforeEach ->
          MyLibrary::Product.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        describe 'in general', ->
          beforeEach ->
            MyLibrary::Order.all()
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @target = window.onSuccess.calls.mostRecent().args[0]
            @resource.orders().assign(@target)

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

          it 'persists the update to the relationship URL', ->
            relationshipLink = 'https://example.com/api/v1/products/1/relationships/orders/'
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual(relationshipLink)

          it 'makes a PATCH request', ->
            expect(jasmine.Ajax.requests.mostRecent().method).toEqual('PATCH')

        describe 'when assigning collection of resources', ->
          beforeEach ->
            MyLibrary::Order.all()
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
            @target = window.onSuccess.calls.mostRecent().args[0]
            @resource.orders().assign(@target)

          it 'sends a resource identifier document', ->
            resourceDocument = {
              data: [
                {
                  id: 1,
                  type: 'orders',
                },
                {
                  id: 2,
                  type: 'orders',
                }
              ]
            }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          describe 'when update succeeds', ->
            beforeEach ->
              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

            it 'replaces the target with the resource(s)', ->
              @target.each (t) =>
                expect(@resource.orders().all(cached: true).toArray()).toContain(t)

            it 'replaces the inverse target(s) of the resource(s)', ->
              @target.each (t) =>
                expect(t.product()).toBe(@resource)

            it 'replaces the resources(s) foreign key(s)', ->
              @target.each (t) =>
                expect(t.productId).toEqual(@resource.id)

          describe 'when update fails', ->
            beforeEach ->
              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.failure)

            it 'does not replace the target with the resource(s)', ->
              @target.each (t) =>
                expect(@resource.orders().all(cached: true).toArray()).not.toContain(t)

            it 'does not replace the inverse target(s) of the resource(s)', ->
              @target.each (t) =>
                expect(t.product()).not.toBe(@resource)

            it 'does not replace the foreign key(s) of the resource(s)', ->
              @target.each (t) =>
                expect(t.productId).not.toEqual(@resource.id)

        describe 'when assigning empty collection', ->
          beforeEach ->
            @resource.orders().assign([])

          it 'sends an empty document', ->
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(data: [])

          describe 'when update succeeds', ->
            beforeEach ->
              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

            it 'replaces the target with an empty collection', ->
              expect(@resource.orders().all(cached: true).size()).toEqual(0)

      describe 'building', ->
        beforeEach ->
          MyLibrary::Product.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @target = @resource.orders().build([{ price: 1 }, { price: 2 }])

        it 'builds resource(s) of reflection klass type', ->
          _.each @target, (t) =>
            expect(t.klass()).toBe(MyLibrary::Order)

        it 'assigns attributes to the resource(s)', ->
          _.each @target, (t) =>
            expect([1, 2]).toContain(t.price)

        it 'assigns the inverse target(s)', ->
          _.each @target, (t) =>
            expect(t.product()).toBe(@resource)

        it 'assigns the target(s) foreign key(s)', ->
          _.each @target, (t) =>
            expect(t.productId).toEqual(@resource.id)

        it 'adds the resource to the target', ->
          _.each @target, (t) =>
            expect(@resource.orders().all(cached: true).toArray()).toContain(t)

      describe 'creating', ->
        beforeEach ->
          MyLibrary::Product.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        describe 'in general', ->
          beforeEach ->
            @resource.orders().create({ price: 3, verificationCode: 'abc123' }, window.onCompletion)

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.save.success)
            @target = window.onCompletion.calls.mostRecent().args[0]

          it 'makes a request to the target\'s root URL', ->
            targetURL = 'https://example.com/api/v1/orders/'
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual(targetURL)

          it 'makes a POST request', ->
            expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST')

          it 'sends a resource document', ->
            resourceDocument = {
              data: {
                type: 'orders',
                attributes: {
                  price: 3,
                  product_id: 1,
                  verification_code: 'abc123'
                },
                relationships: {
                  product: {
                    data: { id: 1, type: 'products' }
                  }
                }
              }
            }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          it 'builds resource(s) of reflection klass type', ->
            expect(@target.klass()).toBe(MyLibrary::Order)

          it 'assigns attributes to the resource(s)', ->
            expect(@target.price).toEqual(3)

          it 'assigns the inverse target(s)', ->
            expect(@target.product()).toBe(@resource)

          it 'assigns the resource(s) foreign key(s)', ->
            expect(@target.productId).toEqual(@resource.id)

          it 'adds the resource(s) to the target', ->
            expect(@resource.orders().all(cached: true).toArray()).toContain(@target)

        describe 'when creation succeeds', ->
          beforeEach ->
            @resource.orders().create({ price: 3, verificationCode: 'abc123' }, window.onCompletion)

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.save.success)
            @target = window.onCompletion.calls.mostRecent().args[0]

          it 'persists the resource', ->
            expect(@target.persisted?()).toBeTruthy()

        describe 'when creation fails', ->
          beforeEach ->
            @resource.orders().create({ price: 3 }, window.onCompletion)

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)
            @target = window.onCompletion.calls.mostRecent().args[0]

          it 'does not persist the resource', ->
            expect(@target.persisted?()).toBeFalsy()

          it 'adds errors to the resource', ->
            expect(@target.errors().empty?()).toBeFalsy()

        describe 'when autosave association is present', ->
          beforeEach ->
            orderItems = [MyLibrary::OrderItem.build(title: 'My title')]
            @resource.orders().create({ price: 3, orderItems: orderItems }, window.onCompletion)

          it 'adds the association attributes to the resource document', ->
            resourceDocument = {
              data: {
                type: 'orders',
                attributes: {
                  price: 3,
                  product_id: 1
                },
                relationships: {
                  order_items: {
                    data: [
                      {
                        type: 'order_items',
                        attributes: {
                          title: 'My title'
                        }
                      }
                    ]
                  }
                  product: {
                    data: { id: 1, type: 'products' }
                  }
                }
              }
            }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          # TODO: Add ability to determine if autosave association is persisted upon
          # creation (#create does not allow for queryParams['include'])
          #describe 'when creation succeeds', ->
          #  it 'persists the autosave association', ->

        describe 'when owner is not persisted', ->
          it 'throws exception', ->
            resource = MyLibrary::Product.build()
            expect(-> resource.orders().create({ price: 5 })).toThrow()

      describe 'pushing', ->
        beforeEach ->
          MyLibrary::Product.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          MyLibrary::Order.all()
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
          @target = window.onSuccess.calls.mostRecent().args[0]

          @resource.orders().push(@target)

        describe 'in general', ->
          it 'makes a request to the target\'s relationship URL', ->
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual('https://example.com/api/v1/products/1/relationships/orders/')

          it 'makes a POST request', ->
            expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST')

          it 'sends a resource identifier document', ->
            resourceDocument = {
              data: [
                { id: 1, type: 'orders' },
                { id: 2, type: 'orders' }
              ]
            }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

        describe 'when pushing succeeds', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

          it 'assigns the inverse target(s) of the resource(s)', ->
            @target.each (t) =>
              expect(t.product()).toBe(@resource)

          it 'assigns the resource(s) foreign key(s)', ->
            @target.each (t) =>
              expect(t.productId).toEqual(@resource.id)

          it 'adds the resource(s) to the target', ->
            @target.each (t) =>
              expect(@resource.orders().all(cached: true).toArray()).toContain(t)

        describe 'when pushing fails', ->
          beforeEach ->
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.failure)

          it 'does not assign the inverse target(s) of the resource(s)', ->
            @target.each (t) =>
              expect(t.product()).not.toBe(@resource)

          it 'does not assign the resource(s) foreign key(s)', ->
            @target.each (t) =>
              expect(t.productId).not.toEqual(@resource.id)

          it 'does not add the resource(s) to the target', ->
            @target.each (t) =>
              expect(@resource.orders().all(cached: true).toArray()).not.toContain(t)

      describe 'deleting', ->
        beforeEach ->
          MyLibrary::Product.includes('orders').find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.includes)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @target = @resource.orders().all(cached: true)

        describe 'in general', ->
          beforeEach ->
            @resource.orders().delete(@target.first())

          it 'makes a request to the target\'s relationship URL', ->
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual('https://example.com/api/v1/products/1/relationships/orders/')

          it 'makes a DELETE request', ->
            expect(jasmine.Ajax.requests.mostRecent().method).toEqual('DELETE')

          it 'sends a resource identifier document', ->
            resourceDocument = {
              data: [
                { id: 1, type: 'orders' }
              ]
            }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

        describe 'when deleting succeeds', ->
          beforeEach ->
            @resource.orders().delete(@target.first())
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

          it 'removes the inverse target(s) of the resource(s)', ->
            expect(@target.first().product()).toBeNull()

          it 'removes the resource(s) foreign key(s)', ->
            expect(@target.first().productId).toBeNull()

          it 'removes the resource(s) from the target', ->
            expect(@resource.orders().all(cached: true).toArray()).not.toContain(@target.first())

        describe 'when deleting fails', ->
          beforeEach ->
            @resource.orders().delete(@target.first())
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.failure)

          it 'does not remove the inverse target(s) of the resource(s)', ->
            expect(@target.first().product()).toBe(@resource)

          it 'does not remove the resource(s) foreign key(s)', ->
            expect(@target.first().productId).toEqual(@resource.id)

          it 'does not remove the resource(s) from the target', ->
            expect(@resource.orders().all(cached: true).toArray()).toContain(@target.first())

        describe '#deleteAll()', ->
          beforeEach ->
            @resource.orders().deleteAll()
            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

          it 'sends a resource identifier document with all resources', ->
            resourceDocument = {
              data: [
                { id: 1, type: 'orders' },
                { id: 2, type: 'orders' }
              ]
            }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          it 'deletes all resources from the target', ->
            expect(@resource.orders().all(cached: true).size()).toEqual(0)

      describe '#empty()', ->
        describe 'when target is empty', ->
          beforeEach ->
            MyLibrary::Product.find(1)
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
            @resource = window.onSuccess.calls.mostRecent().args[0]

          it 'returns true', ->
            expect(@resource.orders().empty()).toBeTruthy()

        describe 'when target is not empty', ->
          beforeEach ->
            MyLibrary::Product.includes('orders').find(1)
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.includes)
            @resource = window.onSuccess.calls.mostRecent().args[0]

          it 'returns false', ->
            expect(@resource.orders().empty()).toBeFalsy()
