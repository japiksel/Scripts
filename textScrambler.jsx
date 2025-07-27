// ————————— SETTINGS —————————
var charset     = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var baseSpeed   = effect("Speed")("Slider");
var dir         = Math.round(effect("Direction")("Slider"));  
   // 1 = Left→Right, 2 = Right→Left, 3 = Random, 4 = Ping-Pong
var loopDur     = effect("Loop Duration")("Slider");
if (loopDur <= 0) loopDur = 1;
var eventProb1  = 0.35;                                     
// ——————————————————————————————————————————–

/* 1) Get the text from the layer */
var src    = value;
var target = (typeof src.text === "string") ? src.text : src.toString();
var N      = target.length;

/* 2) Static region boundaries (for modes 1–3) */
var r1 = Math.floor(N * 0.3);
var r2 = Math.floor(N * 0.6);

/* 3) Time calculations driven by Speed */
var pingTime = time * baseSpeed;         // Speed drives the loop progress
var t        = pingTime % loopDur;       // time within the loop [0…loopDur)
var p        = t / loopDur;              // normalized [0…1]
var pp       = 1 - Math.abs(1 - 2 * p);  // ping-pong waveform 0→1→0

/* 4) Precompute a single glitch event for region 1 (only when dir=1 or dir=2) */
seedRandom(100 + Math.floor(t), true);
var event1  = (dir === 1 || dir === 2) && random() < eventProb1;
seedRandom(200 + Math.floor(t), true);
var glitch1 = Math.floor(random() * r1);

/* 5) Ping-Pong parameters: two blocks at 30% and 20% width */
var w1p      = r1;                        // first block = 30% of text
var w2p      = Math.floor(N * 0.2);       // second block = next 20%
var maxStart = Math.max(0, N - w1p - w2p);
// allow start to reach maxStart
var start    = Math.min(maxStart, Math.floor(pp * (maxStart + 1)));

/* 6) Seed once per frame, only for Ping-Pong mode */
if (dir === 4) {
  seedRandom(300 + Math.floor(pingTime), true);
}

var out = [];

/* 7) Main loop over each character */
for (var i = 0; i < N; i++) {
  var ch = target.charAt(i);

  // preserve spaces, punctuation, and diacritics
  if (/\s|[.,!?:;\-–—()'"„”\[\]ĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(ch)) {
    out.push(ch);
    continue;
  }

  // —— MODE 4: Ping-Pong with truly random characters —— 
  if (dir === 4) {
    // block 1: 30% width, glitch every frame (random letters)
    if (i >= start && i < start + w1p) {
      out.push(charset.charAt(Math.floor(random() * charset.length)));
      continue;
    }
    // block 2: next 20% width, glitch every frame (random letters)
    if (i >= start + w1p && i < start + w1p + w2p) {
      out.push(charset.charAt(Math.floor(random() * charset.length)));
      continue;
    }
    // other letters remain static
    out.push(ch);
    continue;
  }

  // —— MODES 1–3: Left→Right, Right→Left, Random —— 
  var idx = (dir === 2) ? (N - 1 - i) : i;

  // Region 1 – single glitch
  if (dir !== 3 && idx < r1) {
    if (event1 && idx === glitch1) {
      seedRandom(400 + idx + Math.floor(t), true);
      out.push(charset.charAt(Math.floor(random() * charset.length)));
    } else {
      out.push(ch);
    }
    continue;
  }

  // Region 2/3 or Random
  var relP, spd;
  if (dir === 3) {
    relP = 0.4; spd = baseSpeed;
  } else if (idx < r2) {
    relP = 0.5; spd = baseSpeed;
  } else {
    relP = 0.3; spd = baseSpeed * 5;
  }
  seedRandom(idx + Math.floor(time * spd), true);
  if (random() < relP) {
    out.push(ch);
  } else {
    out.push(charset.charAt(Math.floor(random() * charset.length)));
  }
}

/* 8) Fallback – ensure at least one glitch */
var result = out.join("");
if (result === target) {
  seedRandom(500 + Math.floor(t), true);
  var j   = Math.floor(random() * N);
  var arr = out.slice();
  arr[j]   = charset.charAt(Math.floor(random() * charset.length));
  result   = arr.join("");
}

/* 9) Return the final result */
result;
