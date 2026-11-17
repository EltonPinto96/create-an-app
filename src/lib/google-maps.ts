/**
 * Utilitários para Google Maps — KUSANGA KITADI
 * Nunca expõe coordenadas brutas ao utilizador.
 */

/**
 * Abre o Google Maps com as coordenadas indicadas.
 * Se `label` for fornecido, é usado como marcador.
 */
export function openInGoogleMaps(lat: number, lng: number, label?: string): void {
  const url = label
    ? `https://maps.google.com/maps?q=${encodeURIComponent(label)}&ll=${lat},${lng}`
    : `https://maps.google.com/maps?q=${lat},${lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Devolve URL para direcções até às coordenadas fornecidas.
 */
export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Abre direcções até às coordenadas indicadas.
 */
export function openDirections(lat: number, lng: number): void {
  window.open(getDirectionsUrl(lat, lng), "_blank", "noopener,noreferrer");
}

/**
 * Devolve URL para imagem estática do Google Maps.
 * Requer uma chave de API válida.
 */
export function getStaticMapUrl(
  lat: number,
  lng: number,
  apiKey: string,
  zoom = 15,
  width = 400,
  height = 200,
): string {
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&markers=color:red%7C${lat},${lng}` +
    `&key=${apiKey}`
  );
}

/**
 * Constrói URL do Google Maps a partir de coordenadas (fallback quando maps_url não está disponível).
 */
export function buildMapsUrl(lat: number, lng: number, label?: string): string {
  if (label) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(label)}&ll=${lat},${lng}`;
  }
  return `https://maps.google.com/maps?q=${lat},${lng}`;
}
