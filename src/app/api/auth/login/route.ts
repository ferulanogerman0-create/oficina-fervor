import { loginWithCredentials } from '@/lib/auth';

export const runtime = 'nodejs';

// Location relativo: el browser lo resuelve contra la URL pública (barra de
// direcciones), evitando el host interno del proxy (0.0.0.0:80) que rompía
// el redirect con ERR_FAILED.
function redirect(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  if (!username || !password) {
    return redirect('/login?error=missing');
  }
  const user = await loginWithCredentials(username, password);
  if (!user) {
    return redirect('/login?error=bad_creds');
  }
  return redirect('/');
}
