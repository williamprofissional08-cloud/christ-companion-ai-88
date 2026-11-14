import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const groups=[
 {slug:"proverbios",prefix:"proverbs",name:"Provérbios",file:"proverbios.json",chapters:[28,29,30,31]},
 {slug:"eclesiastes",prefix:"ecclesiastes",name:"Eclesiastes",file:"eclesiastes.json",chapters:[1,2,3,4,5,6]},
];
for(const group of groups){
 const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/"+group.file,import.meta.url),"utf8"));
 for(const chapter of group.chapters){
  test(group.name+" "+chapter+" — texto BLIVRE, exegese e integração",()=>{
   const src=readFileSync(new URL("../src/lib/content/"+group.prefix+"-"+chapter+"-study.ts",import.meta.url),"utf8");
   const a=src.indexOf(" = {\n"),b=src.lastIndexOf(";\n");
   assert.ok(a>=0&&b>a,"Static content");
   const study=JSON.parse(src.slice(a+3,b)),verses=bible.chapters[String(chapter)];
   assert.equal(study.version,5);assert.equal(study.depth,"deep");
   assert.ok(study.intro.length>=900);assert.ok(study.historicalContext.length>=700);
   assert.ok(study.application.length>=800);assert.ok(study.conclusion.length>=500);
   assert.ok(study.questions.length>=15);assert.ok(study.keyPoints.length>=8);
   assert.ok(study.sections.length>=verses.length+8);
   assert.equal(new Set(study.sections.map(x=>x.id)).size,study.sections.length);
   assert.equal(new Set(study.sections.map(x=>x.title)).size,study.sections.length);
   assert.ok(study.sections.slice(1).every((x,i)=>x.title.startsWith((i+1)+". ")));
   const reading=study.sections.find(x=>x.id==="leitura-biblica");
   assert.match(reading.body,/BLIVRE/);
   const markers=[...reading.body.matchAll(/\*\*(\d+)\.\*\*/g)].map(x=>Number(x[1]));
   assert.deepEqual(markers,Array.from({length:verses.length},(_,i)=>i+1));
   const clean=(s)=>s.replace(new RegExp("\\s*"+group.name+" < "+chapter+" >\\s*$"),"").trim();
   for(let i=0;i<verses.length;i++){
    assert.ok(reading.body.includes(clean(verses[i])),"BLIVRE verse "+(i+1)+" absent");
    const ex=study.sections.filter(x=>x.kind==="exegesis"&&x.scriptureRefs?.includes(group.name+" "+chapter+":"+(i+1)));
    assert.equal(ex.length,1,"Exactly one verse-specific exegesis "+(i+1));
    assert.ok(ex[0].body.length>=400,"Substantive commentary "+(i+1));
   }
   const key='"biblia-'+group.slug+'-cap-'+chapter+'": '+group.prefix+chapter+'Study';
   assert.equal(catalog.split(key).length,2,"Catalog entry exactly once");
   const titles=study.sections.map(x=>x.title).join(" ").toLowerCase();
   for(const term of ["leitura","contexto","interpreta","aplica","exercício","pregador","oração"])
    assert.ok(titles.includes(term),"Editorial navigation: "+term);
  });
 }
}
