/**
 * Lista de correo de Clasifica: recibe el email del modal (src/platform/newsletter.ts) y lo
 * agrega a la lista de Brevo. La clave de la API nunca llega al navegador: vive en las
 * variables de entorno de Netlify.
 *
 * - BREVO_API_KEY: Brevo → SMTP & API → API Keys
 * - BREVO_LIST_ID: número de la lista en Brevo → Contacts → Lists
 *
 * Si en Brevo existen los atributos de contacto `LANG` y `SOURCE` (texto), se rellenan con el
 * idioma del jugador y "clasifica"; si no existen, el contacto se guarda igual sin ellos.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANGS = new Set(['en', 'es', 'pt']);

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function addContact(apiKey: string, listId: number, email: string, attributes?: Record<string, string>) {
  return fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    // updateEnabled: si el email ya existía, se actualiza y se agrega a la lista en vez de fallar.
    body: JSON.stringify({ email, listIds: [listId], updateEnabled: true, ...(attributes && { attributes }) }),
  });
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
    console.error('[subscribe] Faltan BREVO_API_KEY o BREVO_LIST_ID');
    return json(500, { error: 'not_configured' });
  }

  let data: { email?: unknown; lang?: unknown };
  try {
    data = await req.json();
  } catch {
    return json(400, { error: 'bad_request' });
  }
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) return json(400, { error: 'invalid_email' });
  const lang = typeof data.lang === 'string' && LANGS.has(data.lang) ? data.lang : 'en';

  let res = await addContact(apiKey, listId, email, { LANG: lang, SOURCE: 'clasifica' });
  // Si los atributos no existen en la cuenta de Brevo, se guarda el contacto sin ellos.
  if (res.status === 400) res = await addContact(apiKey, listId, email);

  if (res.ok) return json(200, { ok: true });
  console.error('[subscribe] Brevo respondió', res.status, await res.text().catch(() => ''));
  return json(502, { error: 'provider_error' });
};

export const config = { path: '/api/subscribe' };
