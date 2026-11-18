export type CategoryId =
  | 'all'
  | 'loy-krathong'
  | 'temple'
  | 'culture'
  | 'concert'
  | 'car-audio'
  | 'nature'
  | 'school'
  | 'hospital';

export type ParticleType =
  | 'auto'
  | 'lanterns'
  | 'sparkles'
  | 'laser'
  | 'bass'
  | 'leaves'
  | 'bokeh'
  | 'none';

export type SceneStyle =
  | 'krathong'
  | 'temple'
  | 'culture'
  | 'concert'
  | 'caraudio'
  | 'nature'
  | 'school'
  | 'hospital';

export interface CategoryItem {
  id: CategoryId;
  name: string;
  icon: string;
}

export interface ScenePreset {
  id: string;
  cat: Exclude<CategoryId, 'all'>;
  name: string;
  sub: string;
  primary: string;
  secondary: string;
  accent: string;
  particle: Exclude<ParticleType, 'auto' | 'none'>;
  style: SceneStyle;
}

export interface KeywordGroup {
  title: string;
  keywords: string[];
}

export interface StudioState {
  activeCat: CategoryId;
  sceneId: string;
  sourceMode: 'procedural' | 'image';
  customImageUrl: string;
  primary: string;
  secondary: string;
  accent: string;
  brightness: number;
  saturate: number;
  blur: number;
  dim: number;
  vignette: number;
  particle: ParticleType;
  speed: number;
  density: number;
  pulse: boolean;
  showText: boolean;
  title: string;
  subtitle: string;
  textPos: 'top' | 'center' | 'bottom';
  fontSize: number;
  width: number;
  height: number;
  safeZone: boolean;
}

export interface SavedPreset {
  presetName: string;
  data: StudioState;
}

export const DEFAULT_STATE: StudioState = {
  activeCat: 'all',
  sceneId: 'lk-1',
  sourceMode: 'procedural',
  customImageUrl: '',
  primary: '#070b24',
  secondary: '#1a1438',
  accent: '#ffb703',
  brightness: 100,
  saturate: 105,
  blur: 0,
  dim: 15,
  vignette: 45,
  particle: 'auto',
  speed: 1.0,
  density: 60,
  pulse: false,
  showText: false,
  title: 'เกมสนุก TikTok LIVE',
  subtitle: 'กดหัวใจ หรือส่งของขวัญเพื่อร่วมสนุก!',
  textPos: 'top',
  fontSize: 64,
  width: 1080,
  height: 1920,
  safeZone: false,
};

export const CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'ทั้งหมด', icon: '✨' },
  { id: 'loy-krathong', name: 'ลอยกระทง', icon: '🏮' },
  { id: 'temple', name: 'วัด/พระพุทธรูป', icon: '🛕' },
  { id: 'culture', name: 'ประเพณีไทย', icon: '🎭' },
  { id: 'concert', name: 'คอนเสิร์ต/ดนตรี', icon: '🎸' },
  { id: 'car-audio', name: 'เครื่องเสียงรถ', icon: '🔊' },
  { id: 'nature', name: 'ธรรมชาติ', icon: '🌿' },
  { id: 'school', name: 'โรงเรียน', icon: '🏫' },
  { id: 'hospital', name: 'โรงพยาบาล', icon: '🏥' },
];

export const SCENES: ScenePreset[] = [
  // 1. ลอยกระทง (7)
  { id: 'lk-1', cat: 'loy-krathong', name: 'ยี่เป็งโคมลอยนับพัน', sub: 'ฟ้าน้ำเงินเข้ม โคมทองลอยเต็มฟ้า', primary: '#070b24', secondary: '#1a1438', accent: '#ffb703', particle: 'lanterns', style: 'krathong' },
  { id: 'lk-2', cat: 'loy-krathong', name: 'แม่น้ำกระทงแสงเทียน', sub: 'ผิวน้ำสะท้อนแสงเทียนอบอุ่น', primary: '#08152b', secondary: '#050c1a', accent: '#ffd166', particle: 'lanterns', style: 'krathong' },
  { id: 'lk-3', cat: 'loy-krathong', name: 'คืนเพ็ญเดือนสิบสอง', sub: 'จันทร์เต็มดวงสีทองอร่าม', primary: '#0c1638', secondary: '#1c2541', accent: '#ffe082', particle: 'sparkles', style: 'krathong' },
  { id: 'lk-4', cat: 'loy-krathong', name: 'บัวชมพูริมสายน้ำ', sub: 'โทนชมพู-ม่วง โรแมนติก', primary: '#1e0b2e', secondary: '#0f1636', accent: '#ff7eb6', particle: 'lanterns', style: 'krathong' },
  { id: 'lk-5', cat: 'loy-krathong', name: 'งานวัดริมน้ำโบราณ', sub: 'ไฟราวสลับสีริมท่าน้ำ', primary: '#141229', secondary: '#0b1c2c', accent: '#ff9f1c', particle: 'bokeh', style: 'krathong' },
  { id: 'lk-6', cat: 'loy-krathong', name: 'โคมล้านนามรกต', sub: 'โทนเขียวมรกต-ทองหรูหรา', primary: '#041f1e', secondary: '#081221', accent: '#2ec4b6', particle: 'lanterns', style: 'krathong' },
  { id: 'lk-7', cat: 'loy-krathong', name: 'อธิษฐานกลางสายชล', sub: 'แสงดาวระยิบและระลอกน้ำ', primary: '#030816', secondary: '#0c2340', accent: '#ffd86b', particle: 'sparkles', style: 'krathong' },

  // 2. วัด / พระพุทธรูป (6)
  { id: 'tp-1', cat: 'temple', name: 'วิหารทองยามอัสดง', sub: 'รัศมีสีทอง สงบ สง่างาม', primary: '#2b1306', secondary: '#120804', accent: '#ffd166', particle: 'sparkles', style: 'temple' },
  { id: 'tp-2', cat: 'temple', name: 'พระพุทธรูปเรืองรอง', sub: 'แสงธรรมสว่างไสวกลางฉาก', primary: '#1f1203', secondary: '#0c0702', accent: '#ffbe0b', particle: 'sparkles', style: 'temple' },
  { id: 'tp-3', cat: 'temple', name: 'อยุธยาโบราณสถาน', sub: 'เจดีย์เก่าแก่ยามอาทิตย์ตก', primary: '#3d1c10', secondary: '#190c0a', accent: '#f4a261', particle: 'bokeh', style: 'temple' },
  { id: 'tp-4', cat: 'temple', name: 'หมอกเช้าหน้าอุโบสถ', sub: 'โทนฟ้าทองยามรุ่งอรุณ', primary: '#14213d', secondary: '#2b2d42', accent: '#fca311', particle: 'sparkles', style: 'temple' },
  { id: 'tp-5', cat: 'temple', name: 'เทียนพรรษาแสงศรัทธา', sub: 'อบอุ่นด้วยเปลวเทียนสีอำพัน', primary: '#1a0c05', secondary: '#0a0402', accent: '#ff9e00', particle: 'lanterns', style: 'temple' },
  { id: 'tp-6', cat: 'temple', name: 'เจดีย์ขาวดอยสูง', sub: 'โทนขาว-ทอง สะอาดตา', primary: '#1b263b', secondary: '#415a77', accent: '#ffd700', particle: 'bokeh', style: 'temple' },

  // 3. ประเพณีไทย (6)
  { id: 'cu-1', cat: 'culture', name: 'สงกรานต์สาดน้ำสดใส', sub: 'ฟ้าใส ละอองน้ำชุ่มฉ่ำ', primary: '#0077b6', secondary: '#023e8a', accent: '#90e0ef', particle: 'bokeh', style: 'culture' },
  { id: 'cu-2', cat: 'culture', name: 'ลายกนกทองมงคล', sub: 'แดงชาดตัดลายทองไทย', primary: '#4a0404', secondary: '#1f0202', accent: '#ffd166', particle: 'sparkles', style: 'culture' },
  { id: 'cu-3', cat: 'culture', name: 'งานวัดไฟราวหรรษา', sub: 'สีสันสดใสบรรยากาศรื่นเริง', primary: '#240046', secondary: '#10002b', accent: '#ff9e00', particle: 'bokeh', style: 'culture' },
  { id: 'cu-4', cat: 'culture', name: 'ผ้าไหมไทยสีคราม', sub: 'ครามเข้มหรูหราแบบร่วมสมัย', primary: '#0b1d51', secondary: '#060d26', accent: '#f7b801', particle: 'sparkles', style: 'culture' },
  { id: 'cu-5', cat: 'culture', name: 'ขบวนแห่กลองยาว', sub: 'ส้มทองพลังแห่งความสนุก', primary: '#3d0c02', secondary: '#1c0502', accent: '#ff5400', particle: 'sparkles', style: 'culture' },
  { id: 'cu-6', cat: 'culture', name: 'ตลาดน้ำยามเช้า', sub: 'เขียวมรกต-เหลืองแดดอ่อน', primary: '#083d3b', secondary: '#0b2027', accent: '#f4d35e', particle: 'leaves', style: 'culture' },

  // 4. คอนเสิร์ต / ดนตรี (7)
  { id: 'co-1', cat: 'concert', name: 'เวทีเลเซอร์นีออน', sub: 'ลำแสงเลเซอร์ชมพู-ฟ้าไซเบอร์', primary: '#090014', secondary: '#14002b', accent: '#ff007f', particle: 'laser', style: 'concert' },
  { id: 'co-2', cat: 'concert', name: 'หมอลำซิ่งไฟระยิบ', sub: 'ม่วง-ทอง สปอตไลต์จัดเต็ม', primary: '#2b023b', secondary: '#0c0117', accent: '#00f5d4', particle: 'laser', style: 'concert' },
  { id: 'co-3', cat: 'concert', name: 'ร็อกสเตจไฟลุก', sub: 'แดง-ส้ม ดุดันเร้าใจ', primary: '#240000', secondary: '#0a0000', accent: '#ff3b30', particle: 'sparkles', style: 'concert' },
  { id: 'co-4', cat: 'concert', name: 'EDM Festival กลางคืน', sub: 'ฟ้าน้ำเงิน-ไซอัน อีควอไลเซอร์', primary: '#020b1f', secondary: '#041c42', accent: '#00f2ea', particle: 'laser', style: 'concert' },
  { id: 'co-5', cat: 'concert', name: 'อะคูสติกอบอุ่น', sub: 'ไฟวอร์มไวท์สไตล์คาเฟ่', primary: '#1c120c', secondary: '#0d0805', accent: '#ffb703', particle: 'bokeh', style: 'concert' },
  { id: 'co-6', cat: 'concert', name: 'ลูกทุ่งเวทีทอง', sub: 'ทองอร่ามไฟฟลัดไลต์', primary: '#1e1600', secondary: '#0d0900', accent: '#ffd60a', particle: 'sparkles', style: 'concert' },
  { id: 'co-7', cat: 'concert', name: 'K-Pop Stage Pastel', sub: 'ม่วงพาสเทล-ชมพูนีออน', primary: '#1f0c36', secondary: '#120824', accent: '#ff70a6', particle: 'laser', style: 'concert' },

  // 5. เครื่องเสียงรถ / รถแต่ง (6)
  { id: 'ca-1', cat: 'car-audio', name: 'ตู้ซับวูฟเฟอร์นีออน', sub: 'ลำโพงคู่กลาง-ล่าง สั่นตามเบส', primary: '#050814', secondary: '#0b1026', accent: '#00e5ff', particle: 'bass', style: 'caraudio' },
  { id: 'ca-2', cat: 'car-audio', name: 'กระบะเครื่องเสียง RGB', sub: 'ไฟ LED ม่วง-ชมพูสุดจัด', primary: '#120424', secondary: '#070212', accent: '#ff2a85', particle: 'bass', style: 'caraudio' },
  { id: 'ca-3', cat: 'car-audio', name: 'เบสหนักสายแข่ง SPL', sub: 'แดง-ดำ ดุดันทรงพลัง', primary: '#1a0305', secondary: '#080102', accent: '#ff1e42', particle: 'bass', style: 'caraudio' },
  { id: 'ca-4', cat: 'car-audio', name: 'โชว์เครื่องเสียงกลางคืน', sub: 'เขียวมะนาว-ดำ สไตล์รถซิ่ง', primary: '#04140a', secondary: '#020804', accent: '#39ff14', particle: 'bass', style: 'caraudio' },
  { id: 'ca-5', cat: 'car-audio', name: 'สเปกตรัมเสียงทองคำ', sub: 'หรูหราสไตล์ VIP Car Audio', primary: '#12100a', secondary: '#080704', accent: '#ffc300', particle: 'bass', style: 'caraudio' },
  { id: 'ca-6', cat: 'car-audio', name: 'ไซเบอร์ซับวูฟเฟอร์', sub: 'น้ำเงินไฟฟ้า-ส้มนีออน', primary: '#040b1a', secondary: '#091533', accent: '#ff7b00', particle: 'laser', style: 'caraudio' },

  // 6. ธรรมชาติ (7)
  { id: 'na-1', cat: 'nature', name: 'น้ำตกป่าเขียวแสงเช้า', sub: 'สดชื่น สบายตา ละอองน้ำ', primary: '#0b2b26', secondary: '#051714', accent: '#52b788', particle: 'leaves', style: 'nature' },
  { id: 'na-2', cat: 'nature', name: 'ภูเขายามพระอาทิตย์ตก', sub: 'ทิวเขาซ้อนกันสีส้มม่วง', primary: '#2d142c', secondary: '#510a32', accent: '#ff8c42', particle: 'bokeh', style: 'nature' },
  { id: 'na-3', cat: 'nature', name: 'ทะเลสาบสงบเงาสะท้อน', sub: 'ฟ้าน้ำเงินอมเขียว ผ่อนคลาย', primary: '#0a2239', secondary: '#1d4e89', accent: '#7bdff2', particle: 'bokeh', style: 'nature' },
  { id: 'na-4', cat: 'nature', name: 'ป่าหิ่งห้อยยามค่ำคืน', sub: 'แสงหิ่งห้อยสีเขียวทอง', primary: '#04120c', secondary: '#082418', accent: '#b5e48c', particle: 'sparkles', style: 'nature' },
  { id: 'na-5', cat: 'nature', name: 'ซากุระและสายลม', sub: 'กลีบดอกไม้สีชมพูปลิวไสว', primary: '#1e162e', secondary: '#34244d', accent: '#ffb3c6', particle: 'leaves', style: 'nature' },
  { id: 'na-6', cat: 'nature', name: 'ทะเลดาวทางช้างเผือก', sub: 'ท้องฟ้ายามค่ำคืนเหนือยอดเขา', primary: '#03071e', secondary: '#101942', accent: '#90e0ef', particle: 'sparkles', style: 'nature' },
  { id: 'na-7', cat: 'nature', name: 'ทุ่งหญ้าแสงแดดอุ่น', sub: 'เขียวทองสดใส พลังบวก', primary: '#1b4332', secondary: '#2d6a4f', accent: '#ffd166', particle: 'leaves', style: 'nature' },

  // 7. โรงเรียน (6)
  { id: 'sc-1', cat: 'school', name: 'ห้องเรียนแสงแดดเช้า', sub: 'อบอุ่น สดใส สไตล์อนิเมะ/เกม', primary: '#1d3557', secondary: '#457b9d', accent: '#ffd166', particle: 'bokeh', style: 'school' },
  { id: 'sc-2', cat: 'school', name: 'กระดานดำห้องเรียน', sub: 'เขียวเข้มกระดานดำคลาสสิก', primary: '#0f2e1f', secondary: '#081c12', accent: '#f4f1de', particle: 'sparkles', style: 'school' },
  { id: 'sc-3', cat: 'school', name: 'โถงทางเดินโรงเรียน', sub: 'แสงลอดหน้าต่างยามเย็น', primary: '#3d2c2e', secondary: '#1f171a', accent: '#ff9f1c', particle: 'bokeh', style: 'school' },
  { id: 'sc-4', cat: 'school', name: 'ห้องสมุดแสนสงบ', sub: 'โทนไม้อบอุ่น-ไฟโคมอ่านหนังสือ', primary: '#2b1d12', secondary: '#140d08', accent: '#e9c46a', particle: 'sparkles', style: 'school' },
  { id: 'sc-5', cat: 'school', name: 'สนามกีฬาโรงเรียน', sub: 'ฟ้าสดใส-เขียวสนามหญ้า', primary: '#0077b6', secondary: '#1b4332', accent: '#ffffff', particle: 'leaves', style: 'school' },
  { id: 'sc-6', cat: 'school', name: 'วันรับปริญญาสีทอง', sub: 'หรูหรา ฉลองความสำเร็จ', primary: '#141b33', secondary: '#090d1a', accent: '#ffd700', particle: 'sparkles', style: 'school' },

  // 8. โรงพยาบาล (7)
  { id: 'ho-1', cat: 'hospital', name: 'โถงโรงพยาบาลโมเดิร์น', sub: 'สะอาดตา ขาว-ฟ้า สบายใจ', primary: '#0f3057', secondary: '#00587a', accent: '#a8e6cf', particle: 'bokeh', style: 'hospital' },
  { id: 'ho-2', cat: 'hospital', name: 'คลินิกมินิมอลอบอุ่น', sub: 'เขียวมินต์นุ่มนวล ทันสมัย', primary: '#0b3b36', secondary: '#145c54', accent: '#80ffdb', particle: 'bokeh', style: 'hospital' },
  { id: 'ho-3', cat: 'hospital', name: 'ห้องแล็บไฮเทค', sub: 'ไซเบอร์เมดิคอล ฟ้าเรืองแสง', primary: '#031926', secondary: '#072f47', accent: '#00f2ea', particle: 'sparkles', style: 'hospital' },
  { id: 'ho-4', cat: 'hospital', name: 'แผนกฉุกเฉิน ER', sub: 'น้ำเงิน-แดง สัญญาณชีพ', primary: '#0b132b', secondary: '#1c2541', accent: '#ff4d6d', particle: 'laser', style: 'hospital' },
  { id: 'ho-5', cat: 'hospital', name: 'สวนพักฟื้นสีเขียว', sub: 'ธรรมชาติบำบัด ผ่อนคลาย', primary: '#1b4332', secondary: '#081c15', accent: '#95d5b2', particle: 'leaves', style: 'hospital' },
  { id: 'ho-6', cat: 'hospital', name: 'เคาน์เตอร์ต้อนรับ VIP', sub: 'ขาวมุก-ทองอ่อน สะอาดหรู', primary: '#223347', secondary: '#121d2b', accent: '#e0fbfc', particle: 'bokeh', style: 'hospital' },
  { id: 'ho-7', cat: 'hospital', name: 'คลื่นหัวใจ Medical HUD', sub: 'กราฟชีพจร ECG เคลื่อนไหว', primary: '#04121c', secondary: '#082030', accent: '#06d6a0', particle: 'sparkles', style: 'hospital' },
];

export const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    title: '1. หมวดลอยกระทง (Loy Krathong)',
    keywords: ['Loy Krathong festival background', 'Thai floating lantern festival', 'Yi Peng lantern night sky', 'river with krathong candle light'],
  },
  {
    title: '2. หมวดวัด / พระพุทธรูป (Temple & Buddha)',
    keywords: ['Thai temple architecture background', 'Golden Buddha statue Thailand', 'Buddhist temple interior sunset', 'Ayutthaya ancient temple ruins'],
  },
  {
    title: '3. หมวดประเพณีไทย (Thai Tradition & Culture)',
    keywords: ['Thai traditional dance background', 'Thai cultural festival parade', 'Songkran festival Thailand water', 'Thai ancient heritage'],
  },
  {
    title: '4. หมวดคอนเสิร์ต / ดนตรี (Concert & Music)',
    keywords: ['live music concert stage lights background', 'DJ stage laser light show', 'rock concert crowd and stage', 'music festival night background'],
  },
  {
    title: '5. หมวดเครื่องเสียงรถ / รถแต่ง (Car Audio)',
    keywords: ['modified car sound system trunk', 'car audio bass speaker installation', 'pickup truck with massive speakers', 'neon car audio setup'],
  },
  {
    title: '6. หมวดธรรมชาติ (Nature Landscapes)',
    keywords: ['lush green nature landscape background', 'tropical forest waterfall sunrise', 'sunset mountain view HD', 'serene lake and trees'],
  },
  {
    title: '7. หมวดโรงเรียน (School & Classroom)',
    keywords: ['modern school classroom interior background', 'empty school hallway corridor', 'school playground green grass', 'university campus library'],
  },
  {
    title: '8. หมวดโรงพยาบาล (Hospital & Clinic)',
    keywords: ['modern hospital corridor interior', 'clean hospital reception waiting area', 'medical clinic background blur', 'healthcare laboratory'],
  },
];
