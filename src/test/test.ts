import {assert} from 'chai';
import * as graphql from 'graphql';

import {Manager, decorators} from '..';

@decorators.type()
class TestUserType {
  @decorators.field('JSON')
  data: Object;

  @decorators.field({list: TestUserType})
  friends: TestUserType[];

  @decorators.field('ID')
  id: string;

  @decorators.field()
  name: string;
}

@decorators.input()
class TestUserInput {
  @decorators.field('JSON')
  data: Object;

  @decorators.field({list: 'ID'})
  friends: number[];

  @decorators.field()
  name: string;
}

// @decorators.type({name: 'TestUserEntityType'})
// @decorators.input({name: 'TestUserEntityInput'})
@decorators.entity()
class TestUserEntity {
  @decorators.field('JSON')
  data: Object;

  @decorators.field({list: TestUserEntity})
  friends: TestUserEntity[];

  @decorators.field('ID')
  id: string;

  @decorators.field()
  name: string;
}

@decorators.input()
class FilterInput {
  @decorators.field()
  field: string;

  @decorators.field()
  operator: string;

  @decorators.field('JSON')
  value: any;
}

@decorators.input()
class OrderInput {
  @decorators.field()
  field: string;

  @decorators.field()
  order: string;
}

class TestUserController {
  @decorators.mutation({
    parameters: {
      user: {
        type: TestUserInput,
      },
    },
    returnType: TestUserType,
  })
  addUser() {
    return {id: '2'};
  }

  @decorators.mutation({
    parameters: {
      user: {
        type: TestUserEntity,
      },
    },
    returnType: TestUserEntity,
  })
  addUserEntity() {
    return {id: '2'};
  }

  // @decorators.query({
  //   parameters: {
  //     id: {
  //       type: 'ID',
  //     },
  //   },
  //   returnType: TestUserEntity,
  //   list: true,
  // })
  @decorators.query({
    parameters: {
      filter: {
        list: FilterInput,
      },
      order: {
        list: OrderInput,
      },
      limit: {
        type: 'Int',
      },
      offset: {
        type: 'Int',
      },
    },
    returnType: TestUserEntity,
    list: true,
  })
  userEntities(parameters) {
    // console.log('parameters:', parameters);
    return [
      {
        id: '1',
        name: 'tenry',
        data: {
          location: 'Germany',
        },
        friends: [],
      },
    ];
  }

  @decorators.query({
    parameters: {
      id: {
        type: 'ID',
      },
    },
    returnType: TestUserType,
    list: true,
  })
  users() {
    return [
      {
        id: '1',
        name: 'tenry',
        data: {
          location: 'Germany',
        },
        friends: [],
      },
    ];
  }
}

describe('Manager', function() {
  describe('#createSchema()', function() {
    it('should return an instance of GraphQLSchema', function() {
      const schema = new Manager().createSchema();
      assert.instanceOf(schema, graphql.GraphQLSchema);
    });
  });

  describe('#registerObject()', function() {
    it('should add the controller to the schema', function() {
      const manager = new Manager();
      const controller = new TestUserController();
      manager.registerObject(controller);
      const schema = manager.createSchema();
      assert.instanceOf(schema, graphql.GraphQLSchema);
      // console.log(graphql.printSchema(schema));
    });
  });

  describe('graphql type, input', function() {
    const manager = new Manager();
    const controller = new TestUserController();
    manager.registerObject(controller);
    const schema = manager.createSchema();

    describe('query {users}', function() {
      it('should return the list of users', async function() {
        const response = await graphql.graphql(schema, 'query {users {id, name, data, friends {id, name, data}}}');
        // assert.isEmpty(response.errors);
        assert.deepEqual(response.data.users, controller.users());
      });
    });

    describe('mutation {addUser}', function() {
      it('should return the created user', async function() {
        const response = await graphql.graphql(schema, 'mutation {addUser(user: {name: "Max"}) {id}}');
        // assert.isEmpty(response.errors);
        assert.equal(response.data.addUser.id, '2');
      });
    });
  });

  describe('graphql type+input', function() {
    const manager = new Manager();
    const controller = new TestUserController();
    manager.registerObject(controller);
    const schema = manager.createSchema();

    describe('query {userEntities}', function() {
      it('should return the list of users', async function() {
        const response = await graphql.graphql(schema, 'query {userEntities {id, name, data, friends {id, name, data}}}');
        // assert.isEmpty(response.errors);
        assert.deepEqual(response.data.userEntities, controller.users());
      });
    });

    describe('mutation {addUserEntity}', function() {
      it('should return the created user', async function() {
        const response = await graphql.graphql(schema, 'mutation {addUserEntity(user: {name: "Max"}) {id}}');
        // assert.isEmpty(response.errors);
        assert.equal(response.data.addUserEntity.id, '2');
      });
    });
  });
});
