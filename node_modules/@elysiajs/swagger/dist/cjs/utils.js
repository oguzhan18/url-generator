"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterPaths = exports.registerSchemaPath = exports.generateOperationId = exports.capitalize = exports.mapProperties = exports.toOpenAPIPath = void 0;
const typebox_1 = require("@sinclair/typebox");
const lodash_clonedeep_1 = __importDefault(require("lodash.clonedeep"));
const toOpenAPIPath = (path) => path
    .split('/')
    .map((x) => (x.startsWith(':') ? `{${x.slice(1, x.length)}}` : x))
    .join('/');
exports.toOpenAPIPath = toOpenAPIPath;
const mapProperties = (name, schema, models) => {
    if (schema === undefined)
        return [];
    if (typeof schema === 'string')
        if (schema in models)
            schema = models[schema];
        else
            throw new Error(`Can't find model ${schema}`);
    return Object.entries(schema?.properties ?? []).map(([key, value]) => {
        const { type: valueType = undefined, ...rest } = value;
        return {
            // @ts-ignore
            ...rest,
            schema: { type: valueType },
            in: name,
            name: key,
            // @ts-ignore
            required: schema.required?.includes(key) ?? false,
        };
    });
};
exports.mapProperties = mapProperties;
const mapTypesResponse = (types, schema) => {
    if (typeof schema === 'object'
        && ['void', 'undefined', 'null'].includes(schema.type))
        return;
    const responses = {};
    for (const type of types)
        responses[type] = {
            schema: typeof schema === 'string'
                ? {
                    $ref: `#/components/schemas/${schema}`
                }
                : { ...schema }
        };
    return responses;
};
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
exports.capitalize = capitalize;
const generateOperationId = (method, paths) => {
    let operationId = method.toLowerCase();
    if (paths === '/')
        return operationId + 'Index';
    for (const path of paths.split('/')) {
        if (path.charCodeAt(0) === 123) {
            operationId += 'By' + (0, exports.capitalize)(path.slice(1, -1));
        }
        else {
            operationId += (0, exports.capitalize)(path);
        }
    }
    return operationId;
};
exports.generateOperationId = generateOperationId;
const registerSchemaPath = ({ schema, path, method, hook, models }) => {
    if (hook)
        hook = (0, lodash_clonedeep_1.default)(hook);
    const contentType = hook?.type ?? [
        'application/json',
        'multipart/form-data',
        'text/plain'
    ];
    path = (0, exports.toOpenAPIPath)(path);
    const contentTypes = typeof contentType === 'string'
        ? [contentType]
        : contentType ?? ['application/json'];
    const bodySchema = hook?.body;
    const paramsSchema = hook?.params;
    const headerSchema = hook?.headers;
    const querySchema = hook?.query;
    let responseSchema = hook?.response;
    if (typeof responseSchema === 'object') {
        if (typebox_1.Kind in responseSchema) {
            const { type, properties, required, additionalProperties, ...rest } = responseSchema;
            responseSchema = {
                '200': {
                    ...rest,
                    description: rest.description,
                    content: mapTypesResponse(contentTypes, type === 'object' || type === 'array'
                        ? {
                            type,
                            properties,
                            required
                        }
                        : responseSchema)
                }
            };
        }
        else {
            Object.entries(responseSchema).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    if (!models[value])
                        return;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { type, properties, required, additionalProperties: _, ...rest } = models[value];
                    responseSchema[key] = {
                        ...rest,
                        description: rest.description,
                        content: mapTypesResponse(contentTypes, value)
                    };
                }
                else {
                    const { type, properties, required, additionalProperties, ...rest } = value;
                    responseSchema[key] = {
                        ...rest,
                        description: rest.description,
                        content: mapTypesResponse(contentTypes, {
                            type,
                            properties,
                            required
                        })
                    };
                }
            });
        }
    }
    else if (typeof responseSchema === 'string') {
        if (!(responseSchema in models))
            return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, properties, required, additionalProperties: _, ...rest } = models[responseSchema];
        responseSchema = {
            // @ts-ignore
            '200': {
                ...rest,
                content: mapTypesResponse(contentTypes, responseSchema)
            }
        };
    }
    const parameters = [
        ...(0, exports.mapProperties)('header', headerSchema, models),
        ...(0, exports.mapProperties)('path', paramsSchema, models),
        ...(0, exports.mapProperties)('query', querySchema, models)
    ];
    schema[path] = {
        ...(schema[path] ? schema[path] : {}),
        [method.toLowerCase()]: {
            ...((headerSchema || paramsSchema || querySchema || bodySchema
                ? { parameters }
                : {})),
            ...(responseSchema
                ? {
                    responses: responseSchema
                }
                : {}),
            operationId: hook?.detail?.operationId ?? (0, exports.generateOperationId)(method, path),
            ...hook?.detail,
            ...(bodySchema
                ? {
                    requestBody: {
                        content: mapTypesResponse(contentTypes, typeof bodySchema === 'string'
                            ? {
                                $ref: `#/components/schemas/${bodySchema}`
                            }
                            : bodySchema)
                    }
                }
                : null)
        }
    };
};
exports.registerSchemaPath = registerSchemaPath;
const filterPaths = (paths, { excludeStaticFile = true, exclude = [] }) => {
    const newPaths = {};
    for (const [key, value] of Object.entries(paths))
        if (!exclude.some((x) => {
            if (typeof x === 'string')
                return key === x;
            return x.test(key);
        }) &&
            !key.includes('/swagger') &&
            !key.includes('*') &&
            (excludeStaticFile ? !key.includes('.') : true)) {
            Object.keys(value).forEach((method) => {
                const schema = value[method];
                if (key.includes('{')) {
                    if (!schema.parameters)
                        schema.parameters = [];
                    schema.parameters = [
                        ...key
                            .split('/')
                            .filter((x) => x.startsWith('{') &&
                            !schema.parameters.find((params) => params.in === 'path' &&
                                params.name ===
                                    x.slice(1, x.length - 1)))
                            .map((x) => ({
                            schema: { type: 'string' },
                            in: 'path',
                            name: x.slice(1, x.length - 1),
                            required: true
                        })),
                        ...schema.parameters
                    ];
                }
                if (!schema.responses)
                    schema.responses = {
                        200: {}
                    };
            });
            newPaths[key] = value;
        }
    return newPaths;
};
exports.filterPaths = filterPaths;
