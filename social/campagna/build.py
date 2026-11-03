import json
head=open('../significato/sig.html').read()
head=head[:head.index('<body>')+6].replace('</head>','''<style>
.ph{position:absolute;overflow:hidden;box-shadow:0 40px 70px -26px rgba(0,0,0,.8)}.ph img{width:100%;height:100%;object-fit:cover;display:block}
.chip{display:inline-block;background:#fff;color:var(--ink);font:800 30px "DM Sans";padding:12px 28px;border-radius:99px}.chip.g{background:var(--gold)}
.ig{display:inline-flex;align-items:center;gap:10px;font:800 32px "DM Sans";color:#fff;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3);padding:12px 26px;border-radius:99px}
.card{border-radius:36px;padding:22px 36px;min-height:0;flex:1;display:flex;flex-direction:column;justify-content:center}.card b{display:block;font:800 42px/1.1 "DM Sans"}.card span{display:block;font:500 30px/1.22 "DM Sans";margin-top:6px;opacity:.92}
.card.gold{background:var(--gold);color:var(--ink)}.card.vi{background:linear-gradient(150deg,#5b21b6,#7c3aed);border:2px solid rgba(255,255,255,.25)}.card.li{background:#c4b5fd;color:var(--ink)}.card.wh{background:#fff;color:var(--ink)}
.stack{position:absolute;left:70px;right:70px;display:flex;flex-direction:column;gap:16px;z-index:8}
.fade{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,#12062b 12%,rgba(18,6,43,0));z-index:5}
.strike{position:relative;display:inline-block}.strike::after{content:"";position:absolute;left:-2%;right:-2%;top:52%;height:14px;background:var(--gold);transform:rotate(-3deg);border-radius:4px}
.ghost{color:transparent;-webkit-text-stroke:4px rgba(255,255,255,.55)}
.sec .h{font:400 30px "Anton";color:var(--gold);letter-spacing:.08em}
</style></head>''',1)
js=open('../significato/sig.html').read()
js=js[js.index('<script>'):]
BR='<div class="brand"><img src="../../assets/fox-96.png" alt="">Mirai</div>'
HAND=lambda r='Il futuro inizia da noi.':f'<div class="handle"><span>@lista.mirai</span><b>{r}</b></div>'
def sec(cls,id,inner,v='v0'):
    return f'<section class="c {cls} {v}" id="{id}"><div class="blob b1"></div><div class="blob b2"></div>{inner}</section>\n'
team=[('giorgia','Giorgia','Maino','4T','giorgia_maino','Candidata'),('daniele','Daniele','Fabbri','4F','daniele.fabbri__','Candidato'),('valerio','Valerio','Sessa','3E','___valerio_00_','Candidato'),('annalaura','Annalaura','Giongo','2T','annalauragiongo_','Candidata')]
H=''
# ---------- CANDIDATI (post) ----------
faces=''.join(f'<div style="width:215px;height:215px;border-radius:50%;overflow:hidden;border:8px solid var(--gold);margin-left:{0 if i==0 else -38}px;box-shadow:0 20px 40px -14px rgba(0,0,0,.7)"><img src="img/{t[0]}.jpg" style="width:100%;height:100%;object-fit:cover;object-position:50% 14%"></div>' for i,t in enumerate(team))
H+=sec('p','c0',BR+f'''<div class="n">01/06</div>
 <div style="position:absolute;left:70px;right:70px;top:170px;z-index:8"><span class="kick">Rappresentanza d’istituto</span>
  <div class="A" style="margin-top:28px"><div class="w" data-box="940" data-max="230">Ci presentiamo.</div><div class="o" data-box="940" data-max="170">Lista 3</div><div class="g" data-box="940" data-max="260">Mirai.</div></div></div>
 <div style="position:absolute;left:70px;bottom:210px;display:flex;z-index:8">{faces}</div>'''+HAND('Scorri →'),'v0')
def cand(id,n,t,v):
    return sec('p',id,f'''<div class="ph" style="left:0;top:0;right:0;height:1350px;box-shadow:none"><img src="img/{t[0]}.jpg" style="object-position:50% 14%"></div>
 <div class="fade" style="height:760px"></div><div style="position:absolute;left:0;right:0;top:0;height:200px;background:linear-gradient(180deg,rgba(18,6,43,.85),rgba(18,6,43,0));z-index:5"></div>{BR}<div class="n">{n}/06</div>
 <div style="position:absolute;left:70px;right:70px;bottom:140px;z-index:8"><span class="chip g">{t[5]} · Classe {t[3]}</span>
  <div class="A" style="margin-top:14px"><div class="w" data-box="940" data-max="150">{t[1]}</div><div class="g" data-box="940" data-max="200">{t[2]}</div></div></div>
 <div class="handle"><span>@{t[4]}</span><b>Lista 3 · Mirai</b></div>''',v)
H+=cand('c1','02',team[0],'v1')+cand('c2','03',team[1],'v0')+cand('c3','04',team[2],'v2')+cand('c4','05',team[3],'v1')
# chiusura
H+=sec('p','c5',BR+f'''<div class="n">06/06</div><div class="ring" style="width:880px;height:880px;left:100px;top:180px"></div>
 <div class="ctr" style="top:150px;bottom:230px"><img src="../../assets/logo.png" alt="" style="width:360px;height:360px;border-radius:50%;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)">
  <span class="kick" style="margin-top:14px">Lista 3 · Mirai</span>
  <div class="A" style="display:flex;flex-direction:column;align-items:center"><div class="w" data-box="940" data-max="170">Quattro facce.</div><div class="g" data-box="940" data-max="230">Un futuro.</div></div>
  <div class="desc" style="font-size:40px;max-width:820px">Seguici per scoprire il programma e le idee di tutta la lista.</div></div>'''+HAND('@lista.mirai'),'v0')
# ---------- PROGRAMMA (post) ----------
def prog(id,n,kick,title1,title2,items,cols,v):
    cards=''.join(f'<div class="card {c}"><b>{t}</b><span>{x}</span></div>' for (t,x),c in zip(items,cols))
    return sec('p',id,BR+f'<div class="n">{n}/07</div><div style="position:absolute;left:70px;right:70px;top:150px;z-index:8"><span class="kick">{kick}</span><div class="A" style="margin-top:20px;font-size:118px"><span class="w">{title1}</span> <span class="g">{title2}</span></div></div><div class="stack" style="top:{380}px;bottom:175px;">{cards}</div>'+HAND(),v)
H+=sec('p','g0',BR+'''<div class="n">01/07</div>
 <div style="position:absolute;left:70px;right:70px;top:170px;z-index:8"><span class="kick">Rappresentanza d’istituto</span>
  <div class="A" style="margin-top:30px"><div class="g" data-box="940" data-max="420">16 idee.</div><div class="w" data-box="940" data-max="300">4 aree.</div><div class="o" data-box="940" data-max="250">Il programma.</div></div></div>
 <div style="position:absolute;left:70px;right:70px;bottom:210px;z-index:8;display:flex;gap:14px;flex-wrap:wrap"><span class="chip g">Vita scolastica</span><span class="chip">Eventi e socialità</span><span class="chip g">Assemblee</span><span class="chip">Mirai Social</span></div>'''+HAND('Scorri →'),'v1')
H+=prog('g1','02','Area 1','Vita','scolastica.',[('Segnalazioni degli studenti','Un sistema semplice e diretto per raccogliere segnalazioni, problemi e proposte.'),('Community WhatsApp','Valorizzare la community già esistente per comunicare eventi e informazioni importanti.'),('Period Box','Assorbenti e prodotti igienici essenziali gratis per le studentesse.')],['gold','vi','wh'],'v0')
H+=prog('g2','03','Area 2 · Eventi','Eventi e','socialità.',[('Tornei tra classi','Tornei sportivi tra le classi e sfide anche con altri istituti.'),('Settimana dello Studente','Tornei, e-sport, cineforum, corsi e workshop proposti dagli studenti.'),('Snow Galilei','Tutta la scuola un giorno sulla neve, con attrezzatura e DJ set.'),('Fashion Week','Una settimana all’insegna della moda: che classe vincerà?')],['vi','gold','li','wh'],'v1')
H+=prog('g3','04','Area 2 · Eventi','Ancora','eventi.',[('Galile’s Got Talent','Un vero palco per mostrare talenti, passioni e capacità.'),('Eventi serali','Serate a tema in discoteca, eventi e aperitivi per tutti gli studenti.'),('Box di San Valentino','Dediche, messaggi e pensieri recapitati ai diretti interessati.')],['gold','wh','vi'],'v0')
H+=prog('g4','05','Area 3','Assemblee','d’istituto.',[('I temi li scegliamo noi','Gli studenti propongono gli argomenti delle assemblee.'),('Più ospiti','Esperti e professionisti con esperienze interessanti da portare a scuola.'),('Dibattiti e confronti','Domande, dibattiti e confronto tra studenti e ospiti.'),('Orientamento','Momenti dedicati a università e lavoro, con informazioni concrete.')],['li','vi','gold','wh'],'v1')
H+=prog('g5','06','Area 4','Mirai','Social.',[('Gadget d’istituto','Felpe, magliette, accendini e altri prodotti della scuola.'),('Comunicazione social','Informare, raccontare gli eventi e aggiornare tutti sui progetti della lista.')],['gold','vi'],'v0')
H+=sec('p','g6',BR+'''<div class="n">07/07</div>
 <div class="ctr" style="top:150px;bottom:230px"><span class="kick">Lista 3 · Mirai</span>
  <div class="A" style="display:flex;flex-direction:column;align-items:center"><div class="o" data-box="940" data-max="200">Meno slogan.</div><div class="w" data-box="940" data-max="260">Più cose</div><div class="g" data-box="940" data-max="330">fatte.</div></div>
  <div class="desc" style="font-size:40px;max-width:820px">Salva il post e mandalo a chi vuole una scuola che cambia davvero.</div></div>'''+HAND('@lista.mirai'),'v2')
# ---------- STORIE vento ----------
S=lambda id,inner,v:sec('s',id,BR+inner+HAND(),v)
H+=S('w0','''<div class="ctr" style="top:340px;bottom:430px;gap:26px"><span class="kick">Notato anche tu?</span>
 <div class="A" style="display:flex;flex-direction:column;align-items:center;line-height:.92"><div class="w" data-box="940" data-max="260">Due liste.</div><div class="g" data-box="940" data-max="300">Un solo</div><div class="o" data-box="940" data-max="360">vento.</div></div>
 <div class="sub" style="font-size:46px;max-width:820px;margin-top:10px">Originalità, questa sconosciuta.</div></div>''','v0')
H+=S('w1','''<div style="position:absolute;left:70px;right:70px;top:340px;bottom:430px;z-index:8;display:flex;flex-direction:column;justify-content:center;gap:30px">
 <div class="A ghost strike" style="align-self:flex-start" data-box="940" data-max="380">Vento</div>
 <div class="A w" data-box="940" data-max="150">non è un programma.</div>
 <div class="sub" style="font-size:50px"><span style="color:var(--gold)">Le idee</span> sì.</div></div>''','v1')
H+=S('w2','''<div class="ctr" style="top:330px;bottom:420px;gap:6px"><span class="kick" style="margin-bottom:24px">Facciamo il conto</span>
 <div class="A w" data-box="940" data-max="210" style="opacity:1">Vento.</div><div class="A w" data-box="940" data-max="210" style="opacity:.7">Vento.</div><div class="A w" data-box="940" data-max="210" style="opacity:.45">Vento.</div><div class="A w" data-box="940" data-max="210" style="opacity:.22">Vento.</div>
 <div class="A g" style="margin-top:34px" data-box="940" data-max="230">E le idee?</div></div>''','v2')
H+=S('w3','''<div style="position:absolute;left:70px;right:70px;top:340px;bottom:430px;z-index:8;display:flex;flex-direction:column;justify-content:center;gap:34px">
 <div class="card wh" style="transform:rotate(-2deg);flex:none"><span style="font:800 26px 'DM Sans';letter-spacing:.14em;text-transform:uppercase;color:#7c3aed;opacity:1;margin:0 0 8px">Il vento</span><b style="font-size:62px">è aria.</b></div>
 <div class="card gold" style="transform:rotate(2deg);flex:none"><span style="font:800 26px 'DM Sans';letter-spacing:.14em;text-transform:uppercase;opacity:1;margin:0 0 8px">Mirai</span><b style="font-size:62px">sono 16 idee.</b></div>
 <div class="A" style="margin-top:6px"><div class="w" data-box="940" data-max="140">Scegli tu</div><div class="g" data-box="940" data-max="140">cosa vuoi.</div></div></div>''','v1')
H+=S('w4','''<div class="ctr" style="top:340px;bottom:430px;gap:34px">
 <div class="A" style="display:flex;flex-direction:column;align-items:center"><div class="w" data-box="940" data-max="180">Il vento passa.</div><div class="o" data-box="940" data-max="180">Il vento cambia.</div><div class="g" data-box="940" data-max="230">Il futuro resta.</div></div>
 <div class="sub" style="font-size:46px;max-width:800px">Noi abbiamo un programma, non una direzione del vento.</div></div>''','v2')
H+=S('w5','''<div class="ctr" style="top:340px;bottom:430px;gap:34px"><span class="kick">Sondaggio</span>
 <div class="A" style="display:flex;flex-direction:column;align-items:center"><div class="w" data-box="940" data-max="170">Sei stufo di</div><div class="o" data-box="940" data-max="170">sentire parlare</div><div class="g" data-box="940" data-max="300">di vento?</div></div>
 <span class="sticker">Sì / No 👇</span></div>''','v0')
open('campagna.html','w').write(head+H+js)
