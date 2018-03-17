import 'reflect-metadata';

import * as graphql from 'graphql';
import * as GraphQLJSON from 'graphql-type-json';

import {
  ParameterOptions,
  TypeOptions,
  fieldsSymbol,
  inputSymbol,
  typeSymbol,
} from './decorators';

export enum Direction {
  Input,
  Output
}

export const classSymbol = Symbol('class');
export const graphqlInputSymbol = Symbol();
export const graphqlOutputSymbol = Symbol();

const knownTypes = new Map([
  ['ID', graphql.GraphQLID],
  ['String', graphql.GraphQLString],
  [String, graphql.GraphQLString],
  ['Float', graphql.GraphQLFloat],
  [Number, graphql.GraphQLFloat],
  ['Int', graphql.GraphQLInt],
  ['Boolean', graphql.GraphQLBoolean],
  [Boolean, graphql.GraphQLBoolean],
  ['JSON', GraphQLJSON],
  [GraphQLJSON, GraphQLJSON],
]);
const knownInputs = new Map(knownTypes);

function addTypeOrInput(type: any, convertedType: any, map: Map<any, any>) {
  if(typeof type == 'string' && !map.has(type)) {
    map.set(type, convertedType);
  }
  if(typeof type == 'function' && !map.has(type.name)) {
    map.set(type.name, convertedType);
  }
}

export function convertType(type: any, direction = Direction.Output) {
  if(typeof type == 'string' || typeof type == 'function') {
    if(direction == Direction.Input && knownInputs.has(type)) {
      return knownInputs.get(type);
    } else if(direction == Direction.Output && knownTypes.has(type)) {
      return knownTypes.get(type);
    }
  }

  const knownTypesOrInputs = direction == Direction.Input ? knownInputs : knownTypes;

  if(typeof type == 'function' || typeof type == 'object') {
    if(direction == Direction.Input && Reflect.hasMetadata(graphqlInputSymbol, type)) {
      return Reflect.getMetadata(graphqlInputSymbol, type);
    }

    if(direction == Direction.Output && Reflect.hasMetadata(graphqlOutputSymbol, type)) {
      return Reflect.getMetadata(graphqlOutputSymbol, type);
    }

    if(direction == Direction.Input && Reflect.hasMetadata(inputSymbol, type)) {
      const result = processTypeSymbol(type, true);

      addTypeOrInput(type, result, knownTypesOrInputs);

      return result;
    }

    if(direction == Direction.Output && Reflect.hasMetadata(typeSymbol, type)) {
      const result = processTypeSymbol(type, false);

      addTypeOrInput(type, result, knownTypesOrInputs);

      return result;
    }
  }

  if(type && typeof type == 'object') {
    const baseType = type.list || type.type;

    if(baseType) {
      let typeDefinition;

      if(direction == Direction.Input && knownInputs.has(baseType)) {
        typeDefinition = knownInputs.get(baseType);
      } else if(direction == Direction.Output && knownTypes.has(baseType)) {
        typeDefinition = knownTypes.get(baseType);
      } else {
        typeDefinition = convertType(baseType, direction);

        addTypeOrInput(baseType, typeDefinition, knownTypesOrInputs);
      }

      return type.list ? new graphql.GraphQLList(typeDefinition) : typeDefinition;
    }
  }

  throw new Error(`could not convert ${type}`);
}

export function convertParameters(parameters: ParameterOptions) {
  if(!parameters) {
    return undefined;
  }

  const output = <ParameterOptions> {};

  for(const [name, type] of Object.entries(parameters)) {
    output[name] = {type: convertType(type, Direction.Input)};
  }

  return output;
}

export function convertFields(object: Object, direction) {
  const declaredFields = Reflect.getMetadata(fieldsSymbol, object);

  const fields = {};

  for(const [name, declaredField] of Object.entries(declaredFields)) {
    fields[name] = {type: convertType(declaredField, direction)};
  }

  return fields;
}

function processTypeSymbol(type: any, input = false) {
  const options = <TypeOptions> Reflect.getMetadata(input ? inputSymbol : typeSymbol, type);

  // delayed fields resolve to allow recursive references
  const fields = () => convertFields(type, input ? Direction.Input : Direction.Output);
  let object;

  if(input) {
    object = new graphql.GraphQLInputObjectType({
      name: options.name || type.name,
      fields,
    });

    Reflect.defineMetadata(graphqlInputSymbol, object, type);
  } else {
    object = new graphql.GraphQLObjectType({
      name: options.name || type.name,
      fields,
    });

    Reflect.defineMetadata(graphqlOutputSymbol, object, type);
  }

  Reflect.defineMetadata(classSymbol, type, object);

  return object;
}
