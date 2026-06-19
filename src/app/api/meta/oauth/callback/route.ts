import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCode, toLongLived, getUserPages, getAdAccounts,
  saveOwnerMetaConnection, getOwnerClient, publicOrigin,
} from '@/lib/meta/oauth';

export const dynamic = 'force-dynamic';

const KNOWN_PAGE_GERMAN_FERVOR = '1180025031855846';
const KNOWN_AD_ACCOUNT = 'act_618315713691591';

function redirect(loc: string) {
  return new Response(null, { status: 303, headers: { Location: loc } });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const fbError = req.nextUrl.searchParams.get('error');
  if (fbError) return redirect(`/config?meta_error=${encodeURIComponent(fbError)}`);
  if (!code) return redirect('/config?meta_error=missing_code');

  const cookieState = req.cookies.get('meta_oauth_state')?.value;
  if (!cookieState || cookieState !== state) return redirect('/config?meta_error=bad_state');

  try {
    const origin = publicOrigin(req);
    const shortTok = await exchangeCode(code, origin);
    const longTok = await toLongLived(shortTok);

    // Owner client (FERVOR esPropio)
    const owner = await getOwnerClient();
    if (!owner) return redirect('/config?meta_error=no_owner_client');

    // Páginas del usuario — Page Access Tokens vienen long-lived ya que user token es long-lived
    const pages = await getUserPages(longTok);
    const target =
      pages.find((p) => p.id === KNOWN_PAGE_GERMAN_FERVOR) ||
      pages.find((p) => p.name.toLowerCase().includes('german.fervor') || p.name.toLowerCase().includes('germán')) ||
      pages[0];
    if (!target) return redirect('/config?meta_error=no_pages');

    // Ad account (preferimos el conocido, sino el primero)
    let adAccountId: string | undefined;
    try {
      const adAccs = await getAdAccounts(longTok);
      const acc = adAccs.find((a) => a.id === KNOWN_AD_ACCOUNT) || adAccs[0];
      adAccountId = acc?.id;
    } catch {
      adAccountId = KNOWN_AD_ACCOUNT;
    }

    await saveOwnerMetaConnection({
      clientId: owner.id,
      pageId: target.id,
      pageAccessToken: target.access_token,
      igBusinessId: target.instagram_business_account?.id,
      adAccountId,
    });

    const res = redirect('/config?meta=ok');
    // limpia state cookie
    res.headers.append('Set-Cookie', 'meta_oauth_state=; Path=/; Max-Age=0');
    return res;
  } catch (e: any) {
    console.error('meta oauth callback fail:', e?.message || e);
    return redirect(`/config?meta_error=${encodeURIComponent(e?.message || 'unknown').slice(0, 200)}`);
  }
}
