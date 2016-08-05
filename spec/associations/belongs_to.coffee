describe 'ActiveResource', ->
  describe '::Associations', ->
    describe '::BelongsToAssociation', ->
      describe 'reading', ->
        beforeEach ->
          MyLibrary::Order.includes('giftCard').find(1)
          .done window.onSuccess

          mostRecentAjaxRequest().response(JsonApiResponses.Order.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.mostRecentCall.args[0]

        it 'returns the target', ->
          expect(@resource.giftCard().isA?(MyLibrary::GiftCard)).toBeTruthy()

      describe 'loading', ->
        beforeEach ->
          MyLibrary::Order.find(1)
          .done window.onSuccess

          mostRecentAjaxRequest().response(JsonApiResponses.Order.find.success)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.mostRecentCall.args[0]

          @resource.loadGiftCard()
          .done window.onSuccess
          mostRecentAjaxRequest().response(JsonApiResponses.GiftCard.find.success)

        it 'queries the relationship URL', ->
          expect(mostRecentAjaxRequest().url).toEqual('https://example.com/api/v1/orders/1/gift_card/')

        it 'returns the target', ->
          @target = window.onSuccess.mostRecentCall.args[0]
          expect(@target.isA?(MyLibrary::GiftCard)).toBeTruthy()

      describe 'assigning', ->
        beforeEach ->
          MyLibrary::Order.find(1)
          .done window.onSuccess

          mostRecentAjaxRequest().response(JsonApiResponses.Order.find.success)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.mostRecentCall.args[0]

          @target = MyLibrary::GiftCard.build(id: 2)

          @resource.assignGiftCard(@target)

        it 'assigns the target', ->
          expect(@resource.giftCard()).toEqual(@target)

        it 'assigns the inverse target', ->
          expect(@resource.giftCard().order()).toEqual(@resource)

        it 'assigns the owner\'s foreign key', ->
          expect(@resource.giftCardId).toEqual(@target.id)

        describe 'when assigning wrong type', ->
          it 'throws an error', ->
            expect(=> @resource.assignGiftCard(MyLibrary::OrderItem.build())).toThrow()

        describe 'when foreignKey defined', ->
          beforeEach ->
            class MyLibrary::BelongsToClass extends ActiveResource::Base
              this.className = 'BelongsToClass'

              @belongsTo 'giftCard', foreignKey: 'giftCardToken'

            @resource = MyLibrary::BelongsToClass.build()

            @target = MyLibrary::GiftCard.build(id: 'abc123')

            @resource.assignGiftCard(@target)

          it 'assigns the owner\'s foreign key', ->
            expect(@resource.giftCardToken).toEqual('abc123')

        describe 'when primaryKey defined', ->
          beforeEach ->
            class MyLibrary::BelongsToClass extends ActiveResource::Base
              this.className = 'BelongsToClass'

              @belongsTo 'giftCard', primaryKey: 'token', foreignKey: 'giftCardToken'

            @resource = MyLibrary::BelongsToClass.build()

            @target = MyLibrary::GiftCard.build(token: 'abc123')

            @resource.assignGiftCard(@target)

          it 'assigns the owner\'s foreign key', ->
            expect(@resource.giftCardToken).toEqual('abc123')

        describe 'when polymorphic', ->
          beforeEach ->
            @resource = MyLibrary::Comment.build()

            @target = MyLibrary::Order.build(id: 1)

            @resource.assignResource(@target)

          it 'assigns the owner\'s foreign key', ->
            expect(@resource.resourceId).toEqual(1)

          it 'assigns the owner\'s foreign type', ->
            expect(@resource.resourceType).toEqual('Order')

      describe 'updating', ->
        beforeEach ->
          MyLibrary::Order.includes('giftCard').find(1)
          .done window.onSuccess

          mostRecentAjaxRequest().response(JsonApiResponses.Order.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.mostRecentCall.args[0]

        describe 'in general', ->
          beforeEach ->
            @target = MyLibrary::GiftCard.build(id: 2)

            @resource.updateGiftCard(@target)

          it 'persists the update to the relationship URL', ->
            url = 'https://example.com/api/v1/orders/1/relationships/gift_card/'
            expect(mostRecentAjaxRequest().url).toEqual(url)

          it 'makes a PATCH request', ->
            expect(mostRecentAjaxRequest().method).toEqual('PATCH')

        describe 'when assigning a resource', ->
          beforeEach ->
            @target = MyLibrary::GiftCard.build(id: 2)

            @resource.updateGiftCard(@target)

          it 'sends a resource identifier document', ->
            resourceDocument =
              {
                data: {
                  id: 2,
                  type: 'gift_cards'
                }
              }

            expect(requestData(mostRecentAjaxRequest())).toEqual(resourceDocument)

          describe 'when update succeeds', ->
            beforeEach ->
              mostRecentAjaxRequest().response(JsonApiResponses.relationships.update.success)

            it 'assigns the target', ->
              expect(@resource.giftCard()).toEqual(@target)

            it 'assigns the inverse target', ->
              expect(@resource.giftCard().order()).toEqual(@resource)

            it 'assigns the owner\'s foreign key', ->
              expect(@resource.giftCardId).toEqual(@target.id)

          describe 'when update fails', ->
            beforeEach ->
              mostRecentAjaxRequest().response(JsonApiResponses.relationships.update.failure)

            it 'does not assign the target', ->
              expect(@resource.giftCard()).not.toBe(@target)

            it 'does not assign the inverse target', ->
              expect(@target.order()).toBeNull()

            it 'does not assign the owner\'s foreign key', ->
              expect(@resource.giftCardId).toEqual(1)

        describe 'when assigning null', ->
          beforeEach ->
            @oldTarget = @resource.giftCard()
            @resource.updateGiftCard(null)

          it 'sends a blank document', ->
            expect(requestData(mostRecentAjaxRequest())).toEqual({})

          describe 'when update succeeds', ->
            beforeEach ->
              mostRecentAjaxRequest().response(JsonApiResponses.relationships.update.success)

            it 'assigns null', ->
              expect(@resource.giftCard()).toBeNull()

            # TODO: Add inverse unassignment (Rails does this automagically since it reloads association
            # targets using nullified foreign keys, resulting in null inverse for old target)
            #it 'unassigns the inverse of the old target', ->
              #expect(@oldTarget.order()).toBeNull()

            it 'assigns the owner\'s foreign key', ->
              expect(@resource.giftCardId).toBeNull()

      describe 'building', ->
        beforeEach ->
          MyLibrary::Order.includes('giftCard').find(1)
          .done window.onSuccess

          mostRecentAjaxRequest().response(JsonApiResponses.Order.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.mostRecentCall.args[0]
          @target = @resource.buildGiftCard(value: 5)

        it 'builds a resource of reflection klass type', ->
          expect(@target.klass()).toBe(MyLibrary::GiftCard)

        it 'assigns the attributes to the target', ->
          expect(@target.value).toEqual(5)

        it 'assigns the inverse target', ->
          expect(@target.order()).toBe(@resource)

        describe 'when className is specified', ->
          beforeEach ->
            class MyLibrary::MyClass extends ActiveResource::Base
              @belongsTo 'randomClass', className: 'GiftCard'

            @resource = MyLibrary::MyClass.build()
            @target = @resource.buildRandomClass(id: 1)

          it 'builds a resource of className type', ->
            expect(@target.klass()).toBe(MyLibrary::GiftCard)

          it 'builds the resource with foreign key of reflection name', ->
            expect(@resource.randomClassId).toEqual(1)

      describe 'creating', ->
        beforeEach ->
          MyLibrary::Order.includes('giftCard').find(1)
          .done window.onSuccess

          mostRecentAjaxRequest().response(JsonApiResponses.Order.find.includes)
          expect(window.onSuccess).toHaveBeenCalled()
          @resource = window.onSuccess.mostRecentCall.args[0]

        describe 'in general', ->
          beforeEach ->
            @resource.createGiftCard(initialValue: 10, value: 5)
            .done window.onSuccess

            mostRecentAjaxRequest().response(JsonApiResponses.GiftCard.save.success)
            @target = window.onSuccess.mostRecentCall.args[0]

          it 'makes a request to the target\'s root URL', ->
            expect(mostRecentAjaxRequest().url).toEqual('https://example.com/api/v1/gift_cards/')

          it 'makes a POST request', ->
            expect(mostRecentAjaxRequest().method).toEqual('POST')

          it 'sends a resource document', ->
            resourceDocument =
              {
                data: {
                  type: 'gift_cards'
                  attributes: {
                    initial_value: 10,
                    value: 5
                  },
                  relationships: {
                    order: {
                      data: { id: 1, type: 'orders' }
                    }
                  }
                }
              }
            expect(requestData(mostRecentAjaxRequest())).toEqual(resourceDocument)

          it 'builds a resource of reflection klass type', ->
            expect(@target.klass()).toBe(MyLibrary::GiftCard)

          it 'assigns the attributes to the target', ->
            expect(@target.value).toEqual(5)

          it 'assigns the inverse target', ->
            expect(@target.order()).toBe(@resource)

        describe 'when creation succeeds', ->
          beforeEach ->
            @resource.createGiftCard(initialValue: 10, value: 5)
            .done window.onSuccess

            mostRecentAjaxRequest().response(JsonApiResponses.GiftCard.save.success)
            @target = window.onSuccess.mostRecentCall.args[0]

          it 'persists the target', ->
            expect(@target.persisted?()).toBeTruthy()

        describe 'when creation fails', ->
          beforeEach ->
            @resource.createGiftCard(value: 5)
            .fail window.onFailure

            mostRecentAjaxRequest().response(JsonApiResponses.GiftCard.save.failure)
            @target = window.onFailure.mostRecentCall.args[0]

          it 'does not persist the target', ->
            expect(@target.persisted?()).toBeFalsy()

          it 'adds errors to the target', ->
            expect(@target.errors().empty?()).toBeFalsy()
