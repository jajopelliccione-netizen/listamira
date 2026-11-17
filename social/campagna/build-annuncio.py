# Genera qr-domani.html (annuncio QR "da domani") e comunicato.html (foglio bianco)
import re
h=open('sito-qr.html',encoding='utf-8').read()
pre=h[:h.index('<section')]; post=h[h.rindex('</section>')+10:]
QR='<svg viewBox="0 0 24 24" fill="none" stroke="#12062b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/></svg>'
def qr(sz): return f'<div style="width:{sz}px;height:{sz}px;border-radius:{int(sz*.21)}px;background:#fff;display:grid;place-items:center;transform:rotate(7deg);box-shadow:0 0 60px rgba(255,60,190,.55),0 30px 60px -20px rgba(0,0,0,.6)"><div style="width:{int(sz*.67)}px;height:{int(sz*.67)}px">{QR}</div></div>'
URL='<div class="url">listamirai.com</div>'
def step(n,c,t,d): return f'<div style="display:flex;align-items:center;gap:30px;text-align:left"><div class="A {c}" style="font-size:150px;line-height:1;width:190px;flex:none">{n}</div><div><div class="sub" style="font-size:52px">{t}</div><div style="font:500 34px/1.25 \'DM Sans\';opacity:.9;margin-top:6px">{d}</div></div></div>'
cols=[('#ff3cbe','#ff8a3c'),('#7c3aed','#ff3cbe'),('#ff8a3c','#a56bff'),('#ff3cbe','#7c3aed')]
def wrap(id,st,n,i,inner,foot):
    c=cols[i%4]; flip=i%2==1
    num=f'<div class="n">{n}</div>' if n else ''
    return (f'<section class="s{" st" if st else ""}" id="{id}"><div class="beam"{" style=\"transform:scaleX(-1)\"" if flip else ""}></div><div class="glow" style="width:800px;height:800px;background:{c[0]};left:-300px;top:30%;opacity:.45"></div><div class="glow" style="width:700px;height:700px;background:{c[1]};right:-300px;bottom:-100px;opacity:.5"></div>'
      f'<div class="brand"><img src="../../assets/fox-96.png" alt="">Mirai</div>{num}<div class="ctr"{" style=\"align-items:stretch\"" if "STEPS" in inner else ""}>{inner.replace("STEPS","")}</div><div class="foot"><span>@lista.mirai</span><b>{foot}</b></div></section>')
def hook(id,st):
    q,t1,t2,sb,ey=((340,250,300,70,80) if st else (240,200,260,60,64))
    inner=(f'<span class="pill">Da domani</span>{qr(q)}<div class="A" style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:14px"><div class="w" data-max="{t1}" data-box="940">QR code</div><div class="pk" data-max="{t2}" data-box="940">in tutta la scuola</div></div>'
      f'<div class="sub" style="font-size:{sb}px;color:#ffc42e;display:flex;align-items:center;gap:18px">A cosa servono? <img src="img/apple-eyes.png" style="width:{ey}px;height:{ey}px"></div>')
    return wrap(id,st,None,0,inner,'Scorri →' if not st else 'Il futuro inizia da noi.')
def answer(id,st):
    inner=('<span class="pill">Ecco a cosa servono</span><div class="A"><div class="pk" data-max="300" data-box="940">Per ascoltarvi</div></div>'
      f'<div class="sub" style="font-size:{54 if st else 48}px;max-width:900px">Teniamo al pensiero di <span style="color:#ffc42e">tutti voi studenti</span>. È proprio per questo.</div>'
      f'<div class="sub" style="font-size:{40 if st else 36}px;font-weight:500;max-width:840px;opacity:.9">Inquadra il QR e scrivici la tua segnalazione: aule, servizi, eventi, didattica…</div>')
    return wrap(id,st,None,1,inner,'Il futuro inizia da noi.')
def why(id,st):
    inner=('<span class="pill">Perché è importante</span><div class="A" style="display:flex;flex-direction:column;align-items:center;gap:6px"><div class="w" data-max="210" data-box="940">Rappresentare</div><div class="or" data-max="210" data-box="940">vuol dire ascoltare</div></div>'
      f'<div class="sub" style="font-size:{50 if st else 46}px;max-width:880px">Vogliamo sapere <span style="color:#ffc42e">cosa pensate</span><br>e <span style="color:#ffc42e">cosa volete davvero</span>.</div>'
      f'<div class="sub" style="font-size:{40 if st else 36}px;font-weight:500;max-width:840px;opacity:.9">Non quello che immaginiamo noi: quello che serve a voi.</div>')
    return wrap(id,st,None,2,inner,'Il futuro inizia da noi.')
def steps(id,st):
    inner=('STEPS<div class="A pk" style="text-align:center" data-max="170" data-box="940">3 passaggi</div>'+step('01','pk','Trova il QR','Lo vedi appeso in giro per la scuola.')+step('02','or','Inquadralo','Con la fotocamera del telefono.')+step('03','cy','Scrivi','La tua segnalazione, in pochi secondi.'))
    return wrap(id,st,None,3,inner.replace('gap:30px','gap:30px'),'Il futuro inizia da noi.')
def anon(id,st):
    inner=('<span class="pill">Privacy</span><div class="A" style="display:flex;flex-direction:column;align-items:center;gap:6px"><div class="pk" data-max="300" data-box="940">100%</div><div class="or" data-max="300" data-box="940">anonimo</div></div>'
      '<div class="sub" style="font-size:46px;max-width:860px">Niente nome, niente email.<br><span style="color:#ffc42e">Solo la tua opinione.</span></div><div class="sub" style="font-size:36px;font-weight:500;max-width:820px;opacity:.9">Non salviamo i tuoi dati: solo il testo che scrivi.</div>')
    return wrap(id,st,None,0,inner,'Il futuro inizia da noi.')
def site(id,st):
    inner=('STEPS<div class="A pk" style="text-align:center" data-max="170" data-box="940">Il nuovo sito</div>'+step('01','pk','Il programma','16 idee concrete per la nostra scuola.')+step('02','or','Chi siamo','La lista, il team e i nostri progetti.')+step('03','cy','Le tue segnalazioni','Scrivici cosa ne pensi, quando vuoi.'))
    return wrap(id,st,None,1,inner,'Il futuro inizia da noi.')
def cta(id,st):
    inner=('<div class="A" style="display:flex;flex-direction:column;align-items:center;gap:6px"><div class="pk" data-max="220" data-box="940">La tua opinione</div><div class="or" data-max="300" data-box="940">conta</div></div><div class="sub" style="font-size:46px;max-width:860px">Teniamo ad <span style="color:#ffc42e">ascoltarti</span>.<br>Segnalaci cosa cambieresti.</div>'+URL+'<div class="sub" style="font-size:36px;font-weight:700">Salva e condividi con i tuoi compagni</div>')
    return wrap(id,st,None,1,inner,'Segui per le novità')
posts=[hook('p1',0),answer('p2',0),why('p3',0),steps('p4',0),anon('p5',0),site('p6',0),cta('p7',0)]
stories=[hook('s1',1),answer('s2',1),why('s3',1),steps('s4',1),cta('s5',1)]
out=[]
for i,s in enumerate(posts,1):
    s=s.replace('<div class="ctr"',f'<div class="n">0{i}/07</div><div class="ctr"',1); out.append(s)
out+=stories
open('qr-domani.html','w',encoding='utf-8').write(pre+'\n'.join(out)+'\n'+post)

# ---------------- COMUNICATO su foglio bianco ----------------
PG=[['Come lista Mirai sentiamo il dovere di fare chiarezza su quanto sta accadendo in questi giorni, perché gli studenti hanno il diritto di sapere come si sta svolgendo questa campagna elettorale.', 'Il fatto più grave riguarda le votazioni per la consulta. Prima delle votazioni, a tutti i rappresentanti di classe dell’istituto è stato scritto di non votare noi e di non votare le altre liste candidate. A scriverlo è stata una lista che già l’anno scorso aveva un ruolo di rilievo nella scuola e che, proprio per questo, manteneva contatti diretti con i rappresentanti di classe. Di questo non avevamo parlato subito, ma adesso siamo arrivati a un limite.', 'Riteniamo che usare questi contatti per influenzare un voto non sia corretto. Un’elezione si vince con le idee e con il confronto, non chiedendo a chi vota di escludere chi si candida: è un messaggio che colpisce tutte le liste e, prima ancora, il diritto di ogni studente di scegliere liberamente.'], ['Noi siamo aperti al confronto in ogni modo. È giusto che ognuno la pensi in maniera diversa e che le liste abbiano idee e programmi differenti. È giusto anche che tra le liste si crei rivalità: ci sta. Anche noi abbiamo spesso parlato del lavoro delle altre liste, ma sempre con rispetto e confrontandoci con tutti, e continueremo a farlo. In questi giorni passeremo per le classi, e ci sarà modo di confrontarci con tutti. Poi sta agli studenti scegliere cosa votare e cosa non votare.', 'Il problema non sono le piccole frecciatine che girano su Instagram: il problema è tutto quello che c’è dietro. Vengono stabiliti degli accordi per staccare i materiali che appendiamo nell’istituto, e veniamo fotografati mentre parliamo nelle aule, senza nemmeno la nostra autorizzazione, con foto che poi circolano nei gruppi. A tutto questo si aggiungono insulti continui. E non riguarda soltanto noi: insulti e foto vengono rivolti a tutte le liste. Non lo diciamo per lamentarci, ma con fermezza: c’è una sola lista che ha questo atteggiamento scorretto, lontano da ciò che dovrebbe essere un ambiente scolastico, ed è giusto che gli studenti sappiano come stanno le cose.'], ['Sorprende che si parli di “lista fascista” spesso senza sapere nemmeno che cosa sia stato il fascismo. È una parola con un peso storico enorme: usarla come etichetta per chi la pensa diversamente le toglie significato e manca di rispetto a chi quella storia l’ha vissuta. Il nostro messaggio non è portare la politica nella scuola, ma portare la voce degli studenti più in alto. Siamo studenti, non un partito.', 'A chi ha queste idee sulla nostra lista, e a chiunque la pensi diversamente da noi, rivolgiamo un invito: parlatene con noi. In questi giorni saremo nelle classi, ed è l’occasione giusta per dirci apertamente quello che pensate e per avere un dibattito sano, in cui ognuno porta le proprie ragioni e ascolta quelle degli altri. Quando siamo già passati nelle classi, molte delle persone che sono state protagoniste di questi episodi non ci hanno rivolto nemmeno una parola, non ci hanno fatto neanche una domanda. Il confronto è aperto a tutti: basta volerlo.'], ['Crediamo nella comunicazione: parlare apertamente, spiegare le proprie proposte, ascoltare gli altri. Per questo da domani affiggeremo in tutto l’istituto dei cartelloni con dei QR code: ogni studente potrà inviarci, in forma anonima, segnalazioni e proposte. Vogliamo sapere cosa pensate e cosa volete davvero.', 'Se anche questi cartelloni dovessero essere staccati, sarebbe un segnale chiaro: che c’è chi non lascia spazio alle idee di tutti.', 'Non ci lasciamo condizionare: sono comportamenti di basso livello e non ci interessano. Continuiamo la nostra campagna a testa alta e senza paura di nessuno, con le nostre idee e con il rispetto per chiunque.', 'Agli studenti chiediamo di fare caso a tutto questo e di scegliere con la propria testa. Ai rappresentanti di classe diciamo: siete liberi di ascoltare tutti, di confrontarvi e di votare secondo coscienza.']]
def sheet(id,story,page,paras,title=True,sign=False):
    W,Hh=(940,1110) if not story else (940,1290)
    fs=30 if not story else 32
    top=130 if not story else 270
    letter=('<div style="display:flex;align-items:center;gap:20px;border-bottom:3px solid #ffc42e;padding-bottom:20px;margin-bottom:28px">'
            '<img src="../../assets/logo.png" style="width:78px;height:78px;border-radius:50%"><div><div style="font:700 30px Tinos;letter-spacing:.14em;color:#12062b">LISTA 3 · MIRAI</div>'
            '<div style="font:400 22px Tinos;color:#5b5570;margin-top:2px">ITIS Galileo Galilei — Roma · Elezioni d’istituto 2026/27</div></div></div>')
    head=('<div style="font:700 22px Tinos;letter-spacing:.3em;color:#7c3aed;margin-bottom:10px">COMUNICATO</div>'
          f'<div style="font:700 {44 if not story else 50}px/1.12 Tinos;color:#12062b;margin-bottom:28px">Il rispetto delle idee di tutti</div>') if title else ''
    body=''.join(f'<p style="margin:0 0 {20 if not story else 24}px">{p}</p>' for p in paras)
    call=('<div style="margin-top:26px;border-left:6px solid #ffc42e;background:#f6f1ff;padding:16px 22px;font:700 %dpx/1.3 Tinos;color:#12062b">Da domani, in tutta la scuola: cerca i QR code, inquadrali e scrivici cosa pensi.<div style="font:400 %dpx Tinos;color:#5b5570;margin-top:4px">100%% anonimo · listamirai.com</div></div>' % (fs-1,fs-6)) if sign else ''
    call=''
    signb=('<div style="margin-top:30px;font:700 30px Tinos;color:#12062b">Lista 3 – Mirai</div><div style="font:italic 400 26px Tinos;color:#5b5570">Il futuro inizia da noi.</div>') if sign else ''
    foxtop=-30 if not story else 175
    brand2='<div class="brand2"><img src="../../assets/fox-96.png" alt="">Mirai</div>' if not story else ''
    return (f'<section class="c{" cs" if story else ""}" id="{id}"><div class="cbg"></div><div class="glow" style="width:800px;height:800px;background:#7c3aed;left:-350px;top:10%;opacity:.55"></div><div class="glow" style="width:700px;height:700px;background:#ffb020;right:-350px;bottom:-200px;opacity:.35"></div>'
      f'<img class="cfox" src="../../assets/fox.png" alt="" style="top:{foxtop}px">{brand2}'
      f'<div class="sheet" style="top:{top}px;width:{W}px;height:{Hh}px;font:400 {fs}px/1.42 Tinos">{letter}{head}{body}{call}{signb}<div style="position:absolute;left:70px;right:70px;bottom:30px;display:flex;justify-content:space-between;font:400 20px Tinos;color:#8a849c;border-top:1px solid #e3dff0;padding-top:12px"><span>Roma, novembre 2026</span><span>Pagina {page} di 4</span></div></div>'
      f'<div class="cfoot"><span>@lista.mirai</span><b>Comunicato ufficiale · Lista 3 Mirai</b></div></section>')
css=("<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap\"><style>"
 "*{box-sizing:border-box;margin:0}body{background:#000;font-family:'DM Sans',sans-serif}"
 ".c{position:relative;width:1080px;height:1350px;overflow:hidden;background:#12062b;margin-bottom:20px}.cs{height:1920px}"
 ".cbg{position:absolute;inset:0;background:radial-gradient(circle at 20% 10%,#2a0f5e,transparent 55%),#12062b}"
 ".glow{position:absolute;border-radius:50%;filter:blur(120px)}"
 ".c::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.16;mix-blend-mode:overlay;background:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")}"
 ".sheet{position:absolute;left:70px;background:#fff;color:#1b1b1f;padding:50px 70px 60px;box-shadow:0 40px 90px -20px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.08);z-index:5;overflow:hidden}"
 ".cfox{position:absolute;right:90px;top:-62px;width:190px;z-index:4;transform:rotate(8deg);filter:drop-shadow(0 20px 30px rgba(0,0,0,.5));}"
 ".cfoot{position:absolute;left:70px;right:70px;bottom:44px;z-index:10;display:flex;justify-content:space-between;font:800 26px 'DM Sans';color:#fff}.cfoot b{color:#ffc42e}"
 ".cs .cfoot{bottom:296px}.brand2{position:absolute;left:70px;top:48px;z-index:10;display:flex;align-items:center;gap:14px;font:800 26px 'DM Sans';letter-spacing:.16em;text-transform:uppercase;color:#fff}.brand2 img{height:52px}"
 "</style>")
c=[sheet('c1',0,1,PG[0]),sheet('c2',0,2,PG[1],title=False),sheet('c3',0,3,PG[2],title=False),sheet('c4',0,4,PG[3],title=False,sign=True),sheet('c5',1,1,PG[0]),sheet('c6',1,2,PG[1],title=False),sheet('c7',1,3,PG[2],title=False),sheet('c8',1,4,PG[3],title=False,sign=True)]
open('comunicato.html','w',encoding='utf-8').write('<!doctype html><html lang="it"><head><meta charset="utf-8">'+css+'</head><body>'+'\n'.join(c)+'<script>document.fonts.ready.then(()=>{document.body.dataset.ready=1})</script></body></html>')
