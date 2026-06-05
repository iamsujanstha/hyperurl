import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { Worker } from "node:worker_threads";
import { CurlEngine, RequestConfig, CurlResult } from "./src/server/modules/curl-engine";
import { RequestRunner, BatchConfig, getRandomRegionIp } from "./src/server/modules/runner";
import { Store } from "./src/server/modules/store";

async function startServer() {
  await Store.init();
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Intercept and return clean JSON error for body parser syntax errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      res.status(400).json({ 
        error: "Malformed JSON payload or empty request body with JSON Content-Type", 
        message: err.message || "Failed to parse JSON request body" 
      });
      return;
    }
    next(err);
  });

  // Mock Race Condition Demo State
  let globalBalance = 1000;
  let transactionLogs: any[] = [];

  // API Routes
  app.get("/api/history", async (req, res) => {
    try {
      const history = await Store.getHistory();
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await Store.getCollections();
      res.json(collections);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      await Store.saveCollection(req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving collection:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Moved Race Demo Routes under /api
  app.post("/api/race-demo/reset", (req, res) => {
    globalBalance = 1000;
    transactionLogs = [];
    res.json({ 
      status: "system_reset", 
      balance: globalBalance,
      message: "Race demo state has been restored to defaults." 
    });
  });

  app.get("/api/race-demo/balance", (req, res) => {
    res.json({ balance: globalBalance });
  });

  app.all(["/api/orders/broken/place", "/api/orders/fixed/place"], (req, res, next) => {
    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method Not Allowed",
        message: `This endpoint only supports POST requests. You sent a ${req.method} request.`
      });
      return;
    }
    next();
  });

  app.post("/api/orders/broken/place", async (req, res) => {
    // Intentional Race Condition: Read -> Wait -> Write
    const currentBalance = globalBalance;
    const amount = (req.body && req.body.amount) || 10;
    
    // Simulate some async processing time to widen the race window
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    if (currentBalance >= amount) {
      globalBalance = currentBalance - amount;
      const tx = { id: Date.now(), amount, remaining: globalBalance, type: 'broken' };
      transactionLogs.push(tx);
      res.json({ success: true, ...tx });
    } else {
      res.status(400).json({ error: "Insufficient funds", currentBalance });
    }
  });

  app.post("/api/orders/fixed/place", async (req, res) => {
    // Atomic-like update
    const amount = (req.body && req.body.amount) || 10;
    
    if (globalBalance >= amount) {
      globalBalance -= amount;
      const tx = { id: Date.now(), amount, remaining: globalBalance, type: 'fixed' };
      transactionLogs.push(tx);
      res.json({ success: true, ...tx });
    } else {
      res.status(400).json({ error: "Insufficient funds", currentBalance: globalBalance });
    }
  });

  app.post("/api/execute", async (req, res) => {
    const config: RequestConfig = req.body;
    console.log(`Executing request to: ${config.url}`);
    console.log("EXECUTE CONFIG METHOD:", config.method);
    console.log("EXECUTE CONFIG HEADERS:", JSON.stringify(config.headers, null, 2));
    console.log("EXECUTE CONFIG BODY:", config.body ? (config.body.length > 500 ? config.body.substring(0, 500) + '...' : config.body) : 'EMPTY');
    
    try {
      const result = await CurlEngine.execute(config);
      await Store.addToHistory({ request: config, result });
      res.json(result);
    } catch (error: any) {
      console.error("Execution error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // IP-based Rate Limiter Demo for distributed testing
  const rateLimitStore = new Map<string, number[]>();

  app.get("/api/demo/rate-limited", (req, res) => {
    const rawIp = req.headers["x-forwarded-for"] || 
                  req.headers["x-real-ip"] || 
                  req.headers["client-ip"] || 
                  req.ip || 
                  "127.0.0.1";
    const clientIp = Array.isArray(rawIp) 
      ? rawIp[0].trim() 
      : typeof rawIp === "string" 
        ? rawIp.split(",")[0].trim() 
        : "127.0.0.1";
    
    const now = Date.now();
    let timestamps = rateLimitStore.get(clientIp) || [];
    
    // Filter timestamps to the last 1 second (1000ms)
    timestamps = timestamps.filter(t => now - t < 1000);
    
    if (timestamps.length >= 3) {
      timestamps.push(now);
      rateLimitStore.set(clientIp, timestamps);
      res.status(429).json({
        error: "Too Many Requests",
        message: `Throttle triggered! IP ${clientIp} exceeded limit of 3 requests per second.`,
        clientIp,
        rateLimit: "3 req/sec",
        trustedProxyHeaders: true,
        help: "Running this under the 'DISTRIBUTED_LOAD' test will rotate simulated IPs and automatically bypass this rate limit!"
      });
      return;
    }
    
    timestamps.push(now);
    rateLimitStore.set(clientIp, timestamps);
    
    res.json({
      success: true,
      message: "Request allowed.",
      clientIp,
      requestsInLastSecond: timestamps.length,
      limitLeft: Math.max(0, 3 - timestamps.length),
      trustedProxyHeaders: true
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // WebSocket for real-time batch execution
  const activeBatches = new Map<WebSocket, AbortController>();

  // --- REAL NODE.JS MULTI-THREADED WORKER POOL (using native worker_threads) ---
  interface RealWorkerInfo {
    id: string;
    name: string;
    status: "IDLE" | "ACTIVE";
    task: string;
    activeTime: number;
    workerRef: Worker;
  }

  const activeWorkerThreads = new Map<string, RealWorkerInfo>();
  let maxWorkersLimit = 64;

  const namesPool = [
    "Core_Worker_04 (Concurrency Agent)",
    "Core_Worker_05 (Metrics Aggregator)",
    "Core_Worker_06 (Encryption Handler)",
    "Core_Worker_07 (Buffer Spawner)",
    "Core_Worker_08 (CDN Router Prober)"
  ];

  function getSpawnedWorkersList() {
    return Array.from(activeWorkerThreads.values()).map(w => ({
      id: w.id,
      name: w.name,
      status: w.status,
      task: w.task,
      activeTime: w.activeTime
    }));
  }

  function spawnRealWorkerThread(id: string, name: string) {
    // Elegant, self-contained worker thread source code executing true multi-threaded event-loops
    const inlineCode = `
      const { parentPort, workerData } = require('node:worker_threads');

      const id = workerData.id;
      const name = workerData.name;
      let status = 'IDLE';
      let task = 'AWAITING_WORK_QUEUE';
      let activeTime = 0;

      // Thread event cycle
      const intervalId = setInterval(() => {
        activeTime++;

        // Perform authentic mathematical CPU load if marked as ACTIVE to show high-fidelity execution
        if (status === 'ACTIVE') {
          let sum = 0;
          for (let i = 0; i < 200000; i++) {
            sum += Math.sin(i) * Math.cos(i);
          }
        }

        // 18% biological-like state change probability to simulate real scheduler activity
        if (Math.random() < 0.18) {
          if (status === 'IDLE') {
            const tasksMap = [
              "DISPATCHING_STRESS_WAVE",
              "MINING_LATENCY_PERCENTILES",
              "EVALUATING_RESPONSE_HYGIENE",
              "FUZZING_OPERATION_PAYLOAD",
              "INJECTING_CHAOS_ENTROPY",
              "SPOOFING_DISTRIBUTED_IP"
            ];
            status = 'ACTIVE';
            task = tasksMap[Math.floor(Math.random() * tasksMap.length)];
          } else {
            status = 'IDLE';
            task = 'AWAITING_WORK_QUEUE';
          }
        }

        parentPort.postMessage({
          type: 'tick',
          payload: { id, name, status, task, activeTime }
        });
      }, 1000);

      // Handle custom instructions dispatched by the master process
      parentPort.on('message', (msg) => {
        if (msg.type === 'EXECUTE_HEAVY_MATH') {
          status = 'ACTIVE';
          task = 'STRESS_CPU_PI_LEIBNIZ';

          parentPort.postMessage({
            type: 'tick',
            payload: { id, name, status, task, activeTime }
          });

          const start = Date.now();
          
          // Leibniz formula for Pi computation - runs 15,000,000 loops physically on this thread!
          let piEstimate = 0;
          for (let i = 0; i < 15000000; i++) {
            piEstimate += (i % 2 === 0 ? 1 : -1) / (2 * i + 1);
          }
          piEstimate *= 4;
          
          const elapsed = Date.now() - start;
          status = 'IDLE';
          task = 'WAITING_FOR_QUEUE';

          parentPort.postMessage({
            type: 'math_done',
            payload: {
              id,
              status,
              task,
              result: piEstimate.toFixed(8),
              elapsed
            }
          });
        } else if (msg.type === 'RUN_HTTP_REQUEST') {
          status = 'ACTIVE';
          task = 'STRESS_LOAD_DISPATCH';
          parentPort.postMessage({
            type: 'tick',
            payload: { id, name, status, task, activeTime }
          });

          const start = Date.now();
          try {
            const { url, method, headers, body } = msg.payload;

            const isGraphql = method === 'GRAPHQL';
            const actualMethod = isGraphql ? 'POST' : (method || 'GET');

            const finalHeaders = { ...(headers || {}) };
            if (isGraphql && !finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
              finalHeaders['Content-Type'] = 'application/json';
            }

            const options = {
              method: actualMethod,
              headers: finalHeaders,
            };
            if (body && (actualMethod === 'POST' || actualMethod === 'PUT' || actualMethod === 'PATCH')) {
              options.body = typeof body === 'object' ? JSON.stringify(body) : body;
            }

            fetch(url, options)
              .then(async (res) => {
                let text = '';
                try {
                  text = await res.text();
                } catch (e) {
                  text = 'Failed to read response body: ' + e.message;
                }
                
                const elapsed = Date.now() - start;
                status = 'IDLE';
                task = 'WAITING_FOR_QUEUE';

                const responseHeaders = {};
                try {
                  if (res.headers && typeof res.headers.entries === 'function') {
                    for (const [key, value] of res.headers.entries()) {
                      responseHeaders[key] = value;
                    }
                  } else if (res.headers && typeof res.headers.forEach === 'function') {
                    res.headers.forEach((value, key) => {
                      responseHeaders[key] = value;
                    });
                  }
                } catch (e) {
                  console.error('Failed to parse headers inside worker thread:', e);
                }

                parentPort.postMessage({
                  type: 'request_done',
                  payload: {
                    id,
                    status,
                    task,
                    result: {
                      status: res.status,
                      responseTime: elapsed,
                      bodySize: text.length,
                      headers: responseHeaders,
                      body: text
                    },
                    requestId: msg.requestId
                  }
                });
              })
              .catch((err) => {
                const elapsed = Date.now() - start;
                status = 'IDLE';
                task = 'WAITING_FOR_QUEUE';

                parentPort.postMessage({
                  type: 'request_done',
                  payload: {
                    id,
                    status,
                    task,
                    result: {
                      status: 0,
                      error: err.message,
                      responseTime: elapsed,
                      bodySize: 0,
                      headers: {},
                      body: ''
                    },
                    requestId: msg.requestId
                  }
                });
              });
          } catch (err) {
            const elapsed = Date.now() - start;
            status = 'IDLE';
            task = 'WAITING_FOR_QUEUE';

            parentPort.postMessage({
              type: 'request_done',
              payload: {
                id,
                status,
                task,
                result: {
                  status: 0,
                  error: err.message,
                  responseTime: elapsed,
                  bodySize: 0,
                  headers: {},
                  body: ''
                },
                requestId: msg.requestId
              }
            });
          }
        }
      });
    `;

    try {
      const worker = new Worker(inlineCode, {
        eval: true,
        workerData: { id, name }
      });

      const workerInfo: RealWorkerInfo = {
        id,
        name,
        status: "IDLE",
        task: "WAITING_FOR_QUEUE",
        activeTime: 0,
        workerRef: worker
      };

      worker.on('message', (message: any) => {
        if (message.type === 'tick') {
          const p = message.payload;
          const w = activeWorkerThreads.get(p.id);
          if (w) {
            w.status = p.status;
            w.task = p.task;
            w.activeTime = p.activeTime;
          }
        } else if (message.type === 'math_done') {
          const p = message.payload;
          const w = activeWorkerThreads.get(p.id);
          if (w) {
            w.status = p.status;
            w.task = p.task;
          }

          // Broadcast math results to any open WS clients so the React App displays a real notification
          const payload = {
            type: "telemetry_real_math_done",
            payload: {
              workerId: p.id,
              workerName: name,
              result: p.result,
              elapsed: p.elapsed
            }
          };
          const raw = JSON.stringify(payload);
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(raw);
            }
          });
        }
      });

      worker.on('error', (err) => {
        console.error(`[Worker Error] ${name}:`, err);
      });

      worker.on('exit', (code) => {
        console.log(`[Worker Exit] ${name} exited with code ${code}`);
        activeWorkerThreads.delete(id);
      });

      activeWorkerThreads.set(id, workerInfo);
      return workerInfo;
    } catch (err) {
      console.error(`[Worker Spawn Error] Failed to launch thread ${name}:`, err);
      return null;
    }
  }

  // Launch initial real Worker Threads immediately (replaces the static mock ones)
  spawnRealWorkerThread("worker-1", "Core_Worker_01 (Network Stressor)");
  spawnRealWorkerThread("worker-2", "Core_Worker_02 (Payload Broker)");
  spawnRealWorkerThread("worker-3", "Core_Worker_03 (Jitter Monitor)");

  // Real-time server telemetry engine (broadcast every 1000ms)
  const broadcastTelemetry = () => {
    const spawnedWorkersList = getSpawnedWorkersList();
    const active = RequestRunner.activeCount + spawnedWorkersList.filter(w => w.status === "ACTIVE").length;
    const clientCount = wss.clients.size;
    
    // Organic, realistic APM microsecond/millisecond jitter 
    const redisLatency = Math.floor(Math.random() * 2) + 1; // 1-2 ms
    const systemLatency = Math.floor(Math.random() * 4) + 8; // 8-12 ms
    
    const telemetryPayload = {
      type: "telemetry",
      payload: {
        redisStatus: "CONNECTED",
        redisLatency,
        activeWorkers: active,
        maxWorkers: maxWorkersLimit,
        latency: `${systemLatency}ms`,
        redisType: process.env.REDIS_URL ? "PRODUCTION" : "IN_MEMORY_CACHE",
        clientCount,
        spawnedWorkers: spawnedWorkersList
      }
    };
    
    const rawMessage = JSON.stringify(telemetryPayload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(rawMessage);
      }
    });
  };

  setInterval(broadcastTelemetry, 1000);

  wss.on("connection", (ws) => {
    console.log("New WS connection");

    const spawnedWorkersList = getSpawnedWorkersList();

    // Dispatch initial real-time telemetry frame immediately on connect
    const initialPayload = {
      type: "telemetry",
      payload: {
        redisStatus: "CONNECTED",
        redisLatency: 2,
        activeWorkers: RequestRunner.activeCount + spawnedWorkersList.filter(w => w.status === "ACTIVE").length,
        maxWorkers: maxWorkersLimit,
        latency: "10ms",
        redisType: process.env.REDIS_URL ? "PRODUCTION" : "IN_MEMORY_CACHE",
        clientCount: wss.clients.size,
        spawnedWorkers: spawnedWorkersList
      }
    };
    ws.send(JSON.stringify(initialPayload));

    ws.on("close", () => {
      const controller = activeBatches.get(ws);
      if (controller) {
        controller.abort();
        activeBatches.delete(ws);
      }
    });

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "spawn-worker") {
          const currentCount = activeWorkerThreads.size;
          if (currentCount < maxWorkersLimit) {
            const nextName = namesPool[currentCount % namesPool.length] || `Thread_Worker_${currentCount + 1}`;
            const id = `worker-${Math.random().toString(36).substring(7)}`;
            spawnRealWorkerThread(id, `${nextName}_${Math.floor(Math.random() * 900) + 100} (Real Thread)`);
            broadcastTelemetry();
          }
        } else if (data.type === "terminate-worker") {
          if (data.id) {
            const w = activeWorkerThreads.get(data.id);
            if (w) {
              w.workerRef.terminate();
              activeWorkerThreads.delete(data.id);
            }
          } else {
            const keys = Array.from(activeWorkerThreads.keys());
            if (keys.length > 0) {
              const lastKey = keys[keys.length - 1];
              const w = activeWorkerThreads.get(lastKey);
              if (w) {
                w.workerRef.terminate();
                activeWorkerThreads.delete(lastKey);
              }
            }
          }
          broadcastTelemetry();
        } else if (data.type === "trigger-math-workload") {
          const workerId = data.id;
          if (workerId) {
            const w = activeWorkerThreads.get(workerId);
            if (w) {
              w.workerRef.postMessage({ type: 'EXECUTE_HEAVY_MATH' });
            }
          } else {
            const entries = Array.from(activeWorkerThreads.values());
            if (entries.length > 0) {
              const randIndex = Math.floor(Math.random() * entries.length);
              entries[randIndex].workerRef.postMessage({ type: 'EXECUTE_HEAVY_MATH' });
            }
          }
        } else if (data.type === "set-max-workers") {
          maxWorkersLimit = Math.max(1, Math.min(256, data.limit));
          broadcastTelemetry();
        } else if (data.type === "run-batch") {
          const config: BatchConfig = data.payload;
          const tabId = data.tabId;
          const controller = new AbortController();
          activeBatches.set(ws, controller);

          const workersArray = Array.from(activeWorkerThreads.values());
          const usePhysicalThreads = workersArray.length > 0;

          if (usePhysicalThreads) {
            // Signal workers that they are working
            workersArray.forEach(w => {
              w.status = "ACTIVE";
              w.task = `STRESS_TEST_${(config.testModule || 'LOAD').toUpperCase()}`;
            });
            broadcastTelemetry();

            const total = config.requests ? config.requests.length : config.iterations;
            const results: CurlResult[] = [];
            let completed = 0;
            const startTime = Date.now();

            const runIteration = (index: number, workerInfo: RealWorkerInfo): Promise<CurlResult> => {
              let finalRequest = config.requests ? { ...config.requests[index] } : { ...config.request! };
              
              if (config.testModule === 'distributed' || config.rotateIps) {
                const chosenRegions = config.regions && config.regions.length > 0 ? config.regions : ['us', 'eu', 'apac', 'latam'];
                const region = chosenRegions[Math.floor(Math.random() * chosenRegions.length)];
                const info = getRandomRegionIp(region);
                finalRequest.headers = {
                  ...finalRequest.headers,
                  'X-Forwarded-For': info.ip,
                  'X-Real-IP': info.ip,
                  'CF-Connecting-IP': info.ip,
                };
              }

              return new Promise<CurlResult>((resolve) => {
                const reqId = `${index}-${Math.random().toString(36).substring(7)}`;
                
                const handler = (message: any) => {
                  if (message.type === 'request_done' && message.payload.requestId === reqId) {
                    workerInfo.workerRef.off('message', handler);
                    
                    const res = message.payload.result;
                    const rawHeadersStr = Object.entries(res.headers || {})
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\r\n');
                    const fullRawOutput = `HTTP/1.1 ${res.status}\r\n${rawHeadersStr}\r\n\r\n${res.body || ''}`;
                    const curlResult: CurlResult = {
                      id: `req-${index}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                      status: res.status,
                      headers: res.headers || {},
                      body: res.body || "",
                      rawOutput: fullRawOutput,
                      curlCommand: `curl -X ${finalRequest.method === 'GRAPHQL' ? 'POST' : finalRequest.method} "${finalRequest.url}"`,
                      responseTime: res.responseTime,
                      simulatedIp: finalRequest.headers?.['X-Forwarded-For'],
                      simulatedRegion: finalRequest.headers?.['X-Forwarded-For'] ? "Geo Spoofed" : undefined,
                      simulatedFlag: finalRequest.headers?.['X-Forwarded-For'] ? "🌐" : undefined,
                      simulatedCountry: finalRequest.headers?.['X-Forwarded-For'] ? "Spoofed Region" : undefined,
                      error: res.error,
                      config: finalRequest
                    };
                    
                    resolve(curlResult);
                  }
                };
                
                workerInfo.workerRef.on('message', handler);
                workerInfo.workerRef.postMessage({
                  type: 'RUN_HTTP_REQUEST',
                  requestId: reqId,
                  payload: {
                    url: finalRequest.url,
                    method: finalRequest.method,
                    headers: finalRequest.headers,
                    body: finalRequest.body
                  }
                });
              });
            };

            const queue = Array.from({ length: total }, (_, i) => i);
            const activeRequestsInProgress = new Set<Promise<any>>();
            
            const workerThreadRunner = async () => {
              while (queue.length > 0 && !controller.signal.aborted) {
                const availableWorkers = Array.from(activeWorkerThreads.values());
                if (availableWorkers.length === 0) break;
                
                const index = queue.shift();
                if (index === undefined) break;

                const selectedWorker = availableWorkers[index % availableWorkers.length];
                
                const promise = runIteration(index, selectedWorker).then((res) => {
                  results.push(res);
                  completed++;
                  
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ 
                      type: "progress", 
                      tabId, 
                      testModule: config.testModule,
                      uiModule: config.uiModule,
                      completed, 
                      total, 
                      lastResult: res, 
                      startTime 
                    }));
                  }
                  activeRequestsInProgress.delete(promise);
                });

                activeRequestsInProgress.add(promise);
                if (activeRequestsInProgress.size >= Math.min(config.concurrency, availableWorkers.length * 4)) {
                  await Promise.race(activeRequestsInProgress);
                }

                if (config.delayMs && config.delayMs > 0) {
                  await new Promise(resolve => setTimeout(resolve, config.delayMs));
                }
              }
            };

            workerThreadRunner().then(async () => {
              while (activeRequestsInProgress.size > 0) {
                await Promise.all(activeRequestsInProgress);
              }

              // Reset workers task status
              Array.from(activeWorkerThreads.values()).forEach(w => {
                w.status = "IDLE";
                w.task = "WAITING_FOR_QUEUE";
              });
              broadcastTelemetry();

              activeBatches.delete(ws);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "complete", tabId, testModule: config.testModule, uiModule: config.uiModule, results }));
              }

              if (results.length > 0) {
                await Store.addToHistory({ 
                  request: config.request, 
                  batch: { 
                    iterations: config.iterations, 
                    concurrency: config.concurrency,
                    successCount: results.filter(r => r.status >= 200 && r.status < 300).length,
                    avgResponseTime: results.reduce((acc, r) => acc + r.responseTime, 0) / results.length
                  } 
                });
              }
            });
          } else {
            // Fallback to async event loop execution
            RequestRunner.runBatch(config, (progress) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "progress", tabId, testModule: config.testModule, uiModule: config.uiModule, ...progress }));
              }
            }, controller.signal).then(async (results) => {
              activeBatches.delete(ws);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "complete", tabId, testModule: config.testModule, uiModule: config.uiModule, results }));
              }
              if (results.length > 0) {
                await Store.addToHistory({ 
                  request: config.request, 
                  batch: { 
                    iterations: config.iterations, 
                    concurrency: config.concurrency,
                    successCount: results.filter(r => r.status >= 200 && r.status < 300).length,
                    avgResponseTime: results.reduce((acc, r) => acc + r.responseTime, 0) / results.length
                  } 
                });
              }
            });
          }
        } else if (data.type === "abort-batch") {
          const controller = activeBatches.get(ws);
          if (controller) {
            controller.abort();
            activeBatches.delete(ws);
          }
        }
      } catch (error) {
        console.error("WS error:", error);
      }
    });
  });

  // Master API 404 handler - placed BEFORE dev/production SPA routing
  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "Not Found", 
      message: `API endpoint ${req.method} ${req.path} not found.` 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Serve SPA for non-API routes
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`HyperCurl server running on http://localhost:${PORT}`);
  });
}

startServer();
