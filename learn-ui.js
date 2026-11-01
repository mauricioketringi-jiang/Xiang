/* 基础学习 V2：独立点读表和四项反射规律，仅数字点读表和反射规律 */
'use strict';
const LEARN_RATE_KEY='voice_reflex_learn_rate_v2';
const LEARN_DATA=window.LEARN_DATA||{base:[],extra:[],pairs:[],large:[],terms:[],rules:[]};
let learnRate=1;
try{const stored=Number(localStorage.getItem(LEARN_RATE_KEY));if(stored===.7||stored===1)learnRate=stored;}catch(e){}
let learnSpeechSeq=0;
function learnStopSpeech(){
  ++learnSpeechSeq;
  try{window.speechSynthesis?.cancel();}catch(e){}
}
function learnSpeak(text){
  const content=String(text||'').trim();
  if(!content)return;
  const Speech=window.SpeechSynthesisUtterance, synth=window.speechSynthesis;
  if(typeof Speech!=='function'||!synth){toast('浏览器暂不支持语音播放，可先阅读发音要领。');return;}
  try{
    learnStopSpeech();
    const utterance=new Speech(content);
    utterance.lang='en-US';utterance.rate=learnRate;utterance.pitch=1;utterance.volume=1;
    const config=voiceForAccent('en-US');
    if(config?.voice)utterance.voice=config.voice;
    utterance.onerror=()=>toast('语音播放失败，请再次点读或检查静音开关');
    if(synth.paused)synth.resume();
    synth.speak(utterance);
  }catch(e){toast('当前设备阻止语音播放，请手动再点一次');}
}
function learnRateBar(){
  return `<div class="lr-speed" role="group" aria-label="点读速度">
    <span>点读速度</span><button type="button" class="${learnRate===.7?'active':''}" data-lr-rate=".7" aria-pressed="${learnRate===.7}">🐢 0.7x 慢速</button><button type="button" class="${learnRate===1?'active':''}" data-lr-rate="1" aria-pressed="${learnRate===1}">1.0x 常速</button></div>`;
}
function lrCard(n,word,ipa,hint,audio,example){
  const speech=esc(audio||word);
  const extra=example&&example!==(audio||word)
    ?`<button type="button" class="lr-example-btn" data-lr-speak="${esc(example)}">🔊 例读：${esc(example)}</button>`:'';
  return `<div class="lr-row">
    <button type="button" class="lr-card" data-lr-speak="${speech}" aria-label="点读 ${esc(word)}">
      <strong class="lr-num">${esc(n)}</strong>
      <span class="lr-word"><strong>${esc(word)}</strong><small class="lr-ipa">${esc(ipa)}</small><small class="lr-hint">${esc(hint)}</small></span>
      <span class="lr-play">🔊 点读</span>
    </button>${extra}</div>`;
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
function lrSection(id,heading,subtitle,body){
  return `<section class="card lr-section" id="${id}"><h2>${heading}</h2><p class="lr-desc">${subtitle}</p>${body}</section>`;
}
function lrTable(){
  return lrSection('lr-base','01 · 基础个位数（0–9）','从 zero / oh 开始；整张卡片均可点读。',
    `<div class="lr-list">${LEARN_DATA.base.map(item=>lrCard(...item)).join('')}</div>`)+
  lrSection('lr-teen','02 · Teen / Ty 并排辨音','11、12、20 先熟悉；13/30 至 19/90 重点听重音与长短。',
    `<div class="lr-list">${LEARN_DATA.extra.map(item=>lrCard(...item)).join('')}</div>
     <div class="lr-tip"><strong>Teen</strong> 多为后音节重读 /iːn/；<strong>Ty</strong> 通常前音节重读、尾音较短。自然美音中的部分 t 会成为闪音 [ɾ]。句子重音可改变典型重音分布。</div>
     <div class="lr-pairs">${lrPairs()}</div>`)+
  lrSection('lr-place','03 · 大数单位（百到十亿）','英文按每三位分组，不要在脑内做中文单位换算。',
    `<div class="lr-list">${LEARN_DATA.large.map(item=>lrCard(...item)).join('')}</div>`)+
  lrSection('lr-ord','04 · 序数词、分数与量纲基础','点读 first / fifth / percent 等高频词；工程单位读法见第 15 关。',
    `<div class="lr-list">${LEARN_DATA.terms.map(item=>lrCard(...item)).join('')}</div>`);
}
function lrRules(){
  return LEARN_DATA.rules.map((rule,i)=>lrSection('lr-rule-'+i,`规律 ${i+1} · ${esc(rule.title.split('｜').slice(1).join('｜'))}`,
    `<span class="lr-rule-tag">${esc(rule.tag)}</span>`,
    `<div class="lr-rule-content">${rule.body.map(x=>`<p>${esc(x)}</p>`).join('')}</div>
      <div class="lr-rule-examples">${rule.examples.map(([speech,label])=>`<button type="button" class="lr-chip" data-lr-speak="${esc(speech)}"><span>🔊 ${esc(speech)}</span><small>${esc(label)}</small></button>`).join('')}</div>`)).join('');
}
function renderLearn(){
  const root=$('learnBody');if(!root)return;
  root.innerHTML=`<div class="lr-head"><div class="lr-kicker">📖 零基础 · 先听会，再闯关</div>
      <h2>英语数字标准读音</h2><p>听到声音就直接反射数字，不必先翻译成中文。</p>
      ${learnRateBar()}</div>
    <nav class="lr-jump" aria-label="学习页快速定位">
      <button type="button" data-lr-jump="lr-base">0–9</button><button type="button" data-lr-jump="lr-teen">Teen/Ty</button>
      <button type="button" data-lr-jump="lr-place">大数</button><button type="button" data-lr-jump="lr-ord">序数/分数</button>
      <button type="button" data-lr-jump="lr-rules">听音规律</button>
    </nav>
    <div class="lr-block-title">A · 数字单词与标准读音全景表 <small>共 ${LEARN_DATA.base.length+LEARN_DATA.extra.length+LEARN_DATA.pairs.length*2+LEARN_DATA.large.length+LEARN_DATA.terms.length} 项</small></div>
    ${lrTable()}
    <div class="lr-block-title" id="lr-rules">B · 英语数字听音规律与反射指南</div>
    ${lrRules()}
    <div class="card lr-section lr-finish"><h2>听懂后立即练习</h2>
      <p class="lr-desc">先从第 01 关开始，再依次挑战 Teen / Ty、大数与工程数字。</p>
      <button class="btn primary full" type="button" data-lr-course="num:1">🎯 开始第 01 关 · 听音按键</button></div>`;
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
      renderLearn();return;
    }
    if(b.hasAttribute('data-lr-speak')){learnSpeak(b.dataset.lrSpeak);return;}
    if(b.hasAttribute('data-lr-jump')){
      const target=document.getElementById(b.dataset.lrJump);
      if(target){try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){target.scrollIntoView();}}
      return;
    }
    if(b.hasAttribute('data-lr-course')){
      learnStopSpeech();
      const id=b.dataset.lrCourse;
      if(allLessons().some(x=>x.id===id))startSession(id);
    }
  });
  renderLearn();
}
initLearnUI();


