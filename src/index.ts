import * as graphql from 'graphql';
import * as GraphQLJSON from 'graphql-type-json';

import * as decorators from './decorators';
import * as utils from './utils';

export {decorators, utils};

function createResolver(options: decorators.MutationOptions | decorators.QueryOptions, fn: Function) {
  const convertedType = utils.convertType(options.returnType);
  const returnType = options.list ? new graphql.GraphQLList(convertedType) : convertedType;

  return {
    type: returnType,
    args: utils.convertParameters(options.parameters),
    resolve: fn,
  };
}

export class Manager {
  private schemaDefinition = {
    query: {
      name: 'Query',
      fields: {},
    },
    mutation: {
      name: 'Mutation',
      fields: {},
    },
  };

  createSchema() {
    return new graphql.GraphQLSchema({
      query: this.getQuery(),
      mutation: this.getMutation(),
      types: [GraphQLJSON],
    });
  }

  registerFunction(fn: Function, name: string = fn.name) {
    if(Reflect.hasMetadata(decorators.querySymbol, fn)) {
      const options = <decorators.QueryOptions> Reflect.getMetadata(decorators.querySymbol, fn);
      this.addFunction('query', fn, name, options);
    }

    if(Reflect.hasMetadata(decorators.mutationSymbol, fn)) {
      const options = <decorators.MutationOptions> Reflect.getMetadata(decorators.mutationSymbol, fn);
      this.addFunction('mutation', fn, name, options);
    }
  }

  registerObject(object: Object) {
    for(const propertyKey of Object.getOwnPropertyNames(Object.getPrototypeOf(object))) {
      if(Reflect.hasMetadata(decorators.querySymbol, object, propertyKey)) {
        const options = <decorators.QueryOptions> Reflect.getMetadata(decorators.querySymbol, object, propertyKey);
        this.addObjectMethod('query', object, propertyKey, options);
      }

      if(Reflect.hasMetadata(decorators.mutationSymbol, object, propertyKey)) {
        const options = <decorators.MutationOptions> Reflect.getMetadata(decorators.mutationSymbol, object, propertyKey);
        this.addObjectMethod('mutation', object, propertyKey, options);
      }
    }
  }

  private addFunction(root: string, fn: Function, name: string, options: decorators.MutationOptions | decorators.QueryOptions) {
    this.schemaDefinition[root].fields[name] = createResolver(options, (_, parameters, context, info: graphql.GraphQLResolveInfo) =>
      fn(parameters, context, info),
    );
  }

  private addObjectMethod(root: string, object: Object, methodName: string, options: decorators.MutationOptions | decorators.QueryOptions) {
    this.schemaDefinition[root].fields[methodName] = createResolver(options, (_, parameters, context, info: graphql.GraphQLResolveInfo) =>
      object[methodName](parameters, context, info),
    );
  }

  private getMutation() {
    if(Object.getOwnPropertyNames(this.schemaDefinition.mutation.fields).length > 0) {
      return new graphql.GraphQLObjectType(this.schemaDefinition.mutation);
    }

    return undefined;
  }

  private getQuery() {
    if(Object.getOwnPropertyNames(this.schemaDefinition.query.fields).length > 0) {
      return new graphql.GraphQLObjectType(this.schemaDefinition.query);
    }

    return undefined;
  }
}
