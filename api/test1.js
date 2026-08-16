export default async function handler(req, res) {
  try {
    const authModule = await import('firebase-admin/auth');
    res.status(200).json({ ok: 1, type: typeof authModule.getAuth });
  } catch (err) {
    res.status(500).json({ error: String(err), stack: err.stack });
  }
}
