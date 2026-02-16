const crypto = require('crypto');

// In-memory storage
const sharedNotes = new Map();

function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, url } = req;

  // POST /api/notes - Create a new shared note
  if (method === 'POST' && url === '/api/notes') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    await new Promise(resolve => req.on('end', resolve));
    
    const { content, title } = JSON.parse(body || '{}');
    
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
    
    return res.status(201).json({ 
      success: true, 
      id,
      shareUrl: `/s/${id}`,
      apiUrl: `/api/notes/${id}`
    });
  }

  // GET /api/notes/:id - Get a shared note
  const noteIdMatch = url && url.match(/^\/api\/notes\/(.+)$/);
  if (method === 'GET' && noteIdMatch) {
    const id = noteIdMatch[1];
    const note = sharedNotes.get(id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    return res.json(note);
  }

  // DELETE /api/notes/:id - Delete a shared note
  if (method === 'DELETE' && noteIdMatch) {
    const id = noteIdMatch[1];
    
    if (!sharedNotes.has(id)) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    sharedNotes.delete(id);
    return res.json({ success: true });
  }

  // 404 for other routes
  return res.status(404).json({ error: 'Not found' });
};
