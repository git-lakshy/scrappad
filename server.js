const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for shared notes
const sharedNotes = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generate unique ID for shared notes
function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Save a note for sharing
app.post('/api/notes', (req, res) => {
  const { content, title } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const id = generateId();
  const note = {
    id,
    title: title || 'Untitled',
    content,
    createdAt: new Date().toISOString()
  };
  
  sharedNotes.set(id, note);
  
  res.json({ 
    success: true, 
    id,
    shareUrl: `/s/${id}`,
    apiUrl: `/api/notes/${id}`
  });
});

// API: Get a shared note
app.get('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const note = sharedNotes.get(id);
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  res.json(note);
});

// API: Delete a shared note
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  
  if (!sharedNotes.has(id)) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  sharedNotes.delete(id);
  res.json({ success: true });
});

// View shared note in browser
app.get('/s/:id', (req, res) => {
  const { id } = req.params;
  const note = sharedNotes.get(id);
  
  if (!note) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ERROR - NOT FOUND</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #FFF; color: #000;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px; line-height: 1.6;
            padding: 20px; max-width: 900px; margin: 0 auto;
          }
          .error { border: 2px solid #000; padding: 20px; }
          .error h1 { background: #000; color: #FFF; padding: 10px; }
          a { color: #00F; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>ERROR: NOTE NOT FOUND</h1>
          <p>The requested note could not be located.</p>
          may have been deleted <p>It or the link is incorrect.</p>
          <br>
          <p><a href="/">[RETURN TO NOTEPAD]</a></p>
        </div>
      </body>
      </html>
    `);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SHARED: ${note.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #FFF; color: #000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px; line-height: 1.6;
          padding: 20px; max-width: 900px; margin: 0 auto;
        }
        .header { background: #000; color: #FFF; padding: 10px; margin-bottom: 20px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        .content { white-space: pre-wrap; border: 2px solid #000; padding: 20px; min-height: 300px; }
        a { color: #00F; text-decoration: underline; }
        a:hover { background: #000; color: #FFF; }
      </style>
    </head>
    <body>
      <div class="header">
        <pre>
  ________  ___  ___  ___
 /_  __/ __|/ _ \\| __|/ _ \\
  / / / _ \\| (_) | _|| (_) |
 /_/ |____/ \\___/|_|  \\___/
        </pre>
        <p>=== SHARED NOTE ===</p>
      </div>
      <h2>${note.title}</h2>
      <div class="meta">
        CREATED: ${note.createdAt}
      </div>
      <div class="content">${note.content}</div>
      <br>
      <p><a href="/">[CREATE NEW NOTE]</a></p>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`
=====================================
  BRUTALIST NOTEPAD SERVER
=====================================
  Server running on http://localhost:${PORT}
  API Endpoints:
    POST /api/notes     - Save a note
    GET  /api/notes/:id - Get a note
    DELETE /api/notes/:id - Delete a note
    GET  /s/:id         - View shared note
=====================================
  `);
});
