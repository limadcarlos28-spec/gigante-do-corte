import express from 'express';
import path from 'path';
import { apiRouter } from './apiRouter.ts';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiRouter);

// Servir arquivos estáticos do build
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`[Gigante do Corte] Servidor rodando na porta ${port}`);
});
