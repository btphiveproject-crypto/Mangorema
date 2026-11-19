/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY est manquante sur le serveur. Vérifiez votre panneau Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // =========================================================================
  // API ROUTE 1: Google Maps Grounding (gemini-4-hydrogen + googleMaps tool)
  // =========================================================================
  app.post('/api/grounding/maps', async (req: Request, res: Response) => {
    try {
      const { query, latitude, longitude, zoneName } = req.body as {
        query?: string;
        latitude?: number;
        longitude?: number;
        zoneName?: string;
      };

      if (!query || typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ error: 'Veuillez saisir une recherche géographique.' });
        return;
      }

      const ai = getGeminiClient();

      const lat = typeof latitude === 'number' && !Number.isNaN(latitude) ? latitude : 0.5833; // Défaut: Mondah
      const lng = typeof longitude === 'number' && !Number.isNaN(longitude) ? longitude : 9.35;

      const contextZone = zoneName ? ` dans ou autour de la zone "${zoneName}" au Gabon` : ' au Gabon';
      const prompt = `Tu es un assistant logistique et guide de terrain MANGOREMA au Gabon. Réponds en français de façon claire, structurée et pratique${contextZone}.\nQuestion de l'utilisateur : ${query.trim()}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng,
              },
            },
          },
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const places: Array<{
        title: string;
        uri: string;
        placeId?: string;
        reviewSnippets: string[];
      }> = [];

      for (const chunk of chunks as Array<{
        maps?: {
          title?: string;
          uri?: string;
          placeId?: string;
          placeAnswerSources?: {
            reviewSnippets?: Array<{ content?: string } | string>;
          };
        };
      }>) {
        if (chunk.maps && chunk.maps.uri) {
          const snippetsRaw = chunk.maps.placeAnswerSources?.reviewSnippets || [];
          const reviewSnippets = snippetsRaw
            .map((s) => (typeof s === 'string' ? s : s?.content || ''))
            .filter(Boolean);

          places.push({
            title: chunk.maps.title || 'Lieu Google Maps',
            uri: chunk.maps.uri,
            placeId: chunk.maps.placeId,
            reviewSnippets,
          });
        }
      }

      res.json({
        text: response.text || 'Aucun résultat trouvé sur Google Maps.',
        places,
        coordsUsed: { latitude: lat, longitude: lng },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la requête Google Maps Grounding.';
      console.error('[/api/grounding/maps] Error:', err);
      res.status(500).json({ error: message });
    }
  });

  // =========================================================================
  // API ROUTE 2: Google Search Grounding (gemini-4-hydrogen + googleSearch tool)
  // =========================================================================
  app.post('/api/grounding/search', async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body as {
        query?: string;
        context?: string;
      };

      if (!query || typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ error: 'Veuillez saisir une question de recherche.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Tu es un conseiller écotourisme et sécurité terrain pour MANGOREMA au Gabon (Parcs Nationaux ANPN, Libreville, Estuaire, Ivindo, Pongara, Monts de Cristal). Utilise la recherche Google pour fournir des informations fiables, à jour et vérifiables en français.\n${context ? `Contexte : ${context}\n` : ''}Requête : ${query.trim()}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: Array<{ title: string; uri: string }> = [];
      const seenUris = new Set<string>();

      for (const chunk of chunks as Array<{
        web?: { title?: string; uri?: string };
      }>) {
        if (chunk.web?.uri && !seenUris.has(chunk.web.uri)) {
          seenUris.add(chunk.web.uri);
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      }

      res.json({
        text: response.text || 'Aucune information actualisée trouvée.',
        sources,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la requête Google Search Grounding.';
      console.error('[/api/grounding/search] Error:', err);
      res.status(500).json({ error: message });
    }
  });

  // =========================================================================
  // Vite Middleware (Dev) or Static Assets (Prod)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MANGOREMA full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
