const { expect } = require('chai');
const sinon = require('sinon');
const DeviceService = require('../../lcp/services/device-service');
const { DeviceError } = require('../../lcp/errors/device-error');
const { deviceOperations } = require('../../lcp/database');

describe('DeviceService', () => {
    let deviceService;
    let mockAdapterManager;

    beforeEach(() => {
        // Mock adapter manager
        mockAdapterManager = {
            initializeAdapter: sinon.stub().resolves(),
            updateAdapter: sinon.stub().resolves(),
            removeAdapter: sinon.stub().resolves(),
            getAdapter: sinon.stub().returns({
                executeOperation: sinon.stub().resolves(),
                stopOperation: sinon.stub().resolves(),
                testConnection: sinon.stub().resolves(true)
            })
        };

        deviceService = new DeviceService(mockAdapterManager);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Device Registration', () => {
        const validDeviceManifest = {
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

        it('should successfully register a valid device', async () => {
            const createDeviceStub = sinon.stub(deviceOperations, 'createDevice').resolves({
                ...validDeviceManifest,
                device_id: '123',
                status: 'registered'
            });

            const result = await deviceService.registerDevice(validDeviceManifest);

            expect(result).to.have.property('device_id');
            expect(result.status).to.equal('registered');
            expect(createDeviceStub.calledOnce).to.be.true;
            expect(mockAdapterManager.initializeAdapter.calledOnce).to.be.true;
        });

        it('should fail registration with invalid manifest', async () => {
            const invalidManifest = {
                name: 'Test Device'
                // Missing required fields
            };

            try {
                await deviceService.registerDevice(invalidManifest);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.code).to.equal('DEVICE_VALIDATION_FAILED');
            }
        });
    });

    describe('Device Operations', () => {
        const deviceId = 'test-device-123';
        const operationType = 'START';
        const parameters = { temperature: 25 };

        beforeEach(() => {
            sinon.stub(deviceOperations, 'getDevice').resolves({
                device_id: deviceId,
                status: 'online'
            });
        });

        it('should successfully start an operation', async () => {
            const result = await deviceService.startOperation(deviceId, operationType, parameters);
            expect(result).to.have.property('operation_id');
            expect(result.status).to.equal('pending');
            expect(mockAdapterManager.getAdapter.calledWith(deviceId)).to.be.true;
        });

        it('should handle operation failure', async () => {
            mockAdapterManager.getAdapter.returns({
                executeOperation: sinon.stub().rejects(new Error('Operation failed'))
            });

            try {
                await deviceService.startOperation(deviceId, operationType, parameters);
                expect.fail('Should have thrown operation error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.code).to.equal('DEVICE_ERROR');
            }
        });
    });

    describe('Device Data Management', () => {
        const deviceId = 'test-device-123';
        const dataType = 'temperature';
        const value = { temperature: 25, unit: 'celsius' };

        it('should successfully save device data', async () => {
            const result = await deviceService.saveDeviceData(deviceId, null, dataType, value);
            expect(result).to.have.property('device_id', deviceId);
            expect(result).to.have.property('data_type', dataType);
        });

        it('should retrieve device data with filters', async () => {
            const options = {
                data_type: 'temperature',
                start_time: new Date(Date.now() - 3600000),
                end_time: new Date(),
                limit: 10
            };

            const result = await deviceService.getDeviceData(deviceId, options);
            expect(Array.isArray(result)).to.be.true;
        });
    });

    describe('Error Handling', () => {
        const deviceId = 'test-device-123';
        const operationId = 'op-123';
        const error = {
            code: 'TEST_ERROR',
            message: 'Test error message',
            details: { reason: 'test failure' }
        };

        it('should log device errors', async () => {
            const result = await deviceService.logDeviceError(deviceId, operationId, error);
            expect(result.success).to.be.true;
        });

        it('should retrieve device errors', async () => {
            const options = {
                start_time: new Date(Date.now() - 86400000), // Last 24 hours
                limit: 10
            };

            const result = await deviceService.getDeviceErrors(deviceId, options);
            expect(Array.isArray(result)).to.be.true;
        });
    });

    describe('Device Status Management', () => {
        const deviceId = 'test-device-123';

        beforeEach(() => {
            sinon.stub(deviceOperations, 'getDevice').resolves({
                device_id: deviceId,
                status: 'online',
                updated_at: new Date()
            });
        });

        it('should update device status', async () => {
            const result = await deviceService.updateDeviceStatus(deviceId, 'busy');
            expect(result.success).to.be.true;
        });

        it('should get current device status', async () => {
            const result = await deviceService.getDeviceStatus(deviceId);
            expect(result).to.have.property('current_status');
            expect(result).to.have.property('active_operations');
            expect(result).to.have.property('last_updated');
        });
    });

    describe('Device Connection Validation', () => {
        const deviceId = 'test-device-123';

        it('should validate working connection', async () => {
            const result = await deviceService.validateDeviceConnection(deviceId);
            expect(result.success).to.be.true;
        });

        it('should handle failed connection', async () => {
            mockAdapterManager.getAdapter.returns({
                testConnection: sinon.stub().resolves(false)
            });

            try {
                await deviceService.validateDeviceConnection(deviceId);
                expect.fail('Should have thrown connection error');
            } catch (error) {
                expect(error).to.be.instanceOf(DeviceError);
                expect(error.code).to.equal('DEVICE_CONNECTION_FAILED');
            }
        });
    });

    describe('Device Capabilities', () => {
        const deviceId = 'test-device-123';
        const mockCapabilities = {
            operations: ['START', 'STOP'],
            features: ['temperature_control'],
            parameters: {
                temperature: {
                    type: 'number',
                    range: { min: 0, max: 100 }
                }
            }
        };

        beforeEach(() => {
            sinon.stub(deviceOperations, 'getDevice').resolves({
                device_id: deviceId,
                capabilities: mockCapabilities
            });
        });

        it('should get device capabilities', async () => {
            const result = await deviceService.getDeviceCapabilities(deviceId);
            expect(result).to.have.property('capabilities');
            expect(result).to.have.property('supported_operations');
            expect(result).to.have.property('features');
        });
    });
}); 
