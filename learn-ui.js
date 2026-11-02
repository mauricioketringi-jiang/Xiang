/* 基础学习 V3：自适应大数、sticky 跳转、完整工业点读与学完即练 */
'use strict';
const LEARN_RATE_KEY='voice_reflex_learn_rate_v2';
const LEARN_DATA=window.LEARN_DATA||{base:[],extra:[],pairs:[],large:[],terms:[],rules:[],industrial:[]};
let learnRate=1;
try{const stored=Number(localStorage.getItem(LEARN_RATE_KEY));if(stored===.7||stored===1)learnRate=stored;}catch(e){}
let learnSpeechSeq=0;
const LR_PAGE_SIZE=12;
const lrShown={21:LR_PAGE_SIZE,22:LR_PAGE_SIZE,23:LR_PAGE_SIZE};
function learnStopSpeech(){
  ++learnSpeechSeq;
  try{window.speechSynthesis?.cancel();}catch(e){}
}
function learnSpeak(text){
  const content=String(text||'').trim();
  if(!content)return;
  const Speech=window.SpeechSynthesisUtterance;
  let synth=null;
  try{synth=window.speechSynthesis;}catch(e){}
  if(typeof Speech!=='function'||!synth){toast('浏览器暂不支持语音播放，可先阅读发音要领。');return;}
  try{
    learnStopSpeech();
    const utterance=new Speech(content);
    utterance.lang='en-US';utterance.rate=learnRate;utterance.pitch=1;utterance.volume=1;
    try{const config=voiceForAccent('en-US');if(config&&config.voice)utterance.voice=config.voice;}catch(e){}
    utterance.onerror=()=>toast('语音播放失败，请重试或检查静音开关');
    if(synth.paused)synth.resume();
    synth.speak(utterance);
  }catch(e){toast('设备阻止语音播放，请手动再点一次');}
}
function learnRateBar(){
  return `<div class="lr-speed" role="group" aria-label="点读速度">
    <span>点读速度</span><button type="button" class="${learnRate===.7?'active':''}" data-lr-rate=".7" aria-pressed="${learnRate===.7}">🐢 0.7x 慢速</button><button type="button" class="${learnRate===1?'active':''}" data-lr-rate="1" aria-pressed="${learnRate===1}">1.0x 常速</button></div>`;
}
function lrCard(n,word,ipa,hint,audio,example,opts={}){
  const speech=esc(audio||word);
  const isLarge=opts.large===true;
  const label=String(n);
  const longNum=isLarge&&label.length>=6;
  const extra=example&&(isLarge||example!==(audio||word))
    ?`<button type="button" class="lr-example-btn" data-lr-speak="${esc(example)}">🔊 例读：${esc(example)}</button>`:'';
  const num=`<strong class="lr-num${longNum?' lr-large-num':''}" aria-label="${esc(label)}">${esc(label)}</strong>`;
  const detail=`<span class="lr-word"><strong>${esc(word)}</strong><small class="lr-ipa">${esc(ipa)}</small><small class="lr-hint">${esc(hint)}</small></span>`;
  const play='<span class="lr-play">🔊 点读</span>';
  return `<div class="lr-row"><button type="button" class="lr-card${longNum?' lr-large-card':''}" data-lr-speak="${speech}" aria-label="点读 ${esc(word)}">
    ${num}${detail}${play}</button>${extra}</div>`;
}
function lrPairs(){
  return LEARN_DATA.pairs.map(p=>{
    const [a,aw,ai,b,bw,bi]=p;
    return `<div class="lr-twin">
      <button type="button" class="lr-twin-side lr-teen" data-lr-speak="${esc(aw)}">
        <span class="lr-mini-tag">TEEN · 后段重音</span><strong>${esc(a)} · ${esc(aw)}</strong><small>${esc(ai)}</small><span class="lr-play">🔊 点读</span>
      </button>
      <button type="button" class="lr-twin-side lr-ty" data-lr-speak="${esc(bw)}">
        <span class="lr-mini-tag">TY · 前段重音</span><strong>${esc(b)} · ${esc(bw)}</strong><small>${esc(bi)}</small><span class="lr-play">🔊 点读</span>
      </button></div>`;
  }).join('');
}
function lrPractice(lessons){
  return `<div class="lr-practice"><span>🎯 学完即练</span><div class="lr-practice-links">${lessons.map(([id,title])=>`<button type="button" data-lr-course="${esc(id)}">${esc(title)} →</button>`).join('')}</div></div>`;
}
function lrSection(id,heading,subtitle,body,lessonLinks=[]){
  return `<section class="card lr-section" id="${id}"><h2>${heading}</h2><p class="lr-desc">${subtitle}</p>${body}${lessonLinks.length?lrPractice(lessonLinks):''}</section>`;
}
function lrIndustrialCard(item){
  const phrase=item.level===23;
  const primary=`<div class="lr-ind-main"><strong class="lr-ind-en">${esc(item.en)}</strong>
   ${phrase?'':`<span class="lr-ind-ipa">${esc(item.ipa)}</span>`}
   <span class="lr-ind-meaning">${esc(item.zh)}</span>
   ${phrase?`<span class="lr-ind-key">核心拆解：${esc(item.key||'现场高频表达')}</span>`:''}</div>`;
  const example=phrase?'':`<button class="lr-ind-example" type="button" data-lr-speak="${esc(item.example)}">🔊 现场例句：${esc(item.example)}</button>`;
  return `<article class="lr-ind-card"><div class="lr-ind-main-row">${primary}
  <button class="lr-ind-play" type="button" data-lr-speak="${esc(item.en)}" aria-label="点读 ${esc(item.en)}">🔊 点读</button></div>${example}</article>`;
}
function lrIndustrialGroup(level){
  const list=LEARN_DATA.industrial.filter(item=>item.level===level);
  const n=Math.min(lrShown[level]||LR_PAGE_SIZE,list.length);
  return `<div class="lr-ind-group" data-lr-level="${level}">
    <div class="lr-ind-group-head"><strong>${level===21?'⚡ 第 21 关 · 电工电气':level===22?'🤖 第 22 关 · 自动化控制':'🔧 第 23 关 · 工程短句'}</strong><small>已显示 ${n}/${list.length} 条</small></div>
    <div class="lr-ind-list">${list.slice(0,n).map(lrIndustrialCard).join('')}</div>
    ${n<list.length?`<button class="lr-more" type="button" data-lr-more="${level}">显示更多（剩余 ${list.length-n} 条） ↓</button>`:''}
  </div>`;
}
function lrIndustrialModules(){
  return lrSection('lr-industrial','05 · 电工电气与自动化核心词',
    '原第 21–22 关全 76 条：英文、IPA、中文与现场例句均可点读。分组分批显示，全部可展开。',
    `${lrIndustrialGroup(21)}${lrIndustrialGroup(22)}<p class="lr-note">IPA 沿用原题库，尚待人工逐条复核；点读由 iPhone 美音语音合成。</p>`,
    [['word:电工与电气工程核心词','去练第 21 关'],['word:自动化与智能控制核心词','去练第 22 关']])+ 
  lrSection('lr-phrases','06 · 高频工程短句与句型',
    '原第 23 关全部 40 句，配有中文释义和关键词提示，点按钮直接播放整句。',
    `${lrIndustrialGroup(23)}`,[['word:高频工程短句、词组与句型','去练第 23 关']]);
}
function lrTable(){
  return lrSection('lr-base','01 · 基础个位数（0–9）','从 zero / oh 开始；整张卡片均可点读。',
    `<div class="lr-list">${LEARN_DATA.base.map(item=>lrCard(...item)).join('')}</div>`,[['num:1','去练第 01 关']])+ 
  lrSection('lr-teen','02 · Teen / Ty 并排辨音','11、12、20 先熟悉；13/30 至 19/90 重点听重音与长短。',
    `<div class="lr-list">${LEARN_DATA.extra.map(item=>lrCard(...item)).join('')}</div>
    <div class="lr-tip"><strong>Teen</strong> 通常后音节重读 /iːn/；<strong>Ty</strong> 通常前音节重读，尾音短促。自然美音中的部分 t 会成为闪音 [ɾ]，语境也可能改变重音。</div>
    <div class="lr-pairs">${lrPairs()}</div>`,[['num:4','去练第 04 关']])+ 
  lrSection('lr-place','03 · 大数单位（百到十亿）','三个数字一组，千、百万、十亿逐段识别；长数字固定单行显示。',
    `<div class="lr-list">${LEARN_DATA.large.map(item=>lrCard(...item,{large:true})).join('')}</div>`,[['num:8','去练第 08 关'],['num:9','去练第 09 关']])+ 
  lrSection('lr-ord','04 · 序数词、分数与量纲基础','点读 first / fifth / percent 等高频词，工程单位读法见第 15 关。',
    `<div class="lr-list">${LEARN_DATA.terms.map(item=>lrCard(...item)).join('')}</div>`,[['num:15','去练第 15 关'],['num:16','去练第 16 关']])+ 
  lrIndustrialModules();
}
function lrRules(){
  const maps=[[['num:4','去练第 04 关']],[['num:8','去练第 08 关'],['num:9','去练第 09 关']],[['num:10','去练第 10 关'],['num:15','去练第 15 关']],[]];
  return LEARN_DATA.rules.map((rule,i)=>lrSection('lr-rule-'+i,
    `规律 ${i+1} · ${esc(rule.title.split('｜').slice(1).join('｜'))}`,
    `<span class="lr-rule-tag">${esc(rule.tag)}</span>`,
    `<div class="lr-rule-content">${rule.body.map(x=>`<p>${esc(x)}</p>`).join('')}</div>
    <div class="lr-rule-examples">${rule.examples.map(([speech,label])=>`<button type="button" class="lr-chip" data-lr-speak="${esc(speech)}"><span>🔊 ${esc(speech)}</span><small>${esc(label)}</small></button>`).join('')}</div>`,maps[i])).join('');
}
function renderLearn(){
  const root=$('learnBody');if(!root)return;
  const n=LEARN_DATA.base.length+LEARN_DATA.extra.length+LEARN_DATA.pairs.length*2+LEARN_DATA.large.length+LEARN_DATA.terms.length;
  root.innerHTML=`<div class="lr-head"><div class="lr-kicker">📖 零基础 · 先听会，再闯关</div>
      <h2>英语数字标准读音</h2><p>听到声音就直接反射数字，不必先翻译成中文。</p></div>
    <div class="lr-sticky" id="lrSticky">${learnRateBar()}
      <nav class="lr-jump" aria-label="学习页快速定位">
       <button type="button" data-lr-jump="lr-base">0–9</button><button type="button" data-lr-jump="lr-teen">Teen/Ty</button>
       <button type="button" data-lr-jump="lr-place">大数</button><button type="button" data-lr-jump="lr-ord">序数/分数</button>
       <button type="button" data-lr-jump="lr-industrial">工业词句</button><button type="button" data-lr-jump="lr-rules">听音规律</button>
      </nav></div>
    <div class="lr-block-title">A · 数字单词与标准读音全景表 <small>数字 ${n} 项 · 工业词句 ${LEARN_DATA.industrial.length} 项</small></div>
    ${lrTable()}
    <div class="lr-block-title" id="lr-rules">B · 英语数字听音规律与反射指南</div>
    ${lrRules()}
    <div class="card lr-section lr-finish"><h2>听懂后立即练习</h2>
      <p class="lr-desc">先从第 01 关开始，再挑战 Teen / Ty、大数与工程数字。</p>
      ${lrPractice([['num:1','去练第 01 关']])}</div>`;
}
function initLearnUI(){
  const root=$('learnBody');if(!root)return;
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-lr-rate')){
      const newRate=Number(b.dataset.lrRate);
      if(newRate!==.7&&newRate!==1)return;
      learnRate=newRate;
      try{localStorage.setItem(LEARN_RATE_KEY,String(learnRate));}catch(e){}
      root.querySelectorAll('[data-lr-rate]').forEach(button=>{
        const active=Number(button.dataset.lrRate)===learnRate;
        button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
      });
      return;
    }
    if(b.hasAttribute('data-lr-speak')){learnSpeak(b.dataset.lrSpeak);return;}
    if(b.hasAttribute('data-lr-jump')){
      const target=document.getElementById(b.dataset.lrJump);
      if(target){try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){target.scrollIntoView();}}
      return;
    }
    if(b.hasAttribute('data-lr-more')){
      const level=Number(b.dataset.lrMore);
      if(![21,22,23].includes(level))return;
      lrShown[level]+=LR_PAGE_SIZE;
      const group=root.querySelector('.lr-ind-group[data-lr-level="'+level+'"]');
      if(group)group.outerHTML=lrIndustrialGroup(level);
      return;
    }
    if(b.hasAttribute('data-lr-course')){
      learnStopSpeech();
      const id=b.dataset.lrCourse;
      if(allLessons().some(x=>x.id===id))startSession(id);
      else toast('未找到对应关卡');
    }
  });
  renderLearn();
}
initLearnUI();
