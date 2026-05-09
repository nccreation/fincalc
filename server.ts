import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route for Market Data (Server-side proxy to bypass CORS)
  app.get("/api/markets", async (req, res) => {
    try {
      // Symbols: Gold (COMEX), Crude Oil (WTI), BTC, ETH
      const symbols = ['GC=F', 'CL=F', 'BTC-USD', 'ETH-USD'];
      
      const fetchSymbol = async (symbol: string) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
          const data = (await response.json()) as any;
          const result = data.chart.result[0];
          const price = result.meta.regularMarketPrice;
          const prevClose = result.meta.previousClose;
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;
          
          return {
            symbol,
            price,
            change: changePercent.toFixed(2),
            up: changePercent >= 0
          };
        } catch (e) {
          console.error(`Error fetching ${symbol}:`, e);
          return null;
        }
      };

      const results = await Promise.all(symbols.map(fetchSymbol));
      
      // Filter out nulls and format for the frontend
      const marketData = results.reduce((acc: any, curr) => {
        if (curr) acc[curr.symbol] = curr;
        return acc;
      }, {});

      res.json({
        success: true,
        data: marketData,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
