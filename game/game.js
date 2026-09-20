(() => {
  "use strict";

  const COLS = 10, ROWS = 20;
  const SHAPES = {
    I:[[0,0],[1,0],[2,0],[3,0]],
    J:[[0,0],[0,1],[1,1],[2,1]],
    L:[[2,0],[0,1],[1,1],[2,1]],
    O:[[1,0],[2,0],[1,1],[2,1]],
    S:[[1,0],[2,0],[0,1],[1,1]],
    T:[[1,0],[0,1],[1,1],[2,1]],
    Z:[[0,0],[1,0],[1,1],[2,1]]
  };
  const DARK = {I:"#84a9b7",J:"#7e89a8",L:"#b29578",O:"#baa96d",S:"#7f9f88",T:"#9c86a7",Z:"#aa7f7f"};
  const LIGHT = {I:"#5d88aa",J:"#6279bb",L:"#b77c49",O:"#b7982d",S:"#5f9b70",T:"#8d6bb0",Z:"#b96464"};

  const $ = s => document.querySelector(s);
  const game = $("#game"), ctx = game.getContext("2d");
  const nextCanvas = $("#next"), nextCtx = nextCanvas.getContext("2d");
  const holdCanvas = $("#hold"), holdCtx = holdCanvas.getContext("2d");
  const overlay = $("#overlay"), title = $("#overlayTitle"), overlayText = $("#overlayText");
  const startBtn = $("#startBtn"), pauseBtn = $("#pauseBtn"), stateEl = $("#state");
  const dayBtn = $("#dayBtn"), nightBtn = $("#nightBtn");

  let board = emptyBoard(), current = null, next = null, hold = null, canHold = true;
  let bag = [], score = 0, lines = 0, level = 1;
  let running = false, paused = false, ended = false;
  let last = 0, dropCounter = 0, lockCounter = 0, cell = 30;
  let colors = DARK;

  function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function emptyBoard(){ return Array.from({length:ROWS}, () => Array(COLS).fill(null)); }

  function setTheme(theme){
    theme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    colors = theme === "light" ? LIGHT : DARK;
    localStorage.setItem("quiet-blocks-theme", theme);
    dayBtn.classList.toggle("active", theme === "light");
    nightBtn.classList.toggle("active", theme === "dark");
    document.querySelector('meta[name="theme-color"]').content = theme === "light" ? "#f2f5f8" : "#06090d";
    drawPreview(nextCtx, nextCanvas, next && next.type);
    drawPreview(holdCtx, holdCanvas, hold);
    draw();
  }

  function initTheme(){
    const saved = localStorage.getItem("quiet-blocks-theme");
    if(saved) return setTheme(saved);
    setTheme(matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }

  function refillBag(){
    const a = Object.keys(SHAPES);
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    bag.push(...a);
  }
  function takeType(){ if(bag.length<7) refillBag(); return bag.shift(); }
  function makePiece(type){
    return {type, blocks:SHAPES[type].map(([x,y])=>({x,y})), x:3, y:-1};
  }
  function cells(piece, blocks=piece.blocks, ox=piece.x, oy=piece.y){
    return blocks.map(b=>({x:ox+b.x,y:oy+b.y}));
  }
  function collides(piece, blocks=piece.blocks, ox=piece.x, oy=piece.y){
    return cells(piece,blocks,ox,oy).some(({x,y}) =>
      x<0 || x>=COLS || y>=ROWS || (y>=0 && board[y][x])
    );
  }

  function rotated(piece, dir=1){
    if(piece.type==="O") return piece.blocks.map(b=>({...b}));
    const cx = piece.type==="I" ? 1.5 : 1;
    const cy = piece.type==="I" ? .5 : 1;
    return piece.blocks.map(p=>{
      const x=p.x-cx, y=p.y-cy;
      return dir>0
        ? {x:Math.round(-y+cx),y:Math.round(x+cy)}
        : {x:Math.round(y+cx),y:Math.round(-x+cy)};
    });
  }

  function rotate(dir=1){
    if(!running || paused || ended) return;
    const r = rotated(current,dir);
    for(const dx of [0,-1,1,-2,2]){
      if(!collides(current,r,current.x+dx,current.y)){
        current.blocks=r; current.x+=dx; lockCounter=0; draw(); return;
      }
    }
  }

  function spawn(){
    current = next || makePiece(takeType());
    next = makePiece(takeType());
    current.x=3; current.y=-1; canHold=true;
    drawPreview(nextCtx,nextCanvas,next.type);
    if(collides(current)) finish();
  }

  function updateHUD(){
    const s=score.toLocaleString();
    $("#score").textContent=s; $("#scoreM").textContent=s;
    $("#lines").textContent=lines; $("#linesM").textContent=lines;
    $("#level").textContent=level; $("#levelM").textContent=level;
  }

  function start(){
    board=emptyBoard(); bag=[]; score=0; lines=0; level=1; hold=null;
    current=null; next=makePiece(takeType()); canHold=true;
    running=true; paused=false; ended=false; dropCounter=0; lockCounter=0;
    stateEl.textContent="playing"; pauseBtn.textContent="PAUSE";
    overlay.classList.remove("show"); clearPreview(holdCtx,holdCanvas); updateHUD();
    spawn(); last=performance.now(); requestAnimationFrame(loop);
  }

  function finish(){
    running=false; ended=true; stateEl.textContent="game over";
    title.textContent="Finished";
    overlayText.textContent="Score "+score.toLocaleString()+" · "+lines+" lines · level "+level;
    startBtn.textContent="PLAY AGAIN"; overlay.classList.add("show"); draw();
  }

  function togglePause(){
    if(ended || !current) return;
    paused=!paused; stateEl.textContent=paused?"paused":"playing";
    pauseBtn.textContent=paused?"RESUME":"PAUSE";
    if(paused){
      title.textContent="Paused";
      overlayText.textContent="The board will stay exactly where you left it.";
      startBtn.textContent="RESUME"; overlay.classList.add("show"); draw();
    }else{
      overlay.classList.remove("show"); last=performance.now(); requestAnimationFrame(loop);
    }
  }

  function move(dx,dy){
    if(!running || paused || ended) return false;
    if(collides(current,current.blocks,current.x+dx,current.y+dy)) return false;
    current.x+=dx; current.y+=dy; if(dx) lockCounter=0; draw(); return true;
  }

  function hardDrop(){
    if(!running || paused || ended) return;
    let d=0;
    while(!collides(current,current.blocks,current.x,current.y+1)){ current.y++; d++; }
    score+=d*2; lockPiece();
  }

  function holdPiece(){
    if(!running || paused || ended || !canHold) return;
    const t=current.type;
    if(hold){
      current=makePiece(hold); hold=t;
      if(collides(current)) return finish();
    }else{
      hold=t; current=next; next=makePiece(takeType()); current.x=3; current.y=-1;
      drawPreview(nextCtx,nextCanvas,next.type);
    }
    canHold=false; drawPreview(holdCtx,holdCanvas,hold); draw();
  }

  function clearLines(){
    let n=0;
    for(let y=ROWS-1;y>=0;y--){
      if(board[y].every(Boolean)){
        board.splice(y,1); board.unshift(Array(COLS).fill(null)); n++; y++;
      }
    }
    return n;
  }

  function lockPiece(){
    for(const {x,y} of cells(current)){
      if(y<0) return finish();
      board[y][x]=current.type;
    }
    const n=clearLines();
    if(n){
      score += [0,100,300,500,800][n]*level;
      lines += n; level=1+Math.floor(lines/10);
    }
    updateHUD(); spawn(); lockCounter=0;
  }

  function gravity(){ return Math.max(85,760*Math.pow(.84,level-1)); }

  function loop(t){
    if(!running || paused || ended) return;
    const dt=Math.min(50,t-last); last=t; dropCounter+=dt;
    if(dropCounter>=gravity()){
      if(!move(0,1)){ lockCounter+=dropCounter; if(lockCounter>=420) lockPiece(); }
      else lockCounter=0;
      dropCounter=0;
    }else if(collides(current,current.blocks,current.x,current.y+1)){
      lockCounter+=dt; if(lockCounter>=420) lockPiece();
    }else lockCounter=0;
    draw(); if(running && !paused) requestAnimationFrame(loop);
  }

  function roundRect(c,x,y,w,h,r){
    r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y);
    c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r);
    c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
  }

  function drawCell(x,y,color){
    const px=x*cell, py=y*cell, pad=Math.max(1.3,cell*.055), r=Math.max(3,cell*.12);
    ctx.fillStyle=color; roundRect(ctx,px+pad,py+pad,cell-pad*2,cell-pad*2,r); ctx.fill();
    ctx.fillStyle=document.documentElement.dataset.theme==="light"?"rgba(255,255,255,.34)":"rgba(255,255,255,.075)";
    roundRect(ctx,px+pad+1,py+pad+1,cell-pad*2-2,Math.max(2.2,cell*.075),r/2); ctx.fill();
  }

  function drawGhost(x,y,color){
    const px=x*cell, py=y*cell, pad=Math.max(2,cell*.09);
    ctx.strokeStyle=color; ctx.globalAlpha=.2; ctx.lineWidth=Math.max(1,cell*.045);
    roundRect(ctx,px+pad,py+pad,cell-pad*2,cell-pad*2,Math.max(3,cell*.1)); ctx.stroke(); ctx.globalAlpha=1;
  }

  function draw(){
    const r=game.getBoundingClientRect(); if(!r.width || !r.height) return;
    const w=r.width,h=r.height;
    ctx.clearRect(0,0,w,h); ctx.fillStyle=css("--board"); ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=css("--grid"); ctx.lineWidth=1;
    for(let x=1;x<COLS;x++){ const p=Math.round(x*cell)+.5; ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,h);ctx.stroke(); }
    for(let y=1;y<ROWS;y++){ const p=Math.round(y*cell)+.5; ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(w,p);ctx.stroke(); }

    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(board[y][x]) drawCell(x,y,colors[board[y][x]]);

    if(current && !ended){
      let gy=current.y;
      while(!collides(current,current.blocks,current.x,gy+1)) gy++;
      current.blocks.forEach(b=>{ const x=current.x+b.x,y=gy+b.y; if(y>=0) drawGhost(x,y,colors[current.type]); });
      current.blocks.forEach(b=>{ const x=current.x+b.x,y=current.y+b.y; if(y>=0) drawCell(x,y,colors[current.type]); });
    }
  }

  function clearPreview(c,cv){ c.clearRect(0,0,cv.width,cv.height); }
  function drawPreview(c,cv,type){
    clearPreview(c,cv); if(!type) return;
    const pts=SHAPES[type], xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const cols=maxX-minX+1,rows=maxY-minY+1,s=Math.min(24,cv.width/(cols+1.8),cv.height/(rows+1.5));
    const ox=(cv.width-cols*s)/2-minX*s, oy=(cv.height-rows*s)/2-minY*s;
    pts.forEach(([x,y])=>{
      const p=1.5; c.fillStyle=colors[type]; roundRect(c,ox+x*s+p,oy+y*s+p,s-p*2,s-p*2,Math.max(3,s*.12)); c.fill();
    });
  }

  function resize(){
    const r=game.getBoundingClientRect(), d=Math.max(1,Math.min(2,devicePixelRatio||1));
    if(!r.width || !r.height) return;
    game.width=Math.round(r.width*d); game.height=Math.round(r.height*d); ctx.setTransform(d,0,0,d,0,0);
    cell=r.width/COLS; draw();
  }

  document.addEventListener("keydown",e=>{
    if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," ","c","C","p","P","Escape","z","Z","t","T"].includes(e.key)) e.preventDefault();
    if(e.key==="p"||e.key==="P"||e.key==="Escape") return togglePause();
    if(e.key==="t"||e.key==="T") return setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
    if(!running||paused||ended) return;
    if(e.key==="ArrowLeft") move(-1,0);
    else if(e.key==="ArrowRight") move(1,0);
    else if(e.key==="ArrowDown"){ if(move(0,1)){score++;updateHUD();} }
    else if(e.key==="ArrowUp") rotate(1);
    else if(e.key==="z"||e.key==="Z") rotate(-1);
    else if(e.key===" ") hardDrop();
    else if(e.key==="c"||e.key==="C") holdPiece();
  });

  startBtn.addEventListener("click",()=>paused?togglePause():start());
  pauseBtn.addEventListener("click",togglePause);
  $("#themeToggle").addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  dayBtn.addEventListener("click",()=>setTheme("light"));
  nightBtn.addEventListener("click",()=>setTheme("dark"));

  document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("pointerdown",e=>{
    e.preventDefault(); const a=b.dataset.action;
    if(a==="left") move(-1,0); else if(a==="right") move(1,0);
    else if(a==="down"){if(move(0,1)){score++;updateHUD();}}
    else if(a==="rotate") rotate(1); else if(a==="drop") hardDrop();
    else if(a==="hold") holdPiece(); else if(a==="pause") togglePause();
  }));

  let touch=null;
  game.addEventListener("pointerdown",e=>{
    if(e.pointerType!=="touch") return;
    touch={x:e.clientX,y:e.clientY,t:performance.now()}; game.setPointerCapture?.(e.pointerId);
  });
  game.addEventListener("pointerup",e=>{
    if(!touch||e.pointerType!=="touch") return;
    const dx=e.clientX-touch.x,dy=e.clientY-touch.y,ax=Math.abs(dx),ay=Math.abs(dy),dt=performance.now()-touch.t;
    if(ax<16&&ay<16&&dt<350) rotate(1);
    else if(ay>ax&&dy>35){ if(dy>95) hardDrop(); else if(move(0,1)){score++;updateHUD();} }
    else if(ax>28) move(dx>0?1:-1,0);
    touch=null;
  });

  addEventListener("resize",resize);
  initTheme(); updateHUD(); requestAnimationFrame(resize);
})();