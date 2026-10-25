import express from 'express';
import { createServer as createViteServer } from 'vite';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  // Helper to run python app.py CLI command and return JSON
  function runPython(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      execFile('python3', ['app.py', ...args], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr || error.message));
        }
        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch (e) {
          resolve({ raw: stdout });
        }
      });
    });
  }

  // API Routes delegating directly to Python logic
  app.get('/api/cases', async (req, res) => {
    try {
      const data = await runPython(['--api-cases']);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/audit', async (req, res) => {
    const caseId = (req.query.case_id as string) || 'case_01';
    try {
      const data = await runPython(['--api-audit', caseId]);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/benchmark', async (req, res) => {
    try {
      const data = await runPython(['--api-benchmark']);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/synthetic', async (req, res) => {
    try {
      const data = await runPython(['--api-synthetic']);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/validate', async (req, res) => {
    try {
      const data = await runPython(['--api-validate']);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/generate-output', async (req, res) => {
    try {
      const data = await runPython(['--api-generate']);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/download-output', (req, res) => {
    const outputPath = path.resolve('output.csv');
    if (!fs.existsSync(outputPath)) {
      runPython(['--api-generate']).then(() => {
        res.download(outputPath, 'output.csv');
      }).catch((err) => {
        res.status(500).send(err.message);
      });
    } else {
      res.download(outputPath, 'output.csv');
    }
  });

  // Serve static assets (style.css, script.js)
  app.get('/style.css', (req, res) => {
    res.sendFile(path.resolve('style.css'));
  });

  app.get('/script.js', (req, res) => {
    res.sendFile(path.resolve('script.js'));
  });

  // Mount Vite middlewares in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${port}`);
  });
}

startServer();
