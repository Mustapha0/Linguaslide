import pptxgen from 'pptxgenjs';

const clean = (hex, fallback='172033') => String(hex || fallback).replace('#','').slice(0,6).toUpperCase();
const hexLum = (hex) => { const c=clean(hex); const rgb=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]; };

export async function exportDeckToPptx(deck) {
  if (!deck?.slides?.length) throw new Error('Create a deck before exporting.');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'LinguaSlides Studio';
  pptx.subject = `Linguistics presentation · ${deck.template?.name || deck.templateId || 'LinguaSlides'}`;
  pptx.title = deck.title || 'LinguaSlides presentation';
  pptx.company = 'LinguaSlides';
  pptx.lang = deck.language || 'en-US';
  const t=deck.theme || {};
  const bg=clean(t.colorTokens?.background,'F5F7FA'), ink=clean(t.colorTokens?.primary,'182638'), muted=clean(t.colorTokens?.secondary,'637286'), accent=clean(t.colorTokens?.accent,'2E77B7');
  const font = (t.fontFace && /^[\w .-]+$/.test(t.fontFace)) ? t.fontFace : /mono/i.test(t.typeface||'') ? 'Aptos Mono' : /serif/i.test(t.typeface||'') ? 'Georgia' : 'Aptos';
  pptx.theme = { headFontFace:font, bodyFontFace:font, lang:deck.language || 'en-US' };
  const W=13.333, H=7.5;
  deck.slides.forEach((item,index)=>{
    const slide=pptx.addSlide(); slide.background={color:bg};
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:W,h:.13,line:{color:accent,transparency:100},fill:{color:accent}});
    slide.addText(`${String(index+1).padStart(2,'0')}  /  ${String(deck.slides.length).padStart(2,'0')}`,{x:.65,y:.48,w:2,h:.25,fontFace:font,fontSize:10,bold:true,color:accent,margin:0,charSpacing:1});
    const heading=index===0?(deck.title||item.title):(item.title||String(item.type||'Slide').replaceAll('-',' '));
    slide.addText(heading,{x:.65,y:1.02,w:12.0,h:index===0?1.3:.85,fontFace:font,fontSize:index===0?30:25,bold:true,color:ink,breakLine:false,fit:'shrink',margin:0.03, valign:'mid'});
    slide.addShape(pptx.ShapeType.line,{x:.68,y:index===0?2.45:2.05,w:11.95,h:0,line:{color:accent,width:1.4,transparency:10}});
    const type=item.custom?'custom':String(item.type||'').toLowerCase();
    if(/ipa|vowel|phonetic|chart/.test(type)) {
      const symbols=['i','y','ɪ','ʏ','e','ø','ɛ','œ','æ','a','ɑ','ɒ','ɔ','o','ʊ','u','ə','ɜ','ʌ'];
      symbols.forEach((s,i)=>{const col=i%6,row=Math.floor(i/6);const x=.8+col*1.92,y=2.75+row*.82;slide.addShape(pptx.ShapeType.roundRect,{x,y,w:1.65,h:.58,rectRadius:.05,line:{color:accent,width:1},fill:{color:bg}});slide.addText(s,{x,y:y+.03,w:1.65,h:.48,fontFace:'Doulos SIL',fontSize:24,color:ink,align:'center',valign:'mid',margin:0});});
      slide.addText('IPA symbols use an installed Unicode-compatible font; verify glyph coverage on the target system.',{x:.8,y:6.25,w:11.7,h:.3,fontFace:font,fontSize:9,color:muted,italic:true,margin:0});
    } else if(/minimal-pair|contrast|stimuli/.test(type)) {
      const pairs=[['bit','/bɪt/','bet','/bɛt/'],['ship','/ʃɪp/','sheep','/ʃiːp/']];
      pairs.forEach((r,i)=>{const y=2.85+i*1.25; slide.addShape(pptx.ShapeType.roundRect,{x:1.0,y,w:5.15,h:.9,line:{color:accent,width:1.1},fill:{color:bg}});slide.addText(`${r[0]}   ${r[1]}`,{x:1.2,y:y+.2,w:4.75,h:.45,fontFace:font,fontSize:22,color:ink,margin:0});slide.addShape(pptx.ShapeType.roundRect,{x:7.0,y,w:5.15,h:.9,line:{color:accent,width:1.1},fill:{color:bg}});slide.addText(`${r[2]}   ${r[3]}`,{x:7.2,y:y+.2,w:4.75,h:.45,fontFace:font,fontSize:22,color:ink,margin:0});});
    } else if(/gloss|example|translation|bilingual/.test(type)) {
      const rows=[['Mina','kitab-a','read-PST'],['Mina','book-ACC','read-PST'],['“Mina read the book.”','','']];
      rows.forEach((r,ri)=>r.forEach((txt,ci)=>slide.addText(txt,{x:.95+ci*3.55,y:2.8+ri*.75,w:3.15,h:.48,fontFace:ri===2?font:'Aptos Mono',fontSize:ri===2?18:20,color:ri===2?accent:ink,bold:ri===0,margin:.04,breakLine:false})));
      slide.addShape(pptx.ShapeType.line,{x:.9,y:3.48,w:9.85,h:0,line:{color:muted,width:.8}});
    } else if(/tree|syntax|derivation|branch/.test(type)) {
      const nodes=[{x:5.6,y:2.65,w:2.0,text:'CP'},{x:3.3,y:4.0,w:2.0,text:'TP'},{x:7.9,y:4.0,w:2.0,text:'DP'},{x:2.2,y:5.25,w:2.0,text:'T′'},{x:5.0,y:5.25,w:2.0,text:'VP'}];
      [[6.6,3.25,4.3,4.0],[6.6,3.25,8.9,4.0],[4.3,4.6,3.2,5.25],[4.3,4.6,6.0,5.25]].forEach(a=>slide.addShape(pptx.ShapeType.line,{x:Math.min(a[0],a[2]),y:a[1],w:Math.abs(a[2]-a[0]),h:a[3]-a[1],flipH:a[2]<a[0],line:{color:accent,width:1.5,beginArrowType:'none',endArrowType:'triangle'}}));
      nodes.forEach(n=>{slide.addShape(pptx.ShapeType.roundRect,{x:n.x,y:n.y,w:n.w,h:.58,line:{color:accent,width:1.2},fill:{color:bg}});slide.addText(n.text,{x:n.x,y:n.y+.03,w:n.w,h:.48,fontFace:'Aptos Mono',fontSize:18,bold:true,color:ink,align:'center',valign:'mid',margin:0});});
    } else if(/map|atlas|isogloss|field-site|variation/.test(type)) {
      slide.addShape(pptx.ShapeType.rect,{x:1.0,y:2.7,w:7.1,h:3.3,line:{color:accent,width:1.2},fill:{color:'E8EEE8'}});
      [[2.0,3.4],[3.2,4.4],[4.4,3.7],[5.8,4.9],[6.7,3.3],[3.9,5.4]].forEach((p,i)=>{slide.addShape(pptx.ShapeType.ellipse,{x:p[0],y:p[1],w:.16,h:.16,line:{color:accent,transparency:100},fill:{color:accent}});slide.addText(String.fromCharCode(65+i),{x:p[0]+.16,y:p[1]-.02,w:.25,h:.2,fontFace:font,fontSize:8,color:ink,margin:0});});
      slide.addText('Schematic map — replace markers with verified field locations.',{x:8.5,y:3.2,w:3.5,h:1,fontFace:font,fontSize:16,color:ink,fit:'shrink',margin:.05});
    } else if(/corpus|concordance|kwic|transcript|frequency|collocat/.test(type)) {
      const lines=['… the language of the community …','… language learning in context …','… language use across settings …'];
      lines.forEach((txt,i)=>{slide.addShape(pptx.ShapeType.rect,{x:.9,y:2.7+i*.78,w:11.4,h:.57,line:{color:'D8DEE8',width:.7},fill:{color:i===1?'E8F2F8':bg}});slide.addText(txt,{x:1.15,y:2.82+i*.78,w:10.9,h:.28,fontFace:'Aptos Mono',fontSize:17,color:ink,margin:0});});
    } else {
      slide.addText(item.custom ? (item.slots?.body || '') : (item.slots?.body || item.slots?.content || `${item.title || item.type || 'Presentation slide'}\n\n• Key observation\n• Linguistic evidence\n• Interpretation and implications`),{x:.9,y:2.75,w:10.8,h:2.65,fontFace:font,fontSize:21,color:ink,breakLine:false,fit:'shrink',valign:'top',margin:.08,bullet:{indent:18}});
      // Editable accent markers make the visual language consistent without flattening content.
      slide.addShape(pptx.ShapeType.ellipse,{x:11.25,y:5.55,w:.32,h:.32,line:{color:accent,transparency:100},fill:{color:accent}});
      slide.addShape(pptx.ShapeType.ellipse,{x:11.72,y:5.55,w:.18,h:.18,line:{color:accent,transparency:100},fill:{color:accent,transparency:35}});
      slide.addShape(pptx.ShapeType.ellipse,{x:12.02,y:5.55,w:.11,h:.11,line:{color:accent,transparency:100},fill:{color:accent,transparency:60}});
    }
    slide.addText(deck.template?.name || deck.templateId || 'LinguaSlides',{x:.68,y:7.08,w:6,h:.18,fontFace:font,fontSize:8,color:muted,margin:0});
    slide.addText(deck.language || 'English',{x:10.6,y:7.08,w:2.0,h:.18,fontFace:font,fontSize:8,color:muted,align:'right',margin:0});
    const note=typeof item.speakerNotes==='string'&&item.speakerNotes.trim()?item.speakerNotes:`Speaker notes — ${heading}\n\nAdd your research question, evidence, and interpretation here.`;
    if(typeof slide.addNotes==='function') slide.addNotes(note);
  });
  const filename=(deck.title||'linguaslides-deck').normalize('NFKD').replace(/[^\w -]/g,'').trim().replace(/\s+/g,'-').slice(0,70)||'linguaslides-deck';
  // Build from raw bytes (more reliable than a Blob in Android WebViews) and verify it is a real zip package.
  const buffer = await pptx.write({ outputType: 'arraybuffer' });
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 1000 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) throw new Error(`PowerPoint generation produced an invalid file (${bytes.length} bytes). Nothing was saved.`);
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  return {blob,slides:deck.slides.length,filename:`${filename}.pptx`,contrastRatio:((Math.max(hexLum(bg),hexLum(ink))+.05)/(Math.min(hexLum(bg),hexLum(ink))+.05)).toFixed(2)};
}
