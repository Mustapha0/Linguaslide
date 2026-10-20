import React, { useMemo, useState } from "react";
import "./LinguaSlides.css";
import { exportDeckToPptx } from "./pptxExport.js";
import { normalizeImportedTemplate } from "./templateImport.js";
import { registerPlugin } from "@capacitor/core";
const NativeDocumentSaver = registerPlugin("NativeDocumentSaver");

const isNative = () => !!window.Capacitor?.isNativePlatform?.();
const isCancel = (e) => /cancel/i.test(String(e?.message || e));
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
  reader.onerror = () => reject(reader.error || new Error("Could not read file"));
  reader.readAsDataURL(blob);
});

const THEMES = [
  {id:"field-notebook",name:"Field Notebook",tag:"Sociolinguistics",tags:["Sociolinguistics","Historical"],desc:"Warm paper, ink, and marginalia for fieldwork.",slides:12,layout:"frame",bg:"#f3e6cd",ink:"#47392d",muted:"#8a7764",accent:"#a85d3d",font:"Source Serif 4",title:"Language in use: a fieldwork report",map:["Title","Research Question","Field Site","Data Excerpt","Analysis","Discussion","Conclusion","References"]},
  {id:"phonetic-waveform",name:"Phonetic Waveform",tag:"Phonology",tags:["Phonology","Phonetics","Prosody"],desc:"Dark acoustic lab aesthetic with waveform geometry.",slides:14,layout:"wave",bg:"#0b2037",ink:"#f3f7fc",muted:"#a5b6c9",accent:"#55d8e5",font:"Inter",title:"The Phonological System of Southern English",map:["Title","Research Question","IPA Chart","Minimal Pairs","Acoustic Analysis","Results","Discussion","References"]},
  {id:"manuscript",name:"Manuscript / Palimpsest",tag:"Medieval English",tags:["Medieval English","Textual Criticism"],desc:"Vellum, rubrication, and layered textual evidence.",slides:14,layout:"frame",bg:"#ead8ad",ink:"#392b26",muted:"#8a725a",accent:"#9b302d",font:"Source Serif 4",title:"Layers of the text: a palimpsest reading",map:["Title","Manuscript","Variant Readings","Stemmatic Relations","Close Reading","Conclusion","References"]},
  {id:"syntax-architecture",name:"Syntax Architecture",tag:"Syntax",tags:["Syntax","Generative Grammar"],desc:"Blueprint and cyanotype-inspired syntax structures.",slides:13,layout:"grid",bg:"#102b4b",ink:"#f2f7ff",muted:"#a1bad3",accent:"#6dd5e7",font:"Inter",title:"Structure at the syntax-semantics interface",map:["Title","Research Question","Tree Diagram","Derivation","Predictions","Discussion","References"]},
  {id:"concordance-collage",name:"Concordance Collage",tag:"Corpus linguistics",tags:["Corpus linguistics","Digital Humanities"],desc:"Monospace corpus excerpts and concordance lines.",slides:15,layout:"code",bg:"#f4f4ee",ink:"#202722",muted:"#6b746d",accent:"#d85b43",font:"JetBrains Mono",title:"Keyword in context: a corpus study",map:["Title","Corpus","KWIC Lines","Collocations","Frequency","Interpretation","References"]},
  {id:"ipa-grid",name:"IPA Grid",tag:"Phonology",tags:["Phonology","Phonetics"],desc:"A modular phonetic chart system built around symbols.",slides:12,layout:"grid",bg:"#f5f7fa",ink:"#182638",muted:"#637286",accent:"#2e77b7",font:"Inter",title:"Vowel harmony in Exampleland",map:["Title","Research Question","IPA Chart","Minimal Pairs","Analysis","Conclusion","References"]},
  {id:"archive-library",name:"Archive / Library",tag:"Literary studies",tags:["Literary Studies","Book History"],desc:"Index cards, catalogues, and typewriter ephemera.",slides:12,layout:"frame",bg:"#efe7d8",ink:"#332e2a",muted:"#817263",accent:"#8b6f47",font:"Source Serif 4",title:"Catalogue and canon: a book-historical reading",map:["Title","Object","Provenance","Comparanda","Argument","References"]},
  {id:"gloss-layer",name:"Gloss Layer",tag:"Bilingualism",tags:["Bilingualism","Translation"],desc:"Layered typography for interlinear glossing.",slides:12,layout:"split",bg:"#f7f5f0",ink:"#272d33",muted:"#737c82",accent:"#438c84",font:"Inter",title:"Interlinear example: agreement in L2",map:["Title","Example","Gloss","Translation","Analysis","References"]},
  {id:"sonnet-verse",name:"Sonnet / Verse",tag:"Literary studies",tags:["Poetry","Prosody","Close Reading"],desc:"Poetic whitespace and carefully paced stanza rhythm.",slides:10,layout:"split",bg:"#f8f3ed",ink:"#332b3a",muted:"#756b7c",accent:"#9a5d83",font:"Source Serif 4",title:"Reading the volta in Sonnet 116",map:["Title","Quatrain I","Quatrain II","Volta","Close Reading","Conclusion","References"]},
  {id:"map-isogloss",name:"Map / Isogloss",tag:"Dialectology",tags:["Dialectology","Sociolinguistics","Language Change"],desc:"Linguistic-atlas cartography for dialect variation.",slides:12,layout:"map",bg:"#f3f0e5",ink:"#293b36",muted:"#68766e",accent:"#b35e45",font:"Source Serif 4",title:"Dialect boundaries in the BATH vowel",map:["Title","Atlas","Isogloss","Variation","Change Over Time","Conclusion","References"]},
  {id:"experiment-lab",name:"Experiment Lab",tag:"Psycholinguistics",tags:["Psycholinguistics","Neurolinguistics"],desc:"Scientific instrument UI for methods and results.",slides:14,layout:"grid",bg:"#11151d",ink:"#f0f3f8",muted:"#a0a9b8",accent:"#c47dff",font:"Inter",title:"Reaction times in sentence processing",map:["Title","Hypothesis","Method","Stimuli","RT Plot","Statistics","Discussion","References"]},
  {id:"etymology-tree",name:"Etymology Tree",tag:"Historical linguistics",tags:["Historical Linguistics","Etymology"],desc:"Branching diagrams for language change and descent.",slides:11,layout:"tree",bg:"#f5f1e6",ink:"#29372d",muted:"#687568",accent:"#6e8b57",font:"Source Serif 4",title:"From Proto-Indo-European to English",map:["Title","Root","Branching","Reflexes","Sound Change","Argument","References"]},
  {id:"code-switching",name:"Code-switching",tag:"Bilingualism",tags:["Bilingualism","Contact Linguistics"],desc:"Contrasting language systems in one conversation.",slides:12,layout:"split",bg:"#f5f3fa",ink:"#27233a",muted:"#756d86",accent:"#e36c65",font:"Inter",title:"Two languages, one turn: code-switching in talk",map:["Title","Example","Context","Pattern","Analysis","Discussion","References"]},
  {id:"semiotic-square",name:"Semiotic Square",tag:"Semantics",tags:["Semantics","Semiotics"],desc:"Four-quadrant structure for relations and oppositions.",slides:11,layout:"grid",bg:"#f6f6f2",ink:"#252a32",muted:"#687286",accent:"#5276a7",font:"Inter",title:"Oppositions in the semantic field",map:["Title","Semantic Field","Square","Relations","Argument","Conclusion","References"]},
  {id:"speech-act",name:"Speech Act",tag:"Pragmatics",tags:["Pragmatics","Speech Act Theory"],desc:"Kinetic utterance frames for language in context.",slides:12,layout:"band",bg:"#f7f8fc",ink:"#20283a",muted:"#687286",accent:"#f09a58",font:"Inter",title:"Doing things with words",map:["Title","Utterance","Illocutionary Force","Context","Analysis","References"]},
  {id:"corpus-bloom",name:"Corpus Bloom",tag:"Corpus linguistics",tags:["Corpus linguistics","Quantitative Linguistics"],desc:"Network constellations and data-led visual storytelling.",slides:13,layout:"wave",bg:"#101d2b",ink:"#f3f7fb",muted:"#9fb4ca",accent:"#61c9a8",font:"Inter",title:"Collocation network of strong and heavy",map:["Title","Corpus","Network","Collocates","Statistics","Interpretation","References"]},
  {id:"grammar-paradigm",name:"Grammar Paradigm",tag:"Morphology",tags:["Morphology","Typology"],desc:"Inflection tables and paradigmatic comparison.",slides:12,layout:"grid",bg:"#f7f8fa",ink:"#202a39",muted:"#687286",accent:"#557bc2",font:"Inter",title:"Inflection paradigm: sing–sang–sung",map:["Title","Paradigm","Class","Comparison","Argument","References"]},
  {id:"transcription",name:"Transcription",tag:"Discourse analysis",tags:["Discourse Analysis","Conversation Analysis"],desc:"Conversation-analysis transcript with timestamp gutter.",slides:13,layout:"code",bg:"#f5f5f1",ink:"#222b2b",muted:"#697571",accent:"#c15a47",font:"JetBrains Mono",title:"Turn-taking in institutional talk",map:["Title","Transcript","Sequence","Turn Design","Analysis","Conclusion","References"]},
  {id:"bilingual-book",name:"Bilingual Book",tag:"Translation",tags:["Translation","Comparative Literature"],desc:"Facing-page bilingual spread for close comparison.",slides:11,layout:"split",bg:"#f5efe5",ink:"#342d2a",muted:"#75685d",accent:"#688a83",font:"Source Serif 4",title:"Original and translation: a facing-page reading",map:["Title","Source Text","Target Text","Commentary","Argument","References"]},
  {id:"museum-placard",name:"Museum Placard",tag:"Language history",tags:["Epigraphy","Language History","Revitalization"],desc:"Museum labels and artifact provenance for language history.",slides:10,layout:"frame",bg:"#f2f0e8",ink:"#262a2c",muted:"#69716f",accent:"#9d7849",font:"Source Serif 4",title:"Object label: an inscribed sherd",map:["Title","Object","Inscription","Dating","Interpretation","References"]}
];

const FONTS = {
  "Inter": "Inter, Arial, sans-serif",
  "Source Serif 4": "'Source Serif 4', Georgia, 'Times New Roman', serif",
  "JetBrains Mono": "'JetBrains Mono', Consolas, monospace"
};
const ALL_FILTERS = ["All","Phonology","Corpus linguistics","Medieval English","Syntax","Sociolinguistics"];

function Mark({small=false}) {
  return <span className={`ls-mark ${small ? "small" : ""}`} aria-hidden="true"><i/><b/></span>;
}
function StepTitle({n,children}) {
  return <div className="ls-step-title"><span className="ls-step-number">{n}</span><h2>{children}</h2></div>;
}
function Wave({mini=false}) {
  const bars = Array.from({length: mini ? 42 : 72}, (_,i) => {
    const h = 8 + Math.abs(Math.sin(i*1.71)*Math.cos(i*.31))* (mini ? 30 : 62);
    return <i key={i} style={{height:`${h}%`}}/>;
  });
  return <div className={`ls-wave ${mini ? "mini" : ""}`} aria-label="Illustrative sound waveform">{bars}</div>;
}
function MiniArt({theme}) {
  return <div className={`ls-art ls-art-${theme.layout}`} style={{"--theme-bg":theme.bg,"--theme-ink":theme.ink,"--theme-muted":theme.muted,"--theme-accent":theme.accent}}>
    {theme.imported ? <div style={{padding:"10px",color:theme.ink,fontFamily:theme.fontFace?`"${theme.fontFace}", sans-serif`:undefined,fontSize:"11px",lineHeight:1.3}}><b>{theme.title}</b></div> :
     theme.layout==="wave" ? <Wave mini/> :
     theme.layout==="grid" ? <div className="ls-art-grid">{["ɪ","ʊ","ɛ","ɔ","æ","ɑ"].map(x=><span key={x}>{x}</span>)}</div> :
     theme.layout==="split" ? <div className="ls-art-split"><span>māku</span><span>NEG-go</span></div> :
     theme.layout==="code" ? <div className="ls-art-code"><span>the&nbsp; language</span><span>in&nbsp;&nbsp; context</span><span>the&nbsp; corpus</span></div> :
     theme.layout==="map" ? <div className="ls-map-art"><b/><b/><b/><b/><b/></div> :
     theme.layout==="tree" ? <div className="ls-tree-art">*proto*<span>↙　↘</span><small>Old　　Modern</small></div> :
     theme.layout==="band" ? <div className="ls-art-band"><i/><i/><i/></div> :
     <div className="ls-art-paper"><span>✳</span><b>folio {theme.id.slice(-2)}</b><small>notes · examples · evidence</small></div>}
  </div>;
}
function SlidePreview({theme,slideIndex=0,large=false,label}) {
  const name = label || theme.map[slideIndex % theme.map.length];
  return <div className={`ls-slide-preview ${large ? "large" : ""}`} style={{"--theme-bg":theme.bg,"--theme-ink":theme.ink,"--theme-muted":theme.muted,"--theme-accent":theme.accent,"--theme-font":theme.fontFace?`"${theme.fontFace}", ${FONTS[theme.font]}`:FONTS[theme.font]}}>
    <div className="ls-slide-kicker">{theme.name} / {String(slideIndex+1).padStart(2,"0")}</div>
    <h3>{slideIndex===0 ? theme.title : name}</h3>
    {theme.imported ? <div style={{whiteSpace:"pre-wrap",color:theme.ink,fontSize:large?"0.8em":"0.58em",lineHeight:1.4,textAlign:"left",overflow:"hidden"}}>{((theme.content||[])[slideIndex % Math.max(1,(theme.content||[]).length)]?.body||[]).join("\n")}</div> :
     theme.layout==="wave" ? <Wave/> :
     theme.layout==="grid" ? <div className="ls-vowel-chart">{["i","ɪ","e","ɛ","ə","ʌ","u","ʊ","ɔ","æ","ɑ"].map((v,i)=><span key={i}>{v}</span>)}</div> :
     theme.layout==="split" ? <div className="ls-gloss"><p>māku　n-　kla-ta</p><p>1SG　NEG　go-PST</p><small>“I did not go.”</small></div> :
     theme.layout==="code" ? <div className="ls-code-lines"><p>the <b>language</b> of the community</p><p>in <b>language</b> learning contexts</p><p>language use across settings</p></div> :
     theme.layout==="map" ? <div className="ls-map-large"><span>●</span><span>●</span><span>●</span><span>●</span><span>●</span></div> :
     theme.layout==="tree" ? <div className="ls-tree-large">Proto-language<div>↙　　　↘</div><div>Branch A　　 Branch B</div></div> :
     theme.layout==="band" ? <div className="ls-utterance">“I hereby declare…”</div> :
     <div className="ls-paper-lines"><span/><span/><span/><span/></div>}
    <div className="ls-slide-footer"><span>{name}</span><span>{slideIndex+1} / {theme.slides}</span></div>
  </div>;
}
function makeDeck(theme,title,language) {
  const outline = [...theme.map];
  const extensions = ["Key Terms", "Additional Evidence", "Limitations", "Further Questions", "Acknowledgements", "Appendix"];
  while (outline.length < theme.slides) outline.push(extensions[(outline.length-theme.map.length) % extensions.length]);
  const finalOutline = outline.slice(0, theme.slides);
  const finalTitle = title.trim() || theme.title;
  const custom = Array.isArray(theme.content) && theme.content.length ? theme.content : null;
  return {
    schemaVersion:"1.0.0",
    templateId:theme.id,
    title:finalTitle,
    language,
    theme:{name:theme.name,subfields:theme.tags,fontStack:FONTS[theme.font],typeface:theme.font,fontFace:theme.fontFace||undefined,layout:theme.layout,colorTokens:{primary:theme.ink,secondary:theme.muted,accent:theme.accent,background:theme.bg}},
    slides:finalOutline.map((type,index)=>{
      const c = custom ? custom[index] : null;
      const body = c ? (c.body.length ? c.body.join("\n") : (index===0 ? theme.desc : "")) : (index===0?theme.desc:"Key finding\nLinguistic evidence\nInterpretation and implications");
      return {id:`slide-${index+1}`,type:c ? c.type : type.toLowerCase().replaceAll(" ","-"),title:index===0?finalTitle:(c ? c.title : type),slots:{body},custom:!!c,speakerNotes:`${type}: introduce the purpose of this section, explain the evidence, and connect it to the central research question.`};
    }),
    metadata:{createdWith:"LinguaSlides Studio",exportStatus:"ready-for-pptx-renderer",createdAt:new Date().toISOString(),slideCount:finalOutline.length}
  };
}

export default function LinguaSlidesGallery() {
  const [selectedId,setSelectedId] = useState("phonetic-waveform");
  const [filter,setFilter] = useState("All");
  const [query,setQuery] = useState("");
  const [phase,setPhase] = useState("browse");
  const [title,setTitle] = useState("");
  const [titleEdited,setTitleEdited] = useState(false);
  const [language,setLanguage] = useState("English");
  const [deck,setDeck] = useState(null);
  const [jsonTab,setJsonTab] = useState("deck");
  const [slideIndex,setSlideIndex] = useState(0);
  const [copied,setCopied] = useState(false);
  const [exporting,setExporting] = useState(false);
  const [exportMessage,setExportMessage] = useState("");
  const [previewIndex,setPreviewIndex] = useState(0);
  const [saveLocationMessage,setSaveLocationMessage] = useState("");
  const [importMessage,setImportMessage] = useState("");
  const [customThemes,setCustomThemes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("linguaslides.customTemplates") || "[]"); } catch { return []; }
  });
  const allThemes = useMemo(() => [...customThemes, ...THEMES], [customThemes]);
  const selected = allThemes.find(t=>t.id===selectedId) || THEMES[0];
  const shownTitle = titleEdited ? title : selected.title;
  const filtered = useMemo(()=>allThemes.filter(t=>{
    const matchFilter=filter==="All" || t.tags.some(tag=>tag.toLowerCase()===filter.toLowerCase()) || t.tag.toLowerCase()===filter.toLowerCase();
    const q=query.toLowerCase().trim();
    const matchQuery=!q || [t.name,t.desc,t.tag,t.title,...t.tags].join(" ").toLowerCase().includes(q);
    return matchFilter && matchQuery;
  }),[allThemes,filter,query]);
  const deckJson = JSON.stringify(deck && deck.templateId===selected.id ? deck : makeDeck(selected,shownTitle,language),null,2);
  const choose = (theme) => {setSelectedId(theme.id);setSlideIndex(0);if(deck && deck.templateId!==theme.id){setDeck(null);setPhase("browse");}};
  // Only ever use an existing deck if it was built from the template that is currently selected.
  const currentDeck = () => (deck && deck.templateId===selected.id) ? deck : makeDeck(selected,shownTitle,language);
  const startBuild = () => {setPhase("build");};
  const createDeck = () => {const d=makeDeck(selected,shownTitle,language);setDeck(d);setPreviewIndex(0);setPhase("done");};
  const saveBlobToDevice = async (blob, filename, mime, description) => {
    // Never create a zero-byte file: validate the generated payload before opening Android's picker.
    if (!(blob instanceof Blob) || blob.size < 1) {
      throw new Error(`The generated ${filename} is empty (0 bytes). Nothing was saved; please retry after recreating the deck.`);
    }
    // Android: use the native Create Document picker and write bytes to the selected phone-storage URI.
    // This saves a real file; it does not invoke the share sheet.
    if (isNative() && window.Capacitor?.getPlatform?.() === "android") {
      const encodedData = await blobToBase64(blob);
      if (!encodedData || encodedData.length < 4) throw new Error(`Could not encode ${filename}; no file was saved.`);
      const result = await NativeDocumentSaver.save({
        filename,
        mimeType: mime,
        data: encodedData,
        expectedBytes: blob.size
      });
      if (result?.cancelled) return "cancelled";
      if (!result?.bytesWritten || Number(result.bytesWritten) < 1 || Number(result.bytesWritten) !== blob.size) {
        throw new Error(`Android reported an incomplete save (${result?.bytesWritten || 0} of ${blob.size} bytes). Please try again.`);
      }
      setSaveLocationMessage(result.location ? `Saved ${filename} (${result.bytesWritten} bytes) to ${result.location} on your phone.` : `Saved ${filename} (${result.bytesWritten} bytes) to the location you selected on your phone.`);
      return "native-saved";
    }
    if (isNative()) {
      // Non-Android native builds: keep a regular download fallback rather than pretending a share is a save.
      const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
      setSaveLocationMessage(`Download started for ${filename}.`);
      return "download";
    }
    // On supported browsers, let the user choose Documents (or another folder) directly.
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description, accept: { [mime]: [filename.endsWith(".pptx") ? ".pptx" : ".json"] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob); await writable.close();
        setSaveLocationMessage(`Saved ${filename}. Choose your device’s Documents folder in the save dialog to store it there.`);
        return "picker";
      } catch (error) { if (error?.name === "AbortError") return "cancelled"; throw error; }
    }
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
    setSaveLocationMessage(`Your browser downloaded ${filename}. On this browser, choose Documents as the download location in browser/device settings; automatic silent writes to Documents are blocked for privacy.`);
    return "download";
  };
  const importTemplateFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const imported = normalizeImportedTemplate(raw);
      const next = [imported, ...customThemes.filter(t => t.name !== imported.name)];
      setCustomThemes(next);
      localStorage.setItem("linguaslides.customTemplates", JSON.stringify(next));
      setDeck(null); setPhase("browse"); setTitleEdited(false); setTitle(""); setPreviewIndex(0);
      setSelectedId(imported.id); setSlideIndex(0); setFilter("All"); setQuery("");
      setImportMessage(`Imported “${imported.name}” successfully.`);
    } catch (error) {
      setImportMessage(`Template not imported: ${error?.message || "Invalid JSON."}`);
    }
  };
  const exportTemplateJson = async () => {
    const template = {
      schemaVersion: "linguaslides-template-1.0",
      id: selected.id, name: selected.name, description: selected.desc,
      category: selected.tag, tags: selected.tags,
      theme: { background: selected.bg, primary: selected.ink, text: selected.ink,
        muted: selected.muted, accent: selected.accent, fontFamily: selected.font },
      layouts: selected.map.map((heading, i) => ({ type: i === 0 ? "title" : "content", title: heading,
        body: i === 0 ? [] : ["Add your content here."] }))
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const filename = `${selected.id.replace(/[^a-z0-9_-]/gi, "-")}-template.json`;
    try { await saveBlobToDevice(blob, filename, "application/json", "LinguaSlides JSON template"); }
    catch (error) { setImportMessage(`Could not export template: ${error?.message || "Please try again."}`); }
  };
  const downloadJson = async () => {
    const data=currentDeck();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const filename=`${(data.title || selected.title).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "linguaslides-deck"}.json`;
    try { await saveBlobToDevice(blob,filename,"application/json","JSON deck"); }
    catch(error) { setSaveLocationMessage(`Could not save file: ${error?.message || "Please try again."}`); }
  };
  const exportPptx = async () => {
    const data = currentDeck();
    setExporting(true); setExportMessage("");
    try {
      const result = await exportDeckToPptx(data);
      const saveResult = await saveBlobToDevice(result.blob,result.filename,"application/vnd.openxmlformats-officedocument.presentationml.presentation","PowerPoint presentation");
      if(saveResult !== "cancelled") setExportMessage(`Saved ${result.filename} · ${result.slides} editable slides · text/background contrast ${result.contrastRatio}:1. IPA glyphs depend on fonts installed on the viewing computer.`);
    }
    catch (error) { setExportMessage(`PowerPoint export failed: ${error?.message || "Unknown error"}`); }
    finally { setExporting(false); }
  };
  const copyJson = async () => {
    try {await navigator.clipboard.writeText(deckJson);}
    catch {
      const ta=document.createElement("textarea");ta.value=deckJson;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();
      try {document.execCommand("copy");} catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);setTimeout(()=>setCopied(false),1400);
  };
  const backToBrowse = () => {setPhase("browse");setDeck(null);setPreviewIndex(0);};
  const updateNotes = (index, value) => setDeck(d => d ? {...d, slides:d.slides.map((sl,i)=>i===index?{...sl,speakerNotes:value}:sl)} : d);
  const updateSlide = (index, key, value) => setDeck(d => d ? {...d, slides:d.slides.map((sl,i)=>i===index?{...sl,[key]:value}:sl)} : d);
  const moveSlide = (index, delta) => {
    if (!deck) return;
    const target = index + delta;
    if (target < 0 || target >= deck.slides.length) return;
    setDeck(d => {
      if (!d) return d;
      const slides = [...d.slides]; [slides[index], slides[target]] = [slides[target], slides[index]];
      return {...d, slides};
    });
    setPreviewIndex(target);
  };
  const duplicateSlide = (index) => {
    if (!deck) return;
    setDeck(d => {
      if (!d) return d;
      const original = d.slides[index];
      const copy = {...original, id:`slide-${Date.now()}`, title:`${original.title} (copy)`, slots:{...original.slots}};
      const slides = [...d.slides]; slides.splice(index+1, 0, copy);
      return {...d, slides, metadata:{...d.metadata, slideCount:slides.length}};
    });
    setPreviewIndex(index+1);
  };
  const deleteSlide = (index) => {
    if (!deck || deck.slides.length <= 1) return;
    setDeck(d => {
      if (!d || d.slides.length <= 1) return d;
      const slides = d.slides.filter((_,i)=>i!==index);
      return {...d, slides, metadata:{...d.metadata, slideCount:slides.length}};
    });
    setPreviewIndex(Math.max(0, Math.min(index, deck.slides.length-2)));
  };
  const previewTheme = deck ? (allThemes.find(t=>t.id===deck.templateId) || selected) : selected;
  const activeSlide = deck ? Math.min(previewIndex, deck.slides.length-1) : 0;

  return <main className="ls-app">
    <section className="ls-hero ls-panel">
      <nav className="ls-nav"><a className="ls-brand" href="#top"><Mark/><span>LinguaSlides</span></a><div className="ls-nav-links"><a href="#templates">Templates</a><a href="#build">Build</a><a href="#library">Library</a><a href="#about">About</a></div><span className="ls-user" aria-label="Profile">♙</span></nav>
      <div className="ls-hero-body">
        <div className="ls-hero-copy"><p className="ls-eyebrow">LINGUASLIDES / STUDIO</p><h1>The presentation studio for linguists and English studies researchers.</h1><p className="ls-lede">Beautiful, discipline-specific slide decks with built-in support for IPA, glossing, syntax trees, corpora, dialect maps and more.</p><a className="ls-button primary" href="#templates">Browse Templates <span>→</span></a><div className="ls-proof"><span>20 visual systems</span><i/> <span>Exportable JSON</span><i/> <span>Editable PowerPoint</span></div></div>
        <div className="ls-hero-collage"><div className="ls-collage-card ls-collage-wave"><strong>The Phonological System<br/>of Southern English</strong><Wave mini/></div><div className="ls-collage-card ls-collage-tree"><b>Syntactic Structure</b><div>CP</div><span>↙　↘</span><small>TP　　 DP</small></div><div className="ls-collage-card ls-collage-gloss"><b>Interlinear Gloss</b><p>wola　n-　kla-ta</p><small>“I saw him”</small></div><div className="ls-collage-card ls-collage-map"><MiniArt theme={THEMES[9]}/></div><div className="ls-collage-card ls-collage-paper"><MiniArt theme={THEMES[2]}/></div></div>
      </div>
    </section>

    <div className="ls-workflow">
      <section className="ls-panel ls-gallery" id="templates">
        <StepTitle n="1">Browse 20 visual systems</StepTitle>
        <div className="ls-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search themes, subfields, or topics..." aria-label="Search themes"/></div>
        <div className="ls-chips">{ALL_FILTERS.map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div>
        <div className="ls-template-json-tools" style={{display:"flex",gap:".6rem",flexWrap:"wrap",alignItems:"center",margin:"1rem 0"}}>
          <label className="ls-button secondary" style={{cursor:"pointer"}}>
            Import Template from JSON
            <input type="file" accept=".json,application/json" onChange={importTemplateFile} style={{display:"none"}} />
          </label>
          <button className="ls-button secondary" type="button" onClick={exportTemplateJson}>Export Selected Template JSON</button>
          {importMessage && <p role="status" style={{flexBasis:"100%",margin:0}}>{importMessage}</p>}
        </div>
        <div className="ls-theme-grid">{filtered.map(t=><button key={t.id} className={`ls-theme-card ${selectedId===t.id?"chosen":""}`} onClick={()=>choose(t)} aria-pressed={selectedId===t.id}>
          <MiniArt theme={t}/><div className="ls-theme-card-body"><strong>{t.name}</strong><p>{t.desc}</p><div className="ls-tag-row">{t.tags.slice(0,2).map(tag=><span key={tag}>{tag}</span>)}</div><small>{t.slides} slides</small></div>
        </button>)}</div>
        {!filtered.length && <p className="ls-empty">No systems match that search. Try another term or choose “All”.</p>}
      </section>

      <section className="ls-panel ls-details">
        <StepTitle n="2">View theme details &amp; slide map</StepTitle>
        <div className="ls-theme-banner" style={{"--theme-bg":selected.bg,"--theme-ink":selected.ink,"--theme-muted":selected.muted,"--theme-accent":selected.accent}}>
          <div><span className="ls-banner-icon">▣</span><h3>{selected.name}</h3><p>{selected.desc}</p><div className="ls-tag-row">{selected.tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}<span>{selected.slides} slides</span></div></div><div className="ls-banner-art"><Wave mini/></div><div className="ls-typeface"><b>Aa</b><small>Type style</small><div className="ls-color-dots"><i/><i/><i/><i/></div><small>{selected.font}</small></div>
        </div>
        <div className="ls-detail-body"><div className="ls-slide-map"><h3>Slide Map</h3><ol>{selected.map.map((s,i)=><li key={s} className={slideIndex===i?"active":""}><button onClick={()=>setSlideIndex(i)}><span>{i+1}.</span>{s}</button></li>)}<li className="ls-more">…</li></ol></div><div className="ls-big-preview"><SlidePreview theme={selected} slideIndex={slideIndex} large/><div className="ls-preview-controls"><span>{slideIndex+1} / {selected.slides}</span><div><button onClick={()=>setSlideIndex(i=>(i-1+selected.map.length)%selected.map.length)} aria-label="Previous slide">‹</button><button onClick={()=>setSlideIndex(i=>(i+1)%selected.map.length)} aria-label="Next slide">›</button></div></div></div></div>
        <div className="ls-actions"><button className="ls-button secondary" onClick={backToBrowse}>Back</button><button className="ls-button primary" onClick={startBuild}>Choose This System</button></div>
      </section>

      <section className="ls-panel ls-build" id="build">
        <StepTitle n="3">Build your deck</StepTitle>
        <div className="ls-build-body"><aside className="ls-selection"><h3>Current Selection</h3><div className="ls-current-theme"><MiniArt theme={selected}/><div><b>{selected.name}</b><small>{selected.tags.slice(0,2).join(" · ")}</small><small>{selected.font} (typeface)</small></div></div><div className="ls-color-dots"><i style={{background:selected.ink}}/><i style={{background:selected.accent}}/><i style={{background:selected.muted}}/><i style={{background:selected.bg}}/></div><div className="ls-selection-links"><button onClick={()=>document.getElementById("templates")?.scrollIntoView({behavior:"smooth"})}>View details</button><button onClick={backToBrowse}>Change</button></div><h3 className="ls-map-label">Slide Map ({selected.slides} slides)</h3><ol className="ls-mini-map">{selected.map.map((s,i)=><li key={s} className={i===0?"active":""}>{i+1}.　{s}</li>)}</ol></aside><div className="ls-build-form"><label>Deck Title<input value={shownTitle} onChange={e=>{setTitle(e.target.value);setTitleEdited(true);}}/></label><small>Seeded from the theme. You can edit this.</small><label>Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>German</option><option>French</option><option>Spanish</option><option>Portuguese</option><option>Arabic</option><option>Chinese</option><option>Other / multilingual</option></select></label><button className="ls-button primary full" onClick={createDeck}>Create Deck</button><button className="ls-button secondary back-build" onClick={backToBrowse}>Back to designs</button></div></div>
      </section>

      <section className="ls-panel ls-json">
        <StepTitle n="4">Inspect the deck object (JSON)</StepTitle>
        <div className="ls-tabs"><button className={jsonTab==="deck"?"active":""} onClick={()=>setJsonTab("deck")}>Deck JSON</button><button className={jsonTab==="template"?"active":""} onClick={()=>setJsonTab("template")}>Template Info</button></div>
        <div className="ls-code-window"><div className="ls-code-toolbar"><span>{jsonTab==="deck"?"deck.json":"template.json"}</span><button onClick={copyJson}>{copied?"Copied ✓":"▢ Copy"}</button></div><pre>{jsonTab==="deck"?deckJson:JSON.stringify({id:selected.id,name:selected.name,layout:selected.layout,font:selected.font,fontStack:FONTS[selected.font],tokens:{bg:selected.bg,ink:selected.ink,muted:selected.muted,accent:selected.accent},slideMap:selected.map},null,2)}</pre></div>
        <div className="ls-actions"><button className="ls-button secondary" onClick={()=>setPhase("build")}>← Back</button><button className="ls-button primary" onClick={downloadJson}>⇩ Download JSON</button></div>
      </section>

      <section className="ls-panel ls-deck-preview" id="deck-preview">
        <StepTitle n="5">Preview your deck</StepTitle>
        {!deck ? <div className="ls-preview-empty"><h3>No deck yet</h3><p>Create a deck from your selected theme to preview each slide and edit its speaker notes before exporting.</p><button className="ls-button primary" onClick={()=>{createDeck();}}>Create deck from “{selected.name}”</button></div> : <>
          <p className="ls-preview-intro">Select a slide to preview it. Speaker notes you edit here are included in the PowerPoint and JSON exports.</p>
          <div className="ls-editor-layout">
            <div className="ls-thumbnail-rail" role="list" aria-label="Slides">{deck.slides.map((sl,i)=><button key={sl.id} role="listitem" className={i===activeSlide?"active":""} onClick={()=>setPreviewIndex(i)} aria-current={i===activeSlide?"true":undefined} aria-label={`Slide ${i+1}: ${sl.title}`}><span>{i+1}</span><SlidePreview theme={previewTheme} slideIndex={i} label={sl.title}/><small>{sl.title}</small></button>)}</div>
            <div className="ls-editor-main">
              <div className="ls-editor-toolbar"><strong>Slide {activeSlide+1} of {deck.slides.length} · {deck.slides[activeSlide].title}</strong><div><button className="ls-button secondary" onClick={()=>setPreviewIndex(Math.max(0,activeSlide-1))} disabled={activeSlide===0}>← Prev</button><button className="ls-button secondary" onClick={()=>setPreviewIndex(Math.min(deck.slides.length-1,activeSlide+1))} disabled={activeSlide===deck.slides.length-1}>Next →</button></div></div>
              <div className="ls-editor-stage"><SlidePreview theme={previewTheme} slideIndex={activeSlide} label={deck.slides[activeSlide].title} large/></div>
              <div className="ls-content-editor">
                <label>Slide title<input value={deck.slides[activeSlide].title} onChange={e=>updateSlide(activeSlide,"title",e.target.value)} /></label>
                <label>Slide body<textarea rows="5" value={deck.slides[activeSlide].slots?.body || ""} onChange={e=>updateSlide(activeSlide,"slots",{...deck.slides[activeSlide].slots,body:e.target.value})} /></label>
                <div className="ls-slide-actions">
                  <button className="ls-button secondary" onClick={()=>moveSlide(activeSlide,-1)} disabled={activeSlide===0}>Move up</button>
                  <button className="ls-button secondary" onClick={()=>moveSlide(activeSlide,1)} disabled={activeSlide===deck.slides.length-1}>Move down</button>
                  <button className="ls-button secondary" onClick={()=>duplicateSlide(activeSlide)}>Duplicate</button>
                  <button className="ls-button secondary" onClick={()=>deleteSlide(activeSlide)} disabled={deck.slides.length<=1}>Delete</button>
                </div>
              </div>
              <label className="ls-notes-label">Speaker notes<textarea value={deck.slides[activeSlide].speakerNotes} onChange={e=>updateNotes(activeSlide,e.target.value)} /></label>
            </div>
          </div>
        </>}
      </section>

      <section className="ls-panel ls-export">
        <StepTitle n="6">Export to PowerPoint</StepTitle>
        <div className="ls-export-content"><div className="ls-check">✓</div><h3>{deck?"Your deck is ready!":"Your deck is almost ready"}</h3><p>{deck?"Your structured deck is ready to export as an editable PowerPoint file or JSON.":"Create a deck to enable PowerPoint and JSON export."}</p><p className="ls-export-note">Exports native editable PowerPoint text and shapes. IPA glyph appearance depends on fonts installed on the viewing computer.</p><div className="ls-next-stage"><span className="ls-ppt-icon">P</span><div><b>PowerPoint export</b><strong>PowerPoint (.pptx)</strong><small>Editable text and shapes · Speaker notes</small></div></div><button className="ls-button primary full" onClick={downloadJson}>⇩ Download JSON</button><button className="ls-button secondary full" onClick={exportPptx} disabled={exporting}>{exporting ? "Generating PowerPoint…" : "Export editable PowerPoint (.pptx)"}</button><p role="status" aria-live="polite" className="ls-export-note">{exportMessage}</p>{saveLocationMessage && <p className="ls-save-location">{saveLocationMessage}</p>}<button className="ls-text-button" onClick={backToBrowse}>Back to Gallery</button></div>
      </section>

      <section className="ls-panel ls-examples" id="library">
        <StepTitle n="7">Example slides from this theme</StepTitle>
        <div className="ls-example-grid">{[0,2,3,4].filter(idx=>idx<selected.slides).map((idx)=><button key={idx} className="ls-example" onClick={()=>{setSlideIndex(idx%selected.map.length);document.getElementById("templates")?.scrollIntoView({behavior:"smooth"});}}><SlidePreview theme={selected} slideIndex={idx}/><span>{idx+1}. {selected.map[idx%selected.map.length]}</span></button>)}</div>
      </section>
    </div>

    <section className="ls-panel ls-why" id="about"><div className="ls-why-intro"><h2>Why LinguaSlides?</h2><p>Built for the details that matter in linguistics.</p></div><div className="ls-value"><span>◎</span><b>Discipline-specific design DNA</b><p>20 visual systems, each for a different subfield.</p></div><div className="ls-value"><span>▱</span><b>Semantic slide types</b><p>Real content types like gloss, IPA chart, transcript, and tree.</p></div><div className="ls-value"><span>ƒₐ</span><b>Real IPA &amp; gloss support</b><p>IPA glyphs, Leipzig-style glossing, and non-Latin scripts.</p></div><div className="ls-value"><span>▤</span><b>Editable PowerPoint export</b><p>Native shapes, text, tables, and speaker notes in the export pipeline.</p></div><div className="ls-value"><span>✧</span><b>AI-ready architecture</b><p>Structured JSON for programmatic pipelines.</p></div><div className="ls-value"><span>♧</span><b>For the linguistics community</b><p>Students, faculty, researchers, departments, and labs.</p></div></section>
    <footer className="ls-footer"><a className="ls-brand" href="#top"><Mark/><span>LinguaSlides</span></a><span>Better slides. More time for research.</span><small>20 visual systems　·　JSON export　·　Editable PowerPoint export</small></footer>
  </main>;
}
