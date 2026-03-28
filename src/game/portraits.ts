// Boss portrait imports and mapping
import portraitAethon from '../assets/portrait-aethon.png';
import portraitMalachar from '../assets/portrait-malachar.png';
import portraitIgnis from '../assets/portrait-ignis.jpg';
import portraitGlacius from '../assets/portrait-glacius.jpg';
import portraitVoltaris from '../assets/portrait-voltaris.jpg';
import portraitUmbra from '../assets/portrait-umbra.jpg';
import portraitTerrath from '../assets/portrait-terrath.jpg';
import portraitZephyros from '../assets/portrait-zephyros.jpg';
import portraitSylvara from '../assets/portrait-sylvara.jpg';
import portraitNullex from '../assets/portrait-nullex.jpg';

export const PORTRAITS: Record<string, string> = {
  aethon: portraitAethon,
  malachar: portraitMalachar,
  ignis: portraitIgnis,
  glacius: portraitGlacius,
  voltaris: portraitVoltaris,
  umbra: portraitUmbra,
  terrath: portraitTerrath,
  zephyros: portraitZephyros,
  sylvara: portraitSylvara,
  nullex: portraitNullex,
};

export function getPortrait(speaker: string): string | null {
  const s = speaker.toLowerCase();
  if (s.includes('aethon') || s.includes('chronicler')) return PORTRAITS.aethon;
  if (s.includes('malachar') || s.includes('architect')) return PORTRAITS.malachar;
  if (s.includes('ignis') || s.includes('ember') || s.includes('kael')) return PORTRAITS.ignis;
  if (s.includes('glacius') || s.includes('frost') || s.includes('frostbane')) return PORTRAITS.glacius;
  if (s.includes('voltaris') || s.includes('thunder')) return PORTRAITS.voltaris;
  if (s.includes('umbra') || s.includes('voidmaw')) return PORTRAITS.umbra;
  if (s.includes('terrath') || s.includes('stone colossus')) return PORTRAITS.terrath;
  if (s.includes('zephyros') || s.includes('tempest')) return PORTRAITS.zephyros;
  if (s.includes('sylvara') || s.includes('thorn')) return PORTRAITS.sylvara;
  if (s.includes('nullex')) return PORTRAITS.nullex;
  return null;
}
