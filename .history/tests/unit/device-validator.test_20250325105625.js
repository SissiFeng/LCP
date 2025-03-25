const { expect } = require('chai');
const {
    validateDeviceManifest,
    validateConnectionInfo,
    validateCapabilities,
    validateParameter,
    validateOperation
} = require('../../lcp/validators/device-validator');
const { DeviceError } = require('../../lcp/errors/device-error');

describe('Device Validator', () => {
    describe('Device Manifest Validation', () => {
        const validManifest = {
            name: 'Test Device',
            type: 'temperature_controller',
            category: 'environmental',
            manufacturer: 'Test Manufacturer',
            model: 'Test-100',
            firmware_version: '1.0.0',
            connection_info: {
                protocol: 'mqtt',
                host: 'localhost',
                port: 1883
            },
            capabilities: {
                operations: ['START', 'STOP'],
                features: ['temperature_control'],
                data_types: ['temperature', 'humidity'],
                parameters: {
                    temperature: {
                        type: 'number',
                        unit: 'celsius',
                        range: { min: -50, max: 100 }
                    }
                }
            }
        };

        it('should validate a correct device manifest', async () => {
            const result = await validateDeviceManifest(validManifest);
            expect(result).to.deep.equal(validManifest);
        });

        it('should fail on missing required fields', async () => {
            const invalidManifest = {
                name: 'Test Device'
                // Missing other required fields
            };

            try {
                await validateDeviceManifest(invalidManifest);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.code).to.equal('DEVICE_VALIDATION_FAILED');
            }
        });

        it('should fail on invalid protocol', async () => {
            const invalidManifest = {
                ...validManifest,
                connection_info: {
                    ...validManifest.connection_info,
                    protocol: 'invalid_protocol'
                }
            };

            try {
                await validateDeviceManifest(invalidManifest);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.details.errors[0].message).to.include('protocol');
            }
        });
    });

    describe('Connection Info Validation', () => {
        const validConnectionInfo = {
            protocol: 'mqtt',
            host: 'localhost',
            port: 1883,
            auth: {
                username: 'test',
                password: 'test123'
            }
        };

        it('should validate correct connection info', async () => {
            const result = await validateConnectionInfo(validConnectionInfo);
            expect(result).to.deep.equal(validConnectionInfo);
        });

        it('should validate websocket protocol', async () => {
            const wsConnection = {
                ...validConnectionInfo,
                protocol: 'websocket',
                path: '/ws'
            };
            const result = await validateConnectionInfo(wsConnection);
            expect(result.protocol).to.equal('websocket');
        });

        it('should fail on invalid port', async () => {
            const invalidConnection = {
                ...validConnectionInfo,
                port: 999999 // Invalid port number
            };

            try {
                await validateConnectionInfo(invalidConnection);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.details.errors[0].message).to.include('port');
            }
        });
    });

    describe('Capabilities Validation', () => {
        const validCapabilities = {
            operations: ['START', 'STOP'],
            features: ['temperature_control'],
            data_types: ['temperature', 'humidity'],
            parameters: {
                temperature: {
                    type: 'number',
                    unit: 'celsius',
                    range: { min: -50, max: 100 }
                }
            }
        };

        it('should validate correct capabilities', async () => {
            const result = await validateCapabilities(validCapabilities);
            expect(result).to.deep.equal(validCapabilities);
        });

        it('should fail on empty operations array', async () => {
            const invalidCapabilities = {
                ...validCapabilities,
                operations: []
            };

            try {
                await validateCapabilities(invalidCapabilities);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.details.errors[0].message).to.include('operations');
            }
        });
    });

    describe('Parameter Validation', () => {
        it('should validate number parameter within range', async () => {
            const paramSpec = {
                type: 'number',
                range: { min: 0, max: 100 }
            };
            const result = await validateParameter('temperature', 50, paramSpec);
            expect(result).to.equal(50);
        });

        it('should validate string parameter from enum', async () => {
            const paramSpec = {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH']
            };
            const result = await validateParameter('mode', 'MEDIUM', paramSpec);
            expect(result).to.equal('MEDIUM');
        });

        it('should fail on number out of range', async () => {
            const paramSpec = {
                type: 'number',
                range: { min: 0, max: 100 }
            };

            try {
                await validateParameter('temperature', 150, paramSpec);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.code).to.equal('DEVICE_VALIDATION_FAILED');
            }
        });
    });

    describe('Operation Validation', () => {
        const deviceCapabilities = {
            operations: ['START', 'STOP', 'PAUSE']
        };

        it('should validate supported operation', async () => {
            const result = await validateOperation('START', deviceCapabilities);
            expect(result).to.be.true;
        });

        it('should fail on unsupported operation', async () => {
            try {
                await validateOperation('INVALID_OP', deviceCapabilities);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.code).to.equal('DEVICE_VALIDATION_FAILED');
            }
        });
    });
}); 
