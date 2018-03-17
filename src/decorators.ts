import 'reflect-metadata';

import * as graphql from 'graphql';

export type TypeConstructors = (typeof Boolean) | (typeof String) | (typeof Number);

export const querySymbol = Symbol('query');
export const mutationSymbol = Symbol('mutation');
export const typeSymbol = Symbol('type');
export const inputSymbol = Symbol('input');
export const fieldsSymbol = Symbol('fields');

export interface QueryOptions {
  list?: boolean;
  parameters?: ParameterOptions;
  returnType?: any;
}

export interface MutationOptions {
  list?: boolean;
  parameters?: ParameterOptions;
  returnType?: any;
}

export interface FieldOptions {
  list?: any;
  type?: any;
}

export interface ParameterOptions {
  [name: string]: ParameterOption;
}

export interface ParameterOption {
  list?: any;
  type?: any;
}

export interface TypeOptions {
  name?: string;
  type?: any;
}

export function query(options?: QueryOptions) {
  return Reflect.metadata(querySymbol, options);
}

export function mutation(options?: MutationOptions) {
  return Reflect.metadata(mutationSymbol, options);
}

export function type(options?: string | TypeOptions, isInput = false) {
  if(typeof options != 'object') {
    options = {
      type: options,
    };
  }

  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if(propertyKey) {
      const constructor = target.constructor;

      if(typeof options == 'object' && !(options instanceof graphql.GraphQLList) && !options.type) {
        options.type = Reflect.getMetadata('design:type', target, propertyKey);
      }

      if(!Reflect.hasMetadata(fieldsSymbol, constructor)) {
        Reflect.defineMetadata(fieldsSymbol, {}, constructor);
      }

      const fields = Reflect.getMetadata(fieldsSymbol, constructor);

      fields[propertyKey] = options;
    } else {
      Reflect.defineMetadata(isInput ? inputSymbol : typeSymbol, options, target);

      if(!Reflect.hasMetadata(fieldsSymbol, target)) {
        Reflect.defineMetadata(fieldsSymbol, {}, target);
      }
    }
  };
}

export function input(options?: string | TypeOptions) {
  return type(options, true);
}

export function entity() {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if(typeof target == 'function' && 'name' in target) {
      type({name: `${target.name}Type`})(target, propertyKey, descriptor);
      input({name: `${target.name}Input`})(target, propertyKey, descriptor);
    }
  };
}

export function field(options?: FieldOptions | TypeConstructors | string) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    if(!options) {
      const dataType = Reflect.getMetadata('design:returntype', target, propertyKey) ||
        Reflect.getMetadata('design:type', target, propertyKey)
      ;
      options = {type: dataType};
    } else if(typeof options == 'object' && !(options instanceof graphql.GraphQLScalarType) && !options.type) {
      options.type = Reflect.getMetadata('design:type', target, propertyKey);
    }

    if(!Reflect.hasMetadata(fieldsSymbol, constructor)) {
      Reflect.defineMetadata(fieldsSymbol, {}, constructor);
    }

    const fields = Reflect.getMetadata(fieldsSymbol, constructor);

    fields[propertyKey] = options;
  };
}
