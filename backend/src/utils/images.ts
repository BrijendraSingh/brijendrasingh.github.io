const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateAvatarPayload(
  base64: string,
  contentType: string
): { bytes: Uint8Array; contentType: string } {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  }
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  if (bytes.length > MAX_AVATAR_BYTES) {
    throw new Error('Image must be 2 MB or smaller.');
  }
  return { bytes, contentType };
}

export async function uploadAvatarToCloudflare(
  bytes: Uint8Array,
  contentType: string
): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '6fdc4d7409114fdb5871a695028f4f30';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!apiToken) {
    throw new Error('Image upload is not configured. Use a custom avatar URL instead.');
  }
  const form = new FormData();
  form.append(
    'file',
    new Blob([bytes], { type: contentType }),
    `avatar.${contentType.split('/')[1] || 'jpg'}`
  );
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
    }
  );
  const json = (await res.json()) as {
    success?: boolean;
    result?: { variants?: string[]; id?: string };
    errors?: Array<{ message: string }>;
  };
  if (!res.ok || !json.success || !json.result?.variants?.[0]) {
    const msg = json.errors?.[0]?.message || 'Image upload failed.';
    throw new Error(msg);
  }
  return json.result.variants[0]!;
}
