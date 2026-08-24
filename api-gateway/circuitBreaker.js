const CircuitBreaker = require('opossum');
const client = require('prom-client');
const axios = require('axios');

// === PROMETHEUS METRIKE ZA CIRCUIT BREAKER ===
const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_state',
  help: 'State of circuit breaker (0=closed, 1=open, 2=half-open)',
  labelNames: ['service']
});

const circuitBreakerFailures = new client.Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of failures in circuit breaker',
  labelNames: ['service']
});

const circuitBreakerSuccesses = new client.Counter({
  name: 'circuit_breaker_successes_total',
  help: 'Total number of successful requests through circuit breaker',
  labelNames: ['service']
});

// Opcije za Circuit Breaker
const options = {
  timeout: 10000,                      // 10 sekundi timeout
  errorThresholdPercentage: 50,       // 50% grešaka otvara prekidač
  resetTimeout: 30000,                // 30 sekundi polu-otvoreno
  rollingCountTimeout: 10000,         // 10 sekundi prozor
  rollingCountBuckets: 10,            // 10 bucket-a
  name: 'sensor-service'
};

// Kreiranje Circuit Breaker-a za Sensor Service
const createCircuitBreaker = (serviceName, serviceUrl) => {
  const breaker = new CircuitBreaker(async (req) => {
    const url = `${serviceUrl}/api${req.path}`;
    
    console.log(`🔄 Circuit Breaker: Šaljem zahtev ka ${url}`);
    
    try {
      const response = await axios({
        method: req.method,
        url: url,
        data: req.body,
        params: req.query,
        headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization
            ? { Authorization: req.headers.authorization }
            : {})
        },
        timeout: 3000
      });
      
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      // Ako servis ne radi, bacamo grešku koju Circuit Breaker prepoznaje
      console.log(`❌ Greška pri pozivu ${serviceName}:`, error.message);
      throw error;
    }
  }, {
    ...options,
    name: serviceName
  });

  // === FALLBACK ===
   breaker.fallback((req, error) => {  // ← DODAJ error PARAMETAR
    console.log(`⚠️ Circuit Breaker FALLBACK za ${serviceName}`);
    console.log(`   Razlog: ${error ? error.message : 'Nepoznata greška'}`);
    
    return {
      error: true,
      message: `${serviceName} trenutno nije dostupan. Molimo pokušajte kasnije.`,
      service: serviceName,
      timestamp: new Date().toISOString(),
      fallback: true
    };
  });


  // === EVENTI ZA MONITORING ===
  breaker.on('open', () => {
    console.log(`🔴 Circuit Breaker OPEN za ${serviceName}`);
    circuitBreakerState.set({ service: serviceName }, 1);
  });

  breaker.on('halfOpen', () => {
    console.log(`🟡 Circuit Breaker HALF-OPEN za ${serviceName}`);
    circuitBreakerState.set({ service: serviceName }, 2);
  });

  breaker.on('close', () => {
    console.log(`🟢 Circuit Breaker CLOSED za ${serviceName}`);
    circuitBreakerState.set({ service: serviceName }, 0);
  });

  breaker.on('failure', (error) => {
    console.log(`❌ Circuit Breaker FAILURE za ${serviceName}:`, error.message);
    circuitBreakerFailures.inc({ service: serviceName });
  });

  breaker.on('success', () => {
    circuitBreakerSuccesses.inc({ service: serviceName });
  });

  breaker.on('timeout', () => {
    console.log(`⏱️ Circuit Breaker TIMEOUT za ${serviceName}`);
    circuitBreakerFailures.inc({ service: serviceName });
  });

  return breaker;
};

// Kreiraj breakere za sve servise
const sensorBreaker = createCircuitBreaker('sensor-service', 'http://sensor-service:3001');
const irrigationBreaker = createCircuitBreaker('irrigation-service', 'http://irrigation-service:3002');
const alertBreaker = createCircuitBreaker('alert-service', 'http://alert-service:3003');

// Registruj metrike (ako već nisu registrovane)
const registerMetrics = (register) => {
  try {
    register.registerMetric(circuitBreakerState);
    register.registerMetric(circuitBreakerFailures);
    register.registerMetric(circuitBreakerSuccesses);
  } catch (error) {
    // Metrike već postoje
  }
};

module.exports = {
  sensorBreaker,
  irrigationBreaker,
  alertBreaker,
  registerMetrics
};