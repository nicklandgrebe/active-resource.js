describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '::Associations', ->
    describe '::HasOneAssociation', ->
      describe 'reading', ->
        beforeEach ->
          MyLibrary::GiftCard.includes('order').find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.GiftCard.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'returns the target', ->
          expect(@resource.order().isA?(MyLibrary::Order)).toBeTruthy()

        it 'appends / to relationship links', ->
          expect(@resource.association('order').links()['related']).toEqual('https://example.com/api/v1/gift_cards/1/order/')

      describe 'loading', ->
        beforeEach ->
          MyLibrary::GiftCard.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.GiftCard.find.success)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @resource.loadOrder()
          .done window.onSuccess
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.find.success)

        it 'queries the relationship URL', ->
          expect(jasmine.Ajax.requests.mostRecent().url).toEqual('https://example.com/api/v1/gift_cards/1/order/')

        it 'returns the target', ->
          @target = window.onSuccess.calls.mostRecent().args[0]
          expect(@target.isA?(MyLibrary::Order)).toBeTruthy()

      describe 'assigning', ->
        beforeEach ->
          MyLibrary::GiftCard.find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.GiftCard.find.success)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @target = MyLibrary::Order.build()

          @resource.assignOrder(@target)

        it 'assigns the target', ->
          expect(@resource.order()).toEqual(@target)

        it 'assigns the inverse target', ->
          expect(@resource.order().giftCard()).toEqual(@resource)

        it 'assigns the inverse\'s foreign key', ->
          expect(@resource.order().giftCardId).toEqual(@resource.id)

        describe 'when assigning wrong type', ->
          it 'throws an error', ->
            expect(=> @resource.assignOrder(MyLibrary::OrderItem.build())).toThrow()

        describe 'when foreignKey defined', ->
          beforeEach ->
            class MyLibrary::HasOneClass extends MyLibrary.Base
              @hasOne 'order', foreignKey: 'hasOneClassToken'

            @resource = MyLibrary::HasOneClass.build(id: 2)

            @target = MyLibrary::Order.build()

            @resource.assignOrder(@target)

          it 'assigns the inverse\'s foreign key', ->
            expect(@resource.order().hasOneClassToken).toEqual(2)

        describe 'when primaryKey defined', ->
          beforeEach ->
            class MyLibrary::HasOneClass extends MyLibrary.Base
              this.className = 'HasOneClass'

              @hasOne 'order', primaryKey: 'token'

            @resource = MyLibrary::HasOneClass.build(token: 'abc123')

            @target = MyLibrary::Order.build()

            @resource.assignOrder(@target)

          it 'assigns the inverse\'s foreign key', ->
            expect(@resource.order().hasOneClassId).toEqual('abc123')

        describe 'when target is polymorphic', ->
          beforeEach ->
            class MyLibrary::HasOneClass extends MyLibrary.Base
              this.className = 'HasOneClass'

              @hasOne 'belongsToPolymorphicClass', as: 'hasOneAlias'

            class MyLibrary::BelongsToPolymorphicClass extends MyLibrary.Base
              this.className = 'BelongsToPolymorphicClass'

              @belongsTo 'hasOneAlias', polymorphic: true

            @resource = MyLibrary::HasOneClass.build(id: 1)

            @target = MyLibrary::BelongsToPolymorphicClass.build()

            @resource.assignBelongsToPolymorphicClass(@target)

          it 'assigns the inverse\'s foreign key', ->
            expect(@resource.belongsToPolymorphicClass().hasOneAliasId).toEqual(1)

          it 'assigns the inverse\'s foreign type', ->
            expect(@resource.belongsToPolymorphicClass().hasOneAliasType).toEqual('HasOneClass')

        # TODO: Make `foreignType` option work with specs

      describe 'updating', ->
        beforeEach ->
          MyLibrary::GiftCard.includes('order').find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.GiftCard.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.calls.mostRecent().args[0]

        describe 'in general', ->
          beforeEach ->
            @target = MyLibrary::Order.build(id: 2)

            @resource.updateOrder(@target)

          it 'persists the update to the relationship URL', ->
            url = 'https://example.com/api/v1/gift_cards/1/relationships/order/'
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual(url)

          it 'makes a PATCH request', ->
            expect(jasmine.Ajax.requests.mostRecent().method).toEqual('PATCH')

        describe 'when assigning a resource', ->
          beforeEach ->
            @target = MyLibrary::Order.build(id: 2)

            @resource.updateOrder(@target)

          it 'sends a resource identifier document', ->
            resourceDocument =
              {
                data: {
                  id: '2',
                  type: 'orders'
                }
              }

            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          describe 'when update succeeds', ->
            beforeEach ->
              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

            it 'assigns the target', ->
              expect(@resource.order()).toEqual(@target)

            it 'assigns the inverse target', ->
              expect(@resource.order().giftCard()).toEqual(@resource)

            it 'assigns the inverse\'s foreign key', ->
              expect(@resource.order().giftCardId).toEqual(@resource.id)

          describe 'when update fails', ->
            beforeEach ->
              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.failure)

            it 'does not assign the target', ->
              expect(@resource.order().id).toEqual('1')

            it 'does not assign the inverse target', ->
              expect(@target.giftCard()).toBeNull()

            it 'does not assign the inverse\'s foreign key', ->
              expect(@target.giftCardId).toBeUndefined()

        describe 'when assigning null', ->
          beforeEach ->
            @oldTarget = @resource.order()
            @resource.updateOrder(null)

          it 'sends a blank document', ->
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual({})

          describe 'when update succeeds', ->
            beforeEach ->
              jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.relationships.update.success)

            it 'assigns null', ->
              expect(@resource.order()).toBeNull()

            # TODO: Add inverse unassignment (Rails does this automagically since it reloads association
            # targets using nullified foreign keys, resulting in null inverse for old target)
            #it 'unassigns the inverse of the old target', ->
              #expect(@oldTarget.giftCard()).toBeNull()

            it 'assigns the inverse\'s foreign key', ->
              expect(@oldTarget.giftCardId).toBeNull()

      describe 'building', ->
        beforeEach ->
          MyLibrary::GiftCard.includes('order').find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.GiftCard.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.calls.mostRecent().args[0]
          @target = @resource.buildOrder(price: 10)

        it 'builds a resource of reflection klass type', ->
          expect(@target.klass()).toBe(MyLibrary::Order)

        it 'assigns the attributes to the target', ->
          expect(@target.price).toEqual(10)

        it 'assigns the inverse target', ->
          expect(@target.giftCard()).toBe(@resource)

        it 'adds a foreign key to the built target', ->
          expect(@target.giftCardId).toEqual(@resource.id)

        describe 'when className is specified', ->
          beforeEach ->
            class MyLibrary::MyClass extends MyLibrary.Base
              @hasOne 'randomClass', className: 'GiftCard'

            @resource = MyLibrary::MyClass.build()
            @target = @resource.buildRandomClass()

          it 'builds a resource of className type', ->
            expect(@target.klass()).toBe(MyLibrary::GiftCard)

      describe 'creating', ->
        beforeEach ->
          MyLibrary::GiftCard.includes('order').find(1)
          .done window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.GiftCard.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.calls.mostRecent().args[0]

        describe 'in general', ->
          beforeEach ->
            @resource.createOrder(price: 3, verificationCode: 'asd')
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.save.success)
            @target = window.onSuccess.calls.mostRecent().args[0]

          it 'makes a request to the target\'s root URL', ->
            expect(jasmine.Ajax.requests.mostRecent().url).toEqual('https://example.com/api/v1/orders/')

          it 'makes a POST request', ->
            expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST')

          it 'sends a resource document', ->
            resourceDocument =
              {
                data: {
                  type: 'orders'
                  attributes: {
                    gift_card_id: '1',
                    price: 3,
                    verification_code: 'asd'
                  },
                  relationships: {
                    gift_card: {
                      data: { id: '1', type: 'gift_cards' }
                    }
                  }
                }
              }
            expect(jasmine.Ajax.requests.mostRecent().data()).toEqual(resourceDocument)

          it 'builds a resource of reflection klass type', ->
            expect(@target.klass()).toBe(MyLibrary::Order)

          it 'assigns the attributes to the target', ->
            expect(@target.price).toEqual(3)

          it 'assigns the inverse target', ->
            expect(@target.giftCard()).toBe(@resource)

          it 'adds a foreign key to the built target', ->
            expect(@target.giftCardId).toEqual(@resource.id)

        describe 'when creation succeeds', ->
          beforeEach ->
            @resource.createOrder(price: 10, verificationCode: 'asd')
            .done window.onSuccess

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.save.success)
            @target = window.onSuccess.calls.mostRecent().args[0]

          it 'persists the target', ->
            expect(@target.persisted?()).toBeTruthy()

        describe 'when creation fails', ->
          beforeEach ->
            @resource.createOrder(price: 10)
            .fail window.onFailure

            jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)
            @target = window.onFailure.calls.mostRecent().args[0]

          it 'does not persist the target', ->
            expect(@target.persisted?()).toBeFalsy()

          it 'adds errors to the target', ->
            expect(@target.errors().empty?()).toBeFalsy()
