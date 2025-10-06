const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Data Pusher API',
            version: '1.0.0',
            description: 'API for receiving JSON data and forwarding to various destinations via webhooks',
            contact: {
                name: 'API Support',
                email: 'support@datapusher.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:8080/api',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'CL-X-TOKEN'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            minLength: 6,
                            example: 'password123'
                        }
                    }
                },
                Account: {
                    type: 'object',
                    required: ['email', 'accountName'],
                    properties: {
                        accountId: {
                            type: 'string',
                            example: 'acc-123e4567-e89b-12d3-a456-426614174000'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'account@example.com'
                        },
                        accountName: {
                            type: 'string',
                            example: 'My Account'
                        },
                        appSecretToken: {
                            type: 'string',
                            example: 'a1b2c3d4e5f6...'
                        },
                        website: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Destination: {
                    type: 'object',
                    required: ['accountId', 'url', 'httpMethod', 'headers'],
                    properties: {
                        destinationId: {
                            type: 'string',
                            example: 'dest-123e4567-e89b-12d3-a456-426614174000'
                        },
                        accountId: {
                            type: 'string',
                            example: 'acc-123e4567-e89b-12d3-a456-426614174000'
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://webhook.site/unique-url'
                        },
                        httpMethod: {
                            type: 'string',
                            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                            example: 'POST'
                        },
                        headers: {
                            type: 'object',
                            example: {
                                'APP_ID': '1234APPID1234',
                                'APP_SECRET': 'secretkey',
                                'Content-Type': 'application/json'
                            }
                        }
                    }
                },
                Log: {
                    type: 'object',
                    properties: {
                        eventId: {
                            type: 'string',
                            example: 'evt-123e4567'
                        },
                        accountId: {
                            type: 'string',
                            example: 'acc-123e4567-e89b-12d3-a456-426614174000'
                        },
                        destinationId: {
                            type: 'string',
                            example: 'dest-123e4567-e89b-12d3-a456-426614174000'
                        },
                        receivedTimestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        processedTimestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        receivedData: {
                            type: 'object'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'success', 'failed'],
                            example: 'success'
                        },
                        errorMessage: {
                            type: 'string'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful'
                        },
                        data: {
                            type: 'object'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints'
            },
            {
                name: 'Accounts',
                description: 'Account management endpoints'
            },
            {
                name: 'Destinations',
                description: 'Destination management endpoints'
            },
            {
                name: 'Logs',
                description: 'Log retrieval endpoints'
            },
            {
                name: 'Data Handler',
                description: 'Incoming data processing endpoint'
            },
            {
                name: 'Account Members',
                description: 'Account member management endpoints'
            }
        ]
    },
    apis: ['./docs/swagger/*.yaml', './modules/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerDocs
};

