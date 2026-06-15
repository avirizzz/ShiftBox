require('dotenv').config();
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let supabaseUrl = process.env.SUPABASE_URL || '';
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.replace('/rest/v1/', '');
}
const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Auth error' });
  }
};

const requireAuthQuery = async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).send('Unauthorized');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).send('Invalid token');
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).send('Auth error');
  }
};

const getBoxIfOwned = async (boxId, userId) => {
  const { data: box } = await supabase.from('boxes')
    .select('*, categories!inner(projects!inner(user_id))')
    .eq('id', boxId).single();
  if (box && box.categories.projects.user_id === userId) {
    const result = { ...box };
    delete result.categories;
    return result;
  }
  return null;
};

app.get('/api/projects', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/projects', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabase.from('projects').insert([{
    user_id: req.user.id,
    name,
    description: description || ''
  }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  const { data, error } = await supabase.from('projects')
    .update({ name, description })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('projects')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/categories', requireAuth, async (req, res) => {
  const { projectId } = req.query;
  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', req.user.id);
  const projectIds = userProjects.map(p => p.id);
  if (projectIds.length === 0) return res.json([]);

  let query = supabase.from('categories').select('*').in('project_id', projectIds);
  if (projectId) {
    if (!projectIds.includes(projectId)) return res.status(403).json({ error: 'Forbidden' });
    query = query.eq('project_id', projectId);
  }

  const { data: categories, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const catIds = categories.map(c => c.id);
  let boxes = [];
  if (catIds.length > 0) {
    const { data: allBoxes } = await supabase.from('boxes').select('category_id, status').in('category_id', catIds);
    if (allBoxes) boxes = allBoxes;
  }

  const enriched = categories.map(cat => {
    const catBoxes = boxes.filter(b => b.category_id === cat.id);
    return {
      ...cat,
      total_boxes: catBoxes.length,
      packed: catBoxes.filter(b => b.status === 'Packed').length,
      loaded: catBoxes.filter(b => b.status === 'Loaded').length,
      unloaded: catBoxes.filter(b => b.status === 'Unloaded').length,
      verified: catBoxes.filter(b => b.status === 'Verified').length,
      planned: catBoxes.filter(b => b.status === 'Planned').length,
    };
  });
  res.json(enriched);
});

app.post('/api/categories', requireAuth, async (req, res) => {
  const { name, color, description, project_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  let targetProjectId = project_id;
  if (!targetProjectId) {
    const { data: firstProject } = await supabase.from('projects').select('id').eq('user_id', req.user.id).limit(1).single();
    if (firstProject) targetProjectId = firstProject.id;
    else return res.status(400).json({ error: 'No project exists' });
  }

  const { data: proj } = await supabase.from('projects').select('id').eq('id', targetProjectId).eq('user_id', req.user.id).single();
  if (!proj) return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabase.from('categories').insert([{
    project_id: targetProjectId,
    name,
    color: color || '#6c757d',
    description: description || ''
  }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  const { data: cat } = await supabase.from('categories').select('*, projects!inner(user_id)').eq('id', req.params.id).single();
  if (!cat || cat.projects.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { name, color, description } = req.body;
  const { data, error } = await supabase.from('categories').update({
    name: name || cat.name,
    color: color || cat.color,
    description: description !== undefined ? description : cat.description
  }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  const { data: cat } = await supabase.from('categories').select('*, projects!inner(user_id)').eq('id', req.params.id).single();
  if (!cat || cat.projects.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/boxes', requireAuth, async (req, res) => {
  const { categoryId, status, search } = req.query;
  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', req.user.id);
  const projectIds = userProjects.map(p => p.id);
  if (projectIds.length === 0) return res.json([]);

  const { data: categories } = await supabase.from('categories').select('id, name, color').in('project_id', projectIds);
  const catIds = categories.map(c => c.id);
  if (catIds.length === 0) return res.json([]);

  let query = supabase.from('boxes').select('*').in('category_id', catIds);
  if (categoryId) {
    if (!catIds.includes(categoryId)) return res.status(403).json({ error: 'Forbidden' });
    query = query.eq('category_id', categoryId);
  }
  if (status) query = query.eq('status', status);

  const { data: boxes, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  let enriched = boxes.map(b => {
    const cat = categories.find(c => c.id === b.category_id);
    let box = { ...b, category_name: cat?.name || 'Unknown', category_color: cat?.color || '#666' };
    if (box.image_url) box.image_data = box.image_url;
    return box;
  });

  if (search) {
    const s = search.toLowerCase();
    enriched = enriched.filter(b =>
      b.box_number.toLowerCase().includes(s) ||
      (b.notes && b.notes.toLowerCase().includes(s))
    );
  }
  res.json(enriched);
});

app.get('/api/boxes/:id', requireAuth, async (req, res) => {
  const box = await getBoxIfOwned(req.params.id, req.user.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });

  const { data: cat } = await supabase.from('categories').select('name, color').eq('id', box.category_id).single();
  const { data: history } = await supabase.from('box_status_history').select('*').eq('box_id', box.id).order('changed_at', { ascending: false });
  const { data: scans } = await supabase.from('scan_events').select('*').eq('box_id', box.id).order('scanned_at', { ascending: false });

  if (box.image_url) box.image_data = box.image_url;

  res.json({
    ...box,
    category_name: cat?.name || 'Unknown',
    category_color: cat?.color || '#666',
    status_history: history || [],
    scan_history: scans || []
  });
});

app.post('/api/boxes/generate', requireAuth, async (req, res) => {
  const { categoryId, count } = req.body;
  const numCount = parseInt(count) || 12;

  const { data: cat } = await supabase.from('categories').select('*, projects!inner(user_id)').eq('id', categoryId).single();
  if (!cat || cat.projects.user_id !== req.user.id) return res.status(404).json({ error: 'Category not found' });

  const { data: existingBoxes } = await supabase.from('boxes').select('id').eq('category_id', categoryId);
  const startIndex = (existingBoxes ? existingBoxes.length : 0) + 1;

  const newBoxes = [];
  for (let i = 0; i < numCount; i++) {
    const num = (startIndex + i).toString().padStart(2, '0');
    const boxCode = `${cat.name}-${num}`;
    const boxId = uuidv4();
    const qrPayload = `${FRONTEND_URL}/app/box/${boxId}`;

    newBoxes.push({
      id: boxId,
      category_id: cat.id,
      box_number: boxCode,
      qr_payload: qrPayload,
      status: 'Planned',
      notes: ''
    });
  }

  const { data, error } = await supabase.from('boxes').insert(newBoxes).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.post('/api/items', requireAuth, async (req, res) => {
  const { categoryId, itemName } = req.body;
  if (!itemName) return res.status(400).json({ error: 'Item name is required' });

  const { data: cat } = await supabase.from('categories').select('*, projects!inner(user_id)').eq('id', categoryId).single();
  if (!cat || cat.projects.user_id !== req.user.id) return res.status(404).json({ error: 'Category not found' });

  const itemId = uuidv4();
  const qrPayload = `${FRONTEND_URL}/app/box/${itemId}`;

  const { data, error } = await supabase.from('boxes').insert([{
    id: itemId,
    category_id: cat.id,
    box_number: itemName,
    qr_payload: qrPayload,
    status: 'Planned',
    notes: '',
    is_standalone: true
  }]).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch('/api/boxes/:id', requireAuth, async (req, res) => {
  const box = await getBoxIfOwned(req.params.id, req.user.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });

  const { status, notes, image_data, total_items } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  let statusChanged = false;

  if (status && status !== box.status) {
    updates.status = status;
    statusChanged = true;
  }
  if (notes !== undefined) updates.notes = notes;
  if (total_items !== undefined) updates.total_items = total_items;

  if (image_data !== undefined && typeof image_data === 'string' && image_data.startsWith('data:image')) {
    try {
      const uploadRes = await cloudinary.uploader.upload(image_data, {
        folder: 'shiftbox',
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
      });
      updates.image_url = uploadRes.secure_url;
    } catch (err) {
      console.error('Cloudinary error:', err);
      return res.status(500).json({ error: 'Image upload failed' });
    }
  }

  const { data: updatedBox, error } = await supabase.from('boxes').update(updates).eq('id', box.id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  if (statusChanged) {
    await supabase.from('box_status_history').insert([{
      box_id: box.id,
      old_status: box.status,
      new_status: status
    }]);
  }

  const { data: cat } = await supabase.from('categories').select('name, color').eq('id', box.category_id).single();
  const finalBox = { ...updatedBox, category_name: cat?.name, category_color: cat?.color };
  if (finalBox.image_url) finalBox.image_data = finalBox.image_url;

  res.json(finalBox);
});

app.delete('/api/boxes/bulk', requireAuth, async (req, res) => {
  const { boxIds } = req.body;
  if (!boxIds || !Array.isArray(boxIds)) return res.status(400).json({ error: 'boxIds array required' });

  const { data: boxes } = await supabase.from('boxes').select('id, categories!inner(projects!inner(user_id))').in('id', boxIds);
  const ownedBoxIds = boxes.filter(b => b.categories.projects.user_id === req.user.id).map(b => b.id);

  if (ownedBoxIds.length > 0) {
    await supabase.from('boxes').delete().in('id', ownedBoxIds);
  }
  res.json({ deleted: ownedBoxIds.length });
});

app.post('/api/scan', requireAuth, async (req, res) => {
  const { boxId } = req.body;
  const box = await getBoxIfOwned(boxId, req.user.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });

  const { data: scanEvent, error } = await supabase.from('scan_events').insert([{
    box_id: box.id
  }]).select().single();

  const { data: cat } = await supabase.from('categories').select('name, color').eq('id', box.category_id).single();
  if (box.image_url) box.image_data = box.image_url;

  res.json({
    ...box,
    category_name: cat?.name,
    category_color: cat?.color,
    scan_event: scanEvent
  });
});

app.get('/api/stats', requireAuth, async (req, res) => {
  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', req.user.id);
  const projectIds = userProjects.map(p => p.id);
  if (projectIds.length === 0) {
    return res.json({ totalCategories: 0, totalBoxes: 0, planned: 0, packed: 0, loaded: 0, unloaded: 0, verified: 0, categoryStats: [], recentScans: [] });
  }

  const { data: categories } = await supabase.from('categories').select('*').in('project_id', projectIds);
  const catIds = categories.map(c => c.id);

  let boxes = [];
  let scanEvents = [];
  if (catIds.length > 0) {
    const { data: allBoxes } = await supabase.from('boxes').select('*').in('category_id', catIds);
    if (allBoxes) boxes = allBoxes;

    const boxIds = boxes.map(b => b.id);
    if (boxIds.length > 0) {
      const { data: scans } = await supabase.from('scan_events').select('*').in('box_id', boxIds).order('scanned_at', { ascending: false }).limit(10);
      if (scans) scanEvents = scans;
    }
  }

  const totalBoxes = boxes.length;
  const planned = boxes.filter(b => b.status === 'Planned').length;
  const packed = boxes.filter(b => b.status === 'Packed').length;
  const loaded = boxes.filter(b => b.status === 'Loaded').length;
  const unloaded = boxes.filter(b => b.status === 'Unloaded').length;
  const verified = boxes.filter(b => b.status === 'Verified').length;

  const categoryStats = categories.map(cat => {
    const catBoxes = boxes.filter(b => b.category_id === cat.id);
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      total: catBoxes.length,
      planned: catBoxes.filter(b => b.status === 'Planned').length,
      packed: catBoxes.filter(b => b.status === 'Packed').length,
      loaded: catBoxes.filter(b => b.status === 'Loaded').length,
      unloaded: catBoxes.filter(b => b.status === 'Unloaded').length,
      verified: catBoxes.filter(b => b.status === 'Verified').length,
    };
  });

  const recentScans = scanEvents.map(scan => {
    const box = boxes.find(b => b.id === scan.box_id);
    const cat = box ? categories.find(c => c.id === box.category_id) : null;
    return {
      ...scan,
      box_number: box?.box_number,
      box_status: box?.status,
      category_name: cat?.name
    };
  });

  res.json({
    totalCategories: categories.length,
    totalBoxes,
    planned, packed, loaded, unloaded, verified,
    categoryStats,
    recentScans
  });
});

app.get('/api/qr/:boxId', requireAuth, async (req, res) => {
  const box = await getBoxIfOwned(req.params.boxId, req.user.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  try {
    const dataUrl = await QRCode.toDataURL(box.qr_payload, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    res.json({ qr: dataUrl, box_number: box.box_number, payload: box.qr_payload });
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

app.get('/api/pdf/labels/:categoryId', requireAuthQuery, async (req, res) => {
  const { data: cat } = await supabase.from('categories').select('*, projects!inner(user_id)').eq('id', req.params.categoryId).single();
  if (!cat || cat.projects.user_id !== req.user.id) return res.status(404).send('Category not found');

  const { data: boxes } = await supabase.from('boxes').select('*').eq('category_id', cat.id);
  if (!boxes || boxes.length === 0) return res.status(400).send('No boxes in this category');

  const doc = new PDFDocument({ size: 'A4', margin: 30 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${cat.name}-labels.pdf"`);
  doc.pipe(res);

  const cols = 3, rows = 4, labelsPerPage = cols * rows;
  const labelW = 170, labelH = 170, gapX = 12, gapY = 12, marginX = 30, qrSize = 100;

  for (let i = 0; i < boxes.length; i++) {
    const pageIdx = i % labelsPerPage;
    if (i > 0 && pageIdx === 0) doc.addPage();
    if (pageIdx === 0) doc.fontSize(14).font('Helvetica-Bold').text(`${cat.name} — QR Labels`, marginX, 20, { align: 'center', width: 535 });

    const col = pageIdx % cols, row = Math.floor(pageIdx / cols);
    const x = marginX + col * (labelW + gapX), y = 50 + row * (labelH + gapY);

    doc.roundedRect(x, y, labelW, labelH, 6).stroke('#cccccc');

    try {
      const qrDataUrl = await QRCode.toDataURL(boxes[i].qr_payload, { width: qrSize * 2, margin: 1 });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, x + (labelW - qrSize) / 2, y + 8, { width: qrSize, height: qrSize });
    } catch (e) {}

    doc.fontSize(12).font('Helvetica-Bold').text(boxes[i].box_number, x, y + qrSize + 15, { width: labelW, align: 'center' });
    doc.fontSize(8).font('Helvetica').text(cat.name, x, y + qrSize + 32, { width: labelW, align: 'center' });
  }
  doc.end();
});

app.get('/api/pdf/summary', requireAuthQuery, async (req, res) => {
  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', req.user.id);
  const projectIds = userProjects.map(p => p.id);
  const { data: categories } = await supabase.from('categories').select('*').in('project_id', projectIds);
  const catIds = categories ? categories.map(c => c.id) : [];
  const { data: boxes } = await supabase.from('boxes').select('*').in('category_id', catIds);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="ShiftBox-Summary.pdf"');
  doc.pipe(res);

  doc.fontSize(24).text('ShiftBox Summary Report', { align: 'center' });
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  const total = boxes ? boxes.length : 0;
  const statuses = ['Planned', 'Packed', 'Loaded', 'Unloaded', 'Verified'];
  doc.fontSize(16).text('Overall Statistics');
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Boxes: ${total}`);
  if (boxes) {
    statuses.forEach(s => {
      const count = boxes.filter(b => b.status === s).length;
      doc.text(`  ${s}: ${count}`);
    });
  }
  doc.moveDown(1);

  doc.fontSize(16).text('Category Breakdown');
  doc.moveDown(0.5);
  if (categories && boxes) {
    categories.forEach(cat => {
      const catBoxes = boxes.filter(b => b.category_id === cat.id);
      doc.fontSize(13).text(`${cat.name} (${catBoxes.length} boxes)`);
      statuses.forEach(s => {
        const count = catBoxes.filter(b => b.status === s).length;
        doc.fontSize(10).text(`    ${s}: ${count}`);
      });
      const withNotes = catBoxes.filter(b => b.notes);
      if (withNotes.length > 0) {
        doc.fontSize(10).text('    Notes:');
        withNotes.forEach(b => {
          doc.fontSize(9).text(`      ${b.box_number}: ${b.notes}`);
        });
      }
      doc.moveDown(0.5);
    });
  }

  doc.end();
});

app.get('/api/export/csv', requireAuthQuery, async (req, res) => {
  const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', req.user.id);
  const projectIds = userProjects.map(p => p.id);
  const { data: categories } = await supabase.from('categories').select('*').in('project_id', projectIds);
  const catIds = categories ? categories.map(c => c.id) : [];
  const { data: boxes } = await supabase.from('boxes').select('*').in('category_id', catIds);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ShiftBox-Export.csv"');

  const header = 'Box Code,Category,Status,Notes,Created At\n';
  const rows = boxes ? boxes.map(b => {
    const cat = categories.find(c => c.id === b.category_id);
    const notes = (b.notes || '').replace(/"/g, '""');
    return `"${b.box_number}","${cat?.name || ''}","${b.status}","${notes}","${b.created_at}"`;
  }).join('\n') : '';

  res.send(header + rows);
});

app.get('/api/history/:boxId', requireAuth, async (req, res) => {
  const box = await getBoxIfOwned(req.params.boxId, req.user.id);
  if (!box) return res.status(404).json({ error: 'Box not found' });

  const { data: history } = await supabase.from('box_status_history')
    .select('*').eq('box_id', box.id).order('changed_at', { ascending: false });
  res.json(history || []);
});

app.listen(PORT, () => {
  console.log(`🚀 ShiftBox Supabase API running on port ${PORT}`);
});
