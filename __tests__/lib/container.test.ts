import { Container, ServiceLifetime } from '../../lib/container';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  afterEach(() => {
    container.reset();
  });

  describe('Singleton Registration', () => {
    it('should register and resolve a singleton service', () => {
      // Arrange
      const token = 'testService';
      const service = { name: 'Test Service' };
      const factory = jest.fn().mockReturnValue(service);

      // Act
      container.registerSingleton(token, factory);
      const resolved1 = container.resolve(token);
      const resolved2 = container.resolve(token);

      // Assert
      expect(factory).toHaveBeenCalledTimes(1);
      expect(resolved1).toBe(service);
      expect(resolved2).toBe(service); // Same instance
      expect(resolved1).toBe(resolved2); // Same instance
    });

    it('should register a singleton instance directly', () => {
      // Arrange
      const token = 'instanceService';
      const service = { name: 'Instance Service' };

      // Act
      container.registerInstance(token, service);
      const resolved = container.resolve(token);

      // Assert
      expect(resolved).toBe(service); // Same instance
    });
  });

  describe('Transient Registration', () => {
    it('should register and resolve a transient service', () => {
      // Arrange
      const token = 'transientService';
      const factory = jest.fn().mockImplementation(() => ({ name: 'Transient Service' }));

      // Act
      container.registerTransient(token, factory);
      const resolved1 = container.resolve(token) as { name: string };
      const resolved2 = container.resolve(token) as { name: string };

      // Assert
      expect(factory).toHaveBeenCalledTimes(2);
      expect(resolved1).not.toBe(resolved2); // Different instances
      expect(resolved1.name).toEqual(resolved2.name); // But with same content
    });
  });

  describe('Class Registration', () => {
    it('should register and resolve a class with dependencies', () => {
      // Arrange
      class Dependency {
        value = 'dependency value';
      }

      class Service {
        constructor(public dependency: Dependency) {}
        getValue() {
          return this.dependency.value;
        }
      }

      // Act
      container.registerClass('dependency', Dependency);
      container.registerClass('service', Service, ['dependency']);
      const service = container.resolve<Service>('service');

      // Assert
      expect(service).toBeInstanceOf(Service);
      expect(service.dependency).toBeInstanceOf(Dependency);
      expect(service.getValue()).toBe('dependency value');
    });
  });

  describe('Container Features', () => {
    it('should check if a service is registered', () => {
      // Arrange
      const token = 'registeredService';
      container.registerInstance(token, {});

      // Act & Assert
      expect(container.has(token)).toBe(true);
      expect(container.has('unregisteredService')).toBe(false);
    });

    it('should throw when resolving an unregistered service', () => {
      // Act & Assert
      expect(() => container.resolve('nonExistent')).toThrow(/Service not registered/);
    });

    it('should detect circular dependencies', () => {
      // Arrange
      const tokenA = 'serviceA';
      const tokenB = 'serviceB';

      container.register(tokenA, (c) => c.resolve(tokenB));
      container.register(tokenB, (c) => c.resolve(tokenA));

      // Act & Assert
      expect(() => container.resolve(tokenA)).toThrow(/Circular dependency detected/);
    });

    it('should create a child container that inherits registrations', () => {
      // Arrange
      const parentToken = 'parentService';
      const parentService = { name: 'Parent Service' };
      container.registerInstance(parentToken, parentService);

      // Act
      const childContainer = container.createChildContainer();
      const resolvedFromChild = childContainer.resolve(parentToken);

      // Assert
      expect(resolvedFromChild).toBe(parentService); // Child inherits parent registrations
    });

    it('should allow child container to override parent registrations', () => {
      // Arrange
      const token = 'sharedService';
      const parentService = { name: 'Parent Service' };
      const childService = { name: 'Child Service' };
      
      container.registerInstance(token, parentService);
      const childContainer = container.createChildContainer();
      childContainer.registerInstance(token, childService);

      // Act
      const resolvedFromParent = container.resolve(token);
      const resolvedFromChild = childContainer.resolve(token);

      // Assert
      expect(resolvedFromParent).toBe(parentService);
      expect(resolvedFromChild).toBe(childService);
    });
  });

  describe('Generic Registration Methods', () => {
    it('should register with custom lifetime', () => {
      // Arrange
      const transientToken = 'customTransient';
      const singletonToken = 'customSingleton';
      const transientFactory = jest.fn().mockImplementation(() => ({ type: 'transient' }));
      const singletonFactory = jest.fn().mockImplementation(() => ({ type: 'singleton' }));

      // Act
      container.register(transientToken, transientFactory, { lifetime: ServiceLifetime.TRANSIENT });
      container.register(singletonToken, singletonFactory, { lifetime: ServiceLifetime.SINGLETON });
      
      // Resolve multiple times
      const transient1 = container.resolve(transientToken);
      const transient2 = container.resolve(transientToken);
      const singleton1 = container.resolve(singletonToken);
      const singleton2 = container.resolve(singletonToken);

      // Assert
      expect(transientFactory).toHaveBeenCalledTimes(2); // New instance each time
      expect(singletonFactory).toHaveBeenCalledTimes(1); // Only once for singleton
      expect(transient1).not.toBe(transient2);
      expect(singleton1).toBe(singleton2);
    });
  });
});