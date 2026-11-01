/* 基础学习 UI：学习内容全部存放 learn-data.js。所有训练继续共用原课程题库。 */
'use strict';
const learnData=window.LEARN_DATA||{modules:[],dictionary:[],test:[],minimalPairs:[],learnWeeks:[]};
let learnView='overview', learnPairPage=0, learnDictFilter='all', learnDictSearch='', learnDictPage=0;
let learnTest=null, learnSpeechToken=0, learnRecognition=null;
function learnRecords(){
  if(!state.learn||typeof state.learn!=='object')state.learn={done:{},days:{},test:null};
  if(!state.learn.done||typeof state.learn.done!=='object')state.learn.done={};
  if(!state.learn.days||typeof state.learn.days!=='object')state.learn.days={};
  return state.learn;
}
function learnRemember(){try{persist();}catch(e){toast('本机存储暂不可用，学习记录可能不能保存');}}
function learningHintForLesson(id,record){
  const m=({ 'num:2':1,'num:3':1,'num:4':1,'num:6':2,'num:7':2,'num:8':2,'num:9':2,
    'num:10':3,'num:11':3,'num:12':3,'num:13':3,'num:14':3,'num:15':3 })[id]||(String(id).startsWith('word:')?4:null);
  const learned=m&&learnRecords().done[['','twins','place','codes','dictionary'][m]];
  const best=Number(record?.last?.avgMs);
  return (m&&!learned?'建议先学习：模块 '+m+' · ':'')+(Number.isFinite(best)&&best>200?'小挑战：本轮再快 0.2 秒':'');
}
function learnStopped(){
  learnSpeechToken++;
  try{window.speechSynthesis?.cancel();}catch(e){}
  if(learnRecognition){try{learnRecognition.onresult=null;learnRecognition.onerror=null;learnRecognition.abort();}catch(e){}learnRecognition=null;}
}
function learnTts(text,rate=1,onEnd=null,onError=null){
  const token=++learnSpeechToken;
  if(typeof window.SpeechSynthesisUtterance!=='function'||!window.speechSynthesis){
    toast('Safari 当前无法合成英文语音，可继续查看文字并自检。');onError?.();return;
  }
  try{
    const synth=window.speechSynthesis;
    synth.cancel();if(synth.paused)synth.resume();
    const utterance=new window.SpeechSynthesisUtterance(String(text||''));
    const config=voiceForAccent('en-US');
    utterance.lang='en-US';utterance.rate=rate;utterance.pitch=1;utterance.volume=1;
    if(config?.voice)utterance.voice=config.voice;
    utterance.onend=()=>{if(token===learnSpeechToken)onEnd?.(performance.now());};
    utterance.onerror=()=>{if(token===learnSpeechToken){toast('语音未正常播放，可手动重听或继续学习');onError?.();}};
    synth.speak(utterance);
  }catch(e){toast('系统语音被限制，请重新点击播放');onError?.();}
}
function learnSpeak(text,rate=1){learnTts(text,rate);}
function learnPairAudio(pair,rate){
  learnTts(pair.teen,rate,()=>{
    setTimeout(()=>{
      if(learnView==='twins')learnTts(pair.ty,rate);
    },rate===.6?550:300);
  });
}
function learnGo(id){
  learnStopped();learnView=id;learnPairPage=0;learnDictPage=0;
  renderLearn();const sc=$('learnScroll');if(sc)sc.scrollTop=0;
}
function learnGoLesson(id){
  if(!allLessons().some(x=>x.id===id)){toast('目标课程暂不可用');return;}
  learnStopped();learnView='overview';startSession(id);
}
function learnComplete(id){learnRecords().done[id]=true;learnRemember();renderLearn();toast('已标记掌握，可返回继续学习');}
function learnFooter(id,level){return `<button class="learn-ack" data-learn-done="${esc(id)}">✓ ${learnRecords().done[id]?'已标记掌握':'标记已学习'}</button><button class="learn-big-btn" data-learn-lesson="${esc(level)}">🎯 掌握了，去闯对应关卡 →</button>`;}
function learnBack(){return '<button class="learn-back" data-learn-open="overview">‹ 返回基础学习</button>';}
function learnStats(){
  const rounds=(state.trainingHistory||[]).filter(x=>Number.isFinite(Number(x.avgMs))&&Number(x.avgMs)>0);
  if(rounds.length<2)return '完成两轮有效训练后，显示首次至最新的反应时间变化。';
  const first=Number(rounds[0].avgMs),last=Number(rounds[rounds.length-1].avgMs),delta=(first-last)/1000;
  return `首次 ${msText(first)} → 最近 ${msText(last)} · ${delta>=0?'缩短':'增加'} ${Math.abs(delta).toFixed(2)}s`;
}
function learnIntro(){
  const data=learnRecords(),test=data.test;
  return `<div class="card learn-intro"><h2 class="learn-title">为什么数字都认识，却还是听不懂？</h2>
    <div class="learn-note">关键不在背中文意思，而在训练声音反射：<strong>听到声音 → 直接想到数字</strong>，不经过“英文→中文→计算”。30 秒了解目标。</div>
    <div class="learn-steps" style="margin-top:9px"><div class="learn-step">① 慢听 0.6x / 0.75x，建立声音形状。</div>
    <div class="learn-step">② 常速 1.0x 限时作答，不在脑中翻译。</div><div class="learn-step">③ 错题大声读 3 遍，再练同关。</div></div></div>
    <div class="card learn-intro"><h2 class="learn-title">两分钟水平测试 · 10 题</h2>
    <p class="learn-note">个数、teen/ty、两位、百位、千位与年份。每题从语音真实结束后计时。</p>
    ${test?`<p class="learn-note">上次 ${test.correct}/10 · ${test.avgMs===null?'无有效计时':msText(test.avgMs)} · 推荐第 ${String(test.lesson).padStart(2,'0')} 关</p>`:''}
    <button class="learn-big-btn" data-learn-open="test">🎧 ${test?'重新测试':'开始水平测试'}</button></div>
    <div class="card learn-intro"><h2 class="learn-title">学习模块 · 先学后练</h2>
    <div class="learn-grid">${learnData.modules.map((m,i)=>`<button class="learn-tile" data-learn-open="${esc(m.id)}"><strong>${i+1}. ${esc(m.title)}</strong><small>${esc(m.subtitle)}</small><small>${data.done[m.id]?'✓ 已学习':'点按进入 · 听音拆解'}</small></button>`).join('')}</div></div>
    <div class="card learn-intro"><h2 class="learn-title">App 使用指南</h2><div class="learn-steps">
    <div class="learn-step">🎧 听音按键练听力 · 🎙️ 看数开口练表达 · ⌨️ 拼写单词练准确度。</div>
    <div class="learn-step">反应时间从朗读结束开始；通关须正确率 ≥90% 且平均反应 &lt;1.5s。</div>
    <div class="learn-step">错题会进入「特训与错题台」，建议每天只复盘高频错误。</div></div></div>
    <div class="card learn-intro"><h2 class="learn-title">推荐路径 · 零基础每天 10–15 分钟</h2><p class="learn-note">前 3–5 天持续练前两模块，再推进大数和工程情境。完成一项点一次打卡：</p>
    ${learnData.learnWeeks.map(w=>`<div class="learn-note" style="font-weight:800;margin:10px 0 6px">${esc(w.title)}</div><div class="learn-progress">${w.days.map((d,i)=>`<button class="learn-day ${data.days[w.id+':'+i]?'done':''}" data-learn-day="${w.id}:${i}" title="${esc(d)}"><span>${i+1}</span><span>${data.days[w.id+':'+i]?'✓':'○'}</span></button>`).join('')}</div><p class="learn-note">${esc(w.days.join(' · '))}</p>`).join('')}</div>
    <div class="card learn-intro"><h2 class="learn-title">成长可视化</h2><p class="learn-note">${esc(learnStats())}</p><div class="learn-note">建议每一关挑战“再快 0.2 秒”；只和自己的历史成绩比较。</div></div>
    <div class="card learn-intro"><h2 class="learn-title">辅助区 · 常见误区与 FAQ</h2>
    <p class="learn-note">不要边听边翻译；听错不要放弃；不要只听不开口。</p>
    ${learnData.faq.map(x=>`<details class="learn-accord"><summary>${esc(x.q)}</summary><p class="learn-note">${esc(x.a)}</p></details>`).join('')}
    <h3 class="learn-title">术语快速点读</h3>${learnData.quick.map(x=>`<button class="learn-mini-btn" data-learn-say="${esc(x.word.split(',')[0])}" data-learn-rate="1" style="display:block;text-align:left;width:100%;margin:4px 0">🔊 ${esc(x.word)} · ${esc(x.meaning)}</button>`).join('')}</div>`;
}
function learnTwins(){
  const items=learnData.minimalPairs.slice(learnPairPage*2,learnPairPage*2+2);
  return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">🔊 易混音双胞胎 · 7 对</h2>
  <p class="learn-note">teen 重音通常落在后半、长元音 /iː/ 与 /n/ 结尾；ty 通常前半重读、结尾短。美音中部分 t 在自然语流里可弱化为闪音 [ɾ]。<strong>注意</strong>：句子重音会改变读法。</p>
  ${items.map(p=>`<div class="learn-stack" style="margin:12px 0"><div class="learn-pair"><div class="learn-half teen"><small>后段重音 · TEEN</small><strong>${p.nTeen} · ${esc(p.teen)}</strong><code>${esc(p.ipaTeen)}</code></div><div class="learn-half ty"><small>前段重音 · TY</small><strong>${p.nTy} · ${esc(p.ty)}</strong><code>${esc(p.ipaTy)}</code></div></div>
  <div class="learn-compact-actions"><button class="learn-mini-btn" data-learn-pair="${p.nTeen}" data-learn-rate="0.6">🐢 0.6x 慢速对比</button><button class="learn-mini-btn" data-learn-pair="${p.nTeen}" data-learn-rate="1">⚡ 1.0x 实战连读</button></div></div>`).join('')}
  <div class="learn-compact-actions"><button class="learn-mini-btn" data-learn-pair-page="-1" ${learnPairPage===0?'disabled':''}>上一组</button><button class="learn-mini-btn" data-learn-pair-page="1" ${learnPairPage>=3?'disabled':''}>下一组 ${learnPairPage+1}/4</button></div></div>
  <div class="card learn-intro"><h2 class="learn-title">连读与弱读</h2><p class="learn-note">twenty-one：词尾与 one 自然衔接；one hundred and five：and 在快读中可弱化为 /ən/，美音也常省略 and。</p>
  <div class="learn-compact-actions"><button class="learn-mini-btn" data-learn-say="twenty-one" data-learn-rate=".6">🔊 twenty-one</button><button class="learn-mini-btn" data-learn-say="one hundred and five" data-learn-rate="1">🔊 one hundred and five</button></div>
  ${learnFooter('twins','num:4')}</div>`;
}
function learnPlace(){
  return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">📐 三位切分标尺</h2><p class="learn-note">中文每四位进一单位（万），英文每三位进一单位（thousand、million）。看到逗号，直接按英文单位听。</p>
  <div class="learn-digits"><button data-learn-say="one" data-learn-rate=".6">1</button><button data-learn-say="thousand" data-learn-rate=".6">,000<br><small>thousand</small></button><button data-learn-say="million" data-learn-rate=".6">,000<br><small>million</small></button></div>
  <div class="learn-steps"><div class="learn-step">1,000 → <strong>one thousand</strong> · 第一组逗号</div><div class="learn-step">1,000,000 → <strong>one million</strong> · 第二组逗号</div></div></div>
  <div class="card learn-intro"><h2 class="learn-title">三个直接记忆的锚点</h2><div class="learn-stack">${[['10,000','ten thousand','1 万'],['100,000','one hundred thousand','10 万'],['1,000,000','one million','100 万']].map(([n,e,cn])=>`<button class="learn-mini-btn" style="font-size:13px;text-align:left" data-learn-say="${e}" data-learn-rate="1">🔊 ${n} · ${esc(e)} · ${cn}</button>`).join('')}</div><p class="learn-note">不要每次做算术换算。听到 thousand 就对齐三位单位。</p>${learnFooter('place','num:6')}</div>`;
}
function learnCodes(){
  return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">⏱️ 高频编码速查表</h2><p class="learn-note">点开主题 → 点读典型例句；每次只学 1–2 类。</p>
  ${[
    ['年份：拆两半读',[['1998','nineteen ninety-eight'],['2008','two thousand eight'],['2026','twenty twenty-six']]],
    ['电话：oh / double / triple',[['0','oh'],['55','double five'],['666','triple six']]],
    ['时间：表盘 past / to / quarter / half',[['3:15','quarter past three'],['3:30','half past three'],['3:45','quarter to four']]],
    ['工业量纲与公差',learnData.units.map(u=>[u.meaning,u.phrase])]
  ].map((section,index)=>`<details class="learn-accord" ${index===0?'open':''}><summary>${esc(section[0])}</summary>${index===2?'<svg viewBox="0 0 300 145" width="100%" role="img" aria-label="时间表盘：past 表示经过，to 表示差多少分钟，quarter 为 15 分钟，half 为 30 分钟"><circle cx="72" cy="72" r="58" fill="#F0F9F5" stroke="#80CBA3" stroke-width="2"/><circle cx="72" cy="72" r="4" fill="#087E45"/><path d="M72 72 L72 29 M72 72 L112 72" stroke="#175D3F" stroke-width="4" stroke-linecap="round"/><text x="63" y="20" font-size="12" fill="#355846">12</text><text x="127" y="76" font-size="12" fill="#355846">3</text><text x="69" y="140" font-size="12" fill="#355846">6</text><text x="8" y="76" font-size="12" fill="#355846">9</text><text x="157" y="48" font-size="13" fill="#087E45">past：过了</text><text x="157" y="72" font-size="13" fill="#087E45">to：差到</text><text x="157" y="96" font-size="12" fill="#557369">quarter＝15分</text><text x="157" y="119" font-size="12" fill="#557369">half＝30分</text></svg>':''}<div class="learn-stack">${section[1].map(([cn,en])=>`<button class="learn-mini-btn" style="text-align:left" data-learn-say="${esc(en)}" data-learn-rate=".8">🔊 ${esc(cn)} → ${esc(en)}</button>`).join('')}</div></details>`).join('')}
  ${learnFooter('codes','num:10')}<button class="learn-mini-btn" style="width:100%;margin-top:8px" data-learn-lesson="num:15">⚡ 工业量纲直接练第 15 关</button></div>`;
}
function learnSyllableParts(w){
  return w.syllables.flatMap((group,wi)=>group.map((part,i)=>`<span class="${i===w.syllableStress?.[wi]?'stressed':''}">${esc(part)}${i===group.length-1?'':'·'}</span>`).concat(wi<w.syllables.length-1?['<span>　</span>']:[])).join('');
}
function learnDictionary(){
  const filters=[['all','全部'],['electrical','⚡ 电气'],['motion','🤖 运动与自动化'],['field','🔧 现场短句']];
  const list=learnData.dictionary.filter(w=>(learnDictFilter==='all'||w.category===learnDictFilter)&&(!learnDictSearch||[w.english,w.meaning,w.id].join(' ').toLowerCase().includes(learnDictSearch.toLowerCase())));
  const pages=Math.max(1,Math.ceil(list.length/4));learnDictPage=Math.min(learnDictPage,pages-1);
  return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">🛠️ 工业有声词典 · 116 条原词库</h2><p class="learn-note">来源：第 21 关 38 条、第 22 关 38 条、第 23 关 40 条。原 IPA 存在待核音标，标记「待校核」不等于已获标准词典核验。</p>
  <input class="learn-search" id="learnWordSearch" placeholder="搜索英文 / 中文 / 原 ID" value="${esc(learnDictSearch)}" autocomplete="off">
  <div class="learn-filters">${filters.map(([id,label])=>`<button class="${id===learnDictFilter?'active':''}" data-learn-filter="${id}">${label}</button>`).join('')}</div>
  <p class="learn-note">命中 ${list.length} 条 · 第 ${learnDictPage+1}/${pages} 页 · 每页 4 条</p>
  ${list.slice(learnDictPage*4,learnDictPage*4+4).map(w=>`<div class="learn-word"><div class="learn-word-title">${esc(w.english)}</div><div class="learn-word-ipa">${esc(w.ipa)} ${w.check?'<span class="learn-check">⚠ IPA 待词典核验</span>':''}${w.categoryCheck?'<span class="learn-check"> · 分类待确认</span>':''}</div>
    <div class="learn-syll">${learnSyllableParts(w)}</div><p class="learn-note">${esc(w.meaning)} · ${esc(w.example)}</p>
    <div class="learn-word-actions"><button data-learn-word="${esc(w.id)}" data-learn-rate="1">🔊 听发音</button><button data-learn-pronounce="${esc(w.id)}">🎙️ 开口试读</button></div>
    <button class="learn-ack" data-learn-selfcheck="${esc(w.id)}">✓ 自检通过</button><div class="learn-note" id="pronounce-${esc(w.id)}" aria-live="polite"></div></div>`).join('')||'<p class="learn-note">没有匹配词条。</p>'}
  <div class="learn-compact-actions"><button class="learn-mini-btn" data-learn-dictpage="-1" ${learnDictPage===0?'disabled':''}>上一页</button><button class="learn-mini-btn" data-learn-dictpage="1" ${learnDictPage===pages-1?'disabled':''}>下一页</button></div>
  ${learnFooter('dictionary','word:电工与电气工程核心词')}
  <div class="learn-compact-actions"><button class="learn-mini-btn" data-learn-lesson="word:自动化与智能控制核心词">第 22 关</button><button class="learn-mini-btn" data-learn-lesson="word:高频工程短句、词组与句型">第 23 关</button></div>
  </div>`;
}
function learnPronounce(id){
  const item=learnData.dictionary.find(w=>w.id===id),target=$('pronounce-'+id);if(!item||!target)return;
  if(learnRecognition){try{learnRecognition.abort();}catch(e){}learnRecognition=null;}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){target.textContent='此 Safari 不支持语音识别，请听标准音后自行读三遍（自检模式）。';return;}
  try{
    const recognizer=new Recognition();learnRecognition=recognizer;recognizer.lang='en-US';recognizer.interimResults=true;recognizer.continuous=false;
    target.textContent='🎙️ 正在听你读…';
    recognizer.onresult=e=>{
      let speech='';for(let i=e.resultIndex;i<e.results.length;i++)speech=e.results[i][0]?.transcript||speech;
      const norm=t=>String(t).toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
      const ok=norm(speech)===norm(item.english)||norm(speech).includes(norm(item.english));
      target.textContent='听到：'+speech+(ok?' ✓ 已匹配，可再读两遍':' · 可自行纠正并再读');
      if(ok){try{recognizer.stop();}catch(e){}}
    };
    recognizer.onerror=e=>{target.textContent='语音识别不可用（'+String(e.error||'权限/网络')+'），请自行读三遍后自检。';};
    recognizer.onend=()=>{if(learnRecognition===recognizer)learnRecognition=null;};
    recognizer.start();
  }catch(e){target.textContent='无法启动麦克风，已切换手动自检，请自行朗读三遍。';}
}
function learnClosed(){
  const confusion=Object.entries(state.confusionPairs||{}).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,5);
  return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">🔗 学完即练 · 闭环</h2><div class="learn-steps"><div class="learn-step">① 点读学习卡片（0.6x）并跟读三遍。</div><div class="learn-step">② 切回 1.0x，进入关卡练 10 题。</div><div class="learn-step">③ 进错题台复盘，争取下一轮再快 0.2 秒。</div></div>
  <h3 class="learn-title" style="margin-top:13px">最近易混对强化</h3><p class="learn-note">${confusion.length?confusion.map(([k,v])=>esc(k)+' 已练错 '+v+' 次').join(' · '):'尚无易混数字记录，训练后显示易错对次数与趋势。'}</p>
  ${learnFooter('closed','num:1')}</div>`;
}
function learnTestMarkup(){
  if(!learnTest)learnStartTest();
  const t=learnTest,question=learnData.test[t.index];
  if(t.finished){
    const results=t.responses,correct=results.filter(x=>x.correct).length,valid=results.filter(x=>x.time!==null);
    const avg=valid.length?Math.round(valid.reduce((s,x)=>s+x.time,0)/valid.length):null;
    const pairWrong=results.filter(x=>x.kind==='pair'&&!x.correct).length,largeWrong=results.filter(x=>['hundred','large','year'].includes(x.kind)&&!x.correct).length;
    const lesson=pairWrong>=3?4:largeWrong>=2?6:correct===10&&avg!==null&&avg<1500?10:pairWrong?2:correct>=8?6:1;
    learnRecords().test={correct,avgMs:avg,lesson,answers:results,completedAt:Date.now()};learnRemember();
    return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">水平测试结果</h2><div class="big-percent">${correct} / 10</div>
      <p class="learn-note">平均反应：${avg===null?'无有效计时':msText(avg)} · 易混对错 ${pairWrong} 题 · 大数字错 ${largeWrong} 题</p>
      <p class="learn-note">建议从第 ${String(lesson).padStart(2,'0')} 关开始，练习后重测。</p>
      <button class="learn-big-btn" data-learn-lesson="num:${lesson}">前往推荐关卡 →</button>
      <button class="learn-ack" data-learn-retest="1">重新测试</button></div>`;
  }
  return learnBack()+`<div class="card learn-intro"><h2 class="learn-title">🎧 水平测试 ${t.index+1} / 10</h2><p class="learn-note">每题语音结束后开始计时；输入数字后点确认。不认识就猜，不先翻译。</p>
    <button class="learn-big-btn" data-learn-test-play="1">🔊 ${t.readyAt===null?'播放题目':'再听一遍'}</button>
    <div class="answer-display" style="margin-top:15px">${esc(t.input)||'——'}</div>
    <div class="learn-note" id="learnTestStatus">${t.readyAt===null?'播放后输入数字':'已播放 · 正在计反应时间'}</div>
    <div class="learn-test-keypad">${['1','2','3','4','5','6','7','8','9','←','0','确认 ✓'].map(v=>`<button class="${v==='确认 ✓'?'confirm':''}" data-learn-key="${v}">${v}</button>`).join('')}</div>
    <p class="learn-note">已答 ${t.responses.length} / 10 · 答对 ${t.responses.filter(x=>x.correct).length} 题</p></div>`;
}
function learnStartTest(){learnStopped();learnTest={index:0,input:'',readyAt:null,responses:[],finished:false,token:0};}
function learnTestPlay(){
  if(!learnTest||learnTest.finished)return;
  learnTest.readyAt=null;const question=learnData.test[learnTest.index];const token=++learnTest.token;
  learnTts(question.audio,1,at=>{
    if(learnTest&&learnTest.token===token){learnTest.readyAt=at;const label=$('learnTestStatus');if(label)label.textContent='听完了 · 可以作答（反应时间从此刻起算）';}
  },()=>{const label=$('learnTestStatus');if(label)label.textContent='语音失败：本题时间不计入均值，可以尝试重听或继续作答';});
}
function learnTestKey(key){
  const t=learnTest;if(!t||t.finished)return;
  if(key==='←'){t.input=t.input.slice(0,-1);renderLearn();return;}
  if(key!=='确认 ✓'){t.input=(t.input+key).slice(0,12);renderLearn();return;}
  if(!t.input){toast('请先输入数字');return;}
  const q=learnData.test[t.index];const correct=String(Number(t.input))===String(Number(q.answer));
  const time=t.readyAt!==null?Math.max(0,Math.round(performance.now()-t.readyAt)):null;
  t.responses.push({answer:q.answer,given:t.input,kind:q.kind,time,correct});
  learnStopped();t.index++;t.input='';t.readyAt=null;t.token++;
  if(t.index>=learnData.test.length)t.finished=true;
  renderLearn();if(!t.finished)learnTestPlay();
}
function renderLearn(){
  const root=$('learnBody');if(!root)return;
  let html='';
  if(learnView==='overview')html=learnIntro();
  else if(learnView==='twins')html=learnTwins();
  else if(learnView==='place')html=learnPlace();
  else if(learnView==='codes')html=learnCodes();
  else if(learnView==='dictionary')html=learnDictionary();
  else if(learnView==='closed')html=learnClosed();
  else if(learnView==='test')html=learnTestMarkup();
  root.innerHTML=html;
}
function initLearnUI(){
  const root=$('learnBody');if(!root)return;
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const d=b.dataset;
    if(d.learnOpen){if(d.learnOpen==='test')learnStartTest();learnGo(d.learnOpen);}
    else if(d.learnLesson)learnGoLesson(d.learnLesson);
    else if(d.learnDone)learnComplete(d.learnDone);
    else if(d.learnDay){const r=learnRecords();r.days[d.learnDay]=!r.days[d.learnDay];learnRemember();renderLearn();}
    else if(d.learnSay)learnSpeak(d.learnSay,Number(d.learnRate)||1);
    else if(d.learnPair){const pair=learnData.minimalPairs.find(p=>p.nTeen===Number(d.learnPair));if(pair)learnPairAudio(pair,Number(d.learnRate)||1);}
    else if(d.learnPairPage){learnPairPage=clamp(learnPairPage+Number(d.learnPairPage),0,3);renderLearn();}
    else if(d.learnFilter){learnDictFilter=d.learnFilter;learnDictPage=0;renderLearn();}
    else if(d.learnDictpage){learnDictPage=Math.max(0,learnDictPage+Number(d.learnDictpage));renderLearn();}
    else if(d.learnWord){const w=learnData.dictionary.find(x=>x.id===d.learnWord);if(w)learnSpeak(w.english,Number(d.learnRate)||1);}
    else if(d.learnPronounce)learnPronounce(d.learnPronounce);
    else if(d.learnSelfcheck){const el=$('pronounce-'+d.learnSelfcheck);if(el)el.textContent='✓ 已手动自检。建议再大声跟读 2 遍。';}
    else if(d.learnRetest) {learnStartTest();renderLearn();}
    else if(d.learnTestPlay)learnTestPlay();
    else if(d.learnKey)learnTestKey(d.learnKey);
  });
  root.addEventListener('input',e=>{
    if(e.target.id==='learnWordSearch'){
      const search=e.target.value;const pos=e.target.selectionStart||search.length;
      learnDictSearch=search;learnDictPage=0;renderLearn();
      const box=$('learnWordSearch');if(box){box.focus();box.setSelectionRange(pos,pos);}
    }
  });
  renderLearn();
}
initLearnUI();


