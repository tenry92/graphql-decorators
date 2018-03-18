# @tenry/graphql-decorators

This package provides useful TypeScript decorators for easy creation of GraphQL
types and inputs as well as controllers for reading and writing data.


## Example

~~~ts
// import the library
import {Manager, decorators} from '@tenry/graphql-decorators';

// define an output type
@decorators.type()
class UserType {
  @decorators.field('ID')
  id: string;

  // primitive types like string or number is automatically detected,
  // if the emitDecoratorMetadata flag is enabled
  @decorators.field()
  name: string;

  @decorators.field('JSON')
  data: Object;

  // use this syntax, if the data type is an array of something
  @decorators.field({list: UserType})
  friends: UserType[];
}

// define an input type
@decorators.input()
class UserInput {
  @decorators.field()
  name: string;

  @decorators.field('JSON')
  data: Object;

  @decorators.field({list: UserInput})
  friends: UserInput[];
}

// define a controller
class UserController {
  @decorators.query({
    parameters: {
      id: {
        type: String,
      },
    },
    returnType: UserEntity,
    list: true, // the returnType is returned as a list
  })
  users({id}) {
    if(id) {
      return [getUserById(id)];
    } else {
      return getAllUsers();
    }
  }

  @decorators.mutation({
    parameters: {
      user: {
        type: UserInput,
      },
    },
    returnType: UserType,
  })
  addUser({user}) {
    return createUser(user);
  }

  @decorators.mutation({
    parameters: {
      id: {
        type: String,
      },
      user: {
        type: UserInput,
      },
    },
    returnType: UserType,
  })
  updateUser({id, user}) {
    return updateUser(id, user);
  }

  @decorators.mutation({
    parameters: {
      id: {
        type: String,
      },
    },
    returnType: UserType,
  })
  removeUser({id}) {
    return removeUser(id);
  }
}

// now it's time to set everything up!
const manager = new Manager();
const userController = new UserController();

// register all available controllers
manager.registerObject(userController);

// get GraphQL schema
const schema = manager.createSchema();

// now do whatever you would do with a GraphQL schema
graphql(schema, someAwesomeGraphqlQuery).then(response => {
  console.log(response);
});

// or (using express and express-graphql):
const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
}));

app.listen(8080);
~~~

Using the example above, you can use GraphQL queries like the following:

~~~graphql
query {
  users {
    id
    name
    data
    friends {
      id
      name
      data
    }
  }
}
~~~

~~~graphql
mutation {
  addUser(user: {name: "Max"}) {
    id
  }
}
~~~


## Installation and Usage

Use `npm` to install the package:

~~~sh
$ npm install graphql graphql-type-json @tenry/graphql-decorators
~~~

Now *import* the `Manager` class and the `decorators`:

~~~ts
import {Manager, decorators} from '@tenry/graphql-decorators';

const manager = new Manager();

// define types, inputs and controllers here
// register controllers to the manager via manager.registerObject(new Controller()); here

// retrieve GraphQL schema
const schema = manager.createSchema();
~~~


## Decorators

### @type(options?: string | TypeOptions)

Use this decorator for a class to declare it as an output type.


#### TypeOptions

- **name:** alternative name for the type. By default, the class name is used.


### @input(options?: string | TypeOptions)

Use this decorator for a class to declare it as an input type.


#### TypeOptions

- **name:** alternative name for the type. By default, the class name is used.


### @entity()

Use this decorator for a class to declare it as both, an input and output type.


### @field(options?: string | PrimitiveConstructor | FieldOptions)

Use this decorator for a class property.
`options` can either be an existing type name (such as `'ID'`, `'Int'`, `'JSON'`),
a primitive type (`Boolean`, `String` or `Number`) or `FieldOptions`.


#### FieldOptions

- **list:** if the field type is a list of another type, use this option to define the base type.


### @query(options?: QueryOptions)

Use this decorator for a controller method to declare it as a query handler.


#### QueryOptions

- **parameters:** object, which defines the parameters.
- **returnType:** return type (see @field options for possible values)
- **list:** true, if `returnType` is returned as a list


### @mutation(options?: MutationOptions)

Use this decorator for a controller method to declare it as a mutation handler.


#### MutationOptions

- **parameters:** object, which defines the parameters.
- **returnType:** return type (see @field options for possible values)
- **list:** true, if `returnType` is returned as a list


## License

@tenry/graphql-decorators is licensed under the MIT License.
