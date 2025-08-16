document.addEventListener('DOMContentLoaded', () => {

  /* ===== GLOBAL VARIABLES ===== */
  let currentUser = null;
  let replyTo = null;
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');
  const loginProfile = document.getElementById('login-profile');
  const topPfp = document.getElementById('top-pfp');
  const statusIndicator = document.getElementById('status-indicator');
  const welcomeText = document.getElementById('welcome-text');
  const loadingScreen = document.getElementById('loading-screen');
  const usernameChangeCooldown = 300000; // 5 min
  let lastUsernameChange = 0;

  /* ===== MUSIC PLAYER ===== */
  const trackArt = document.getElementById('track-art');
  const trackTitle = document.getElementById('track-title');
  const playBtn = document.getElementById('play-pause');
  const prevBtn = document.getElementById('prev-track');
  const nextBtn = document.getElementById('next-track');
  const canvas = document.getElementById('waveform-canvas');
  const ctx = canvas.getContext('2d');

  let tracks = [];
  let currentTrackIndex = 0;
  const audio = new Audio();
  let isPlaying = false;

  // AudioContext for waveform
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  const source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  async function loadTracks() {
    try {
      const res = await fetch('tracks.json');
      tracks = await res.json();
      if(tracks.length > 0){
        loadTrack(0);
        drawWaveform();
      }
    } catch(e) {
      console.error('Failed to load tracks', e);
    }
  }

  function loadTrack(index){
    const track = tracks[index];
    if(!track) return;
    audio.src = track.file;
    trackArt.src = track.art;
    trackTitle.textContent = track.title;
  }

  function togglePlay(){
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if(audio.paused){
      audio.play();
      playBtn.textContent = '⏸️';
      isPlaying = true;
    } else {
      audio.pause();
      playBtn.textContent = '▶️';
      isPlaying = false;
    }
  }

  function prevTrack(){
    currentTrackIndex = (currentTrackIndex-1+tracks.length)%tracks.length;
    loadTrack(currentTrackIndex);
    if(isPlaying) audio.play();
  }

  function nextTrack(){
    currentTrackIndex = (currentTrackIndex+1)%tracks.length;
    loadTrack(currentTrackIndex);
    if(isPlaying) audio.play();
  }

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  function drawWaveform(){
    requestAnimationFrame(drawWaveform);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    data.forEach((v,i)=>{
      ctx.fillStyle = '#0ff';
      ctx.fillRect(i*2, canvas.height-v, 1, v);
    });
  }

  /* ===== APP KEY ===== */
  function getAppKey(){ return 'cRunchyV3rsE2025!'; }
  const APP_KEY = getAppKey();

  async function hashPassword(password, salt){
    const enc = new TextEncoder();
    const data = enc.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function encrypt(text){
    let out='';
    for(let i=0;i<text.length;i++){
      out += String.fromCharCode(text.charCodeAt(i) ^ APP_KEY.charCodeAt(i%APP_KEY.length));
    }
    return btoa(out);
  }

  function decrypt(encText){
    let text = atob(encText);
    let out='';
    for(let i=0;i<text.length;i++){
      out += String.fromCharCode(text.charCodeAt(i) ^ APP_KEY.charCodeAt(i%APP_KEY.length));
    }
    return out;
  }

  function showLoading(nextPage){
    loadingScreen.style.display='flex';
    setTimeout(()=>{
      loadingScreen.style.display='none';
      if(nextPage) switchToPage(nextPage);
    },500);
  }

  /* ===== PAGE SWITCH ===== */
  function switchToPage(pageId){
    pages.forEach(p=>p.classList.remove('active'));
    const target = document.getElementById('page-'+pageId);
    if(target) target.classList.add('active');
    welcomeText.textContent = pageId.toUpperCase();
    if(pageId==='account') loadAccountPage();
  }

  navItems.forEach(nav=>nav.addEventListener('click',()=>showLoading(nav.dataset.page)));

  /* ===== LOGIN / SIGNUP ===== */
  const loginUsername = document.getElementById('username');
  const loginPassword = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');

  function updateLoginDisplay(){
    if(currentUser){
      const inputs = loginProfile.querySelectorAll('input, button');
      inputs.forEach(el=>{ if(el.id!=='top-pfp') el.style.display='none'; });
      topPfp.style.display='inline-block';
      statusIndicator.style.display='inline-block';
    } else {
      const inputs = loginProfile.querySelectorAll('input, button');
      inputs.forEach(el=>el.style.display='inline-block');
      topPfp.style.display='none';
      statusIndicator.style.display='none';
    }
  }

  function loadUserProfile(){
    const users = JSON.parse(localStorage.getItem('users')||'{}');
    const data = users[currentUser];
    if(!data) return;
    topPfp.src = data.pfp || 'pfp-placeholder.png';
    statusIndicator.className = `status-${data.status||'offline'}`;
  }

  loginBtn.addEventListener('click', async ()=>{
    const uname = loginUsername.value.trim();
    const pass = loginPassword.value;
    const users = JSON.parse(localStorage.getItem('users')||'{}');
    if(users[uname]){
      const decryptedHash = decrypt(users[uname].password);
      const salt = users[uname].salt;
      const hash = await hashPassword(pass,salt);
      if(hash===decryptedHash){
        currentUser = uname;
        loginUsername.value=''; loginPassword.value='';
        loadUserProfile(); updateLoginDisplay(); showLoading('home');
        return;
      }
    }
    alert('Invalid username or password');
  });

  signupBtn.addEventListener('click', async ()=>{
    const uname = loginUsername.value.trim();
    const pass = loginPassword.value;
    if(!uname||!pass) return alert('Enter username and password');
    const users = JSON.parse(localStorage.getItem('users')||'{}');
    if(users[uname]) return alert('Username exists');
    const salt = Math.random().toString(36).slice(2,10);
    const hash = await hashPassword(pass, salt);
    users[uname] = {password:encrypt(hash), salt:salt, bio:'', pfp:'', status:'offline', friends:[]};
    localStorage.setItem('users', JSON.stringify(users));
    alert('Account created! You can log in now.');
    loginUsername.value=''; loginPassword.value='';
  });

  /* ===== INIT APP ===== */
  async function initApp(){
    await loadTracks();
    showLoading('home');
  }

  initApp(); // start app

});
