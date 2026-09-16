/* 체형·머리 이미지 선택기.
   BODY_FIG·HAIR_FIG 수치를 Canvas에 래스터로 그린다. SVG 문자열을 DOM에
   삽입하지 않으며, prompt.html은 같은 Canvas를 누르는 선택 카드로 쓴다.
   실제 생성 초상은 별도 갤러리로 남겨 도식과 결과를 함께 비교한다. */
(function (root) {
  'use strict';

  function spec() {
    var S = root.AtelierSpec;
    if (!S) throw new Error('lib/figures.js 는 lib/toolkit-spec.js 다음에 읽어야 한다');
    return S;
  }

  function entry(key, value) {
    var S = spec();
    if (key === 'body type') return S.BODY_FIG[value] || null;
    if (key === 'hairstyle') return S.HAIR_FIG[value] || null;
    return null;
  }

  function palette(canvas) {
    var style;
    try { style = root.getComputedStyle(canvas); } catch (e) {}
    function color(name, fallback) {
      var value = style && style.getPropertyValue(name);
      return value && value.trim() || fallback;
    }
    return {
      accent: color('--accent', '#6f96bd'),
      soft: color('--accent-soft', '#dce8f3'),
      card: color('--card', '#ffffff'),
      line: color('--line', '#8b98a8'),
      text: color('--text', '#263442'),
      muted: color('--muted', '#687789'),
      signal: color('--signal', '#c65b61')
    };
  }

  function surface(canvas, width, height) {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    var ctx;
    try { ctx = canvas.getContext('2d'); } catch (e) { return null; }
    if (!ctx) return null;
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }

  function bodyValues(value, gender) {
    var f = entry('body type', value);
    if (!f) return null;
    var sh = f[0], bust = f[1], waist = f[2], hip = f[3];
    if (gender === 'male') {
      sh = sh * 1.14 + 2;
      bust = Math.min(bust, sh * .88);
      waist = waist + (sh - waist) * .30;
      hip = Math.min(hip * .86, sh * .92);
    } else {
      /* BODY_FIG의 상대 차이는 유지하되 여성 마네킹의 기본 골격을 분명히 한다. */
      sh *= .88;
      bust *= 1.06;
      waist *= .82;
      hip *= 1.08;
    }
    return { shoulder: sh, bust: bust, waist: waist, hip: hip, height: f[4], thickness: f[5] };
  }

  function drawBody(canvas, value, gender) {
    var f = bodyValues(value, gender), width = 92, height = 156;
    if (!f) return false;
    var ctx = surface(canvas, width, height);
    if (!ctx) return false;
    var p = palette(canvas), cx = width / 2, top = 8, female = gender !== 'male';
    var scale = Math.min(1.08, 1.02 / f.height);
    var sh = f.shoulder * scale, bust = f.bust * scale, waist = f.waist * scale;
    var hip = f.hip * scale, yS = female ? 31 : 33, yB = 52, yW = 73, yH = 92;
    var bottom = Math.min(149, 132 * f.height + 12), leg = Math.max(20, bottom - yH);
    var thigh = Math.max(7, hip * (female ? .74 : .66) * f.thickness);
    var ankle = Math.max(4.2, thigh * (female ? .36 : .46));
    var neck = female ? 3.8 : 5.8, shoulderDrop = female ? 8 : 4;
    var grad = ctx.createLinearGradient(18, 20, 74, bottom);
    grad.addColorStop(0, p.soft); grad.addColorStop(.52, p.accent); grad.addColorStop(1, p.signal);

    /* 여성형은 팔을 몸통에서 분리한 패션 크로키로 먼저 읽히게 한다. */
    if (female) {
      var armTop = yS + shoulderDrop - 1, wristY = yH + 24, armX = sh + 2;
      ctx.save();
      ctx.strokeStyle = p.accent; ctx.globalAlpha = .38; ctx.lineWidth = 5;
      ctx.shadowColor = p.line; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.moveTo(cx - armX, armTop);
      ctx.bezierCurveTo(cx - armX - 5, yB + 12, cx - hip - 6, yH + 2, cx - hip - 4, wristY);
      ctx.moveTo(cx + armX, armTop);
      ctx.bezierCurveTo(cx + armX + 5, yB + 12, cx + hip + 6, yH + 2, cx + hip + 4, wristY);
      ctx.stroke();
      ctx.fillStyle = p.soft; ctx.globalAlpha = .72;
      ctx.beginPath(); ctx.ellipse(cx - hip - 4, wristY + 4, 2.8, 5.2, -.12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + hip + 4, wristY + 4, 2.8, 5.2, .12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    /* FIG의 폭 차이를 유지하면서 어깨·가슴·허리·골반을 곡선으로 잇는다. */
    ctx.save();
    ctx.shadowColor = p.line; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(cx - neck, yS - 6);
    ctx.bezierCurveTo(cx - neck - 4, yS - 4, cx - sh + 4, yS, cx - sh, yS + shoulderDrop);
    ctx.bezierCurveTo(cx - bust - (female ? 1.5 : 0), yB - 5, cx - waist, yW - 5, cx - hip, yH);
    ctx.bezierCurveTo(cx - hip + 1, yH + leg * .24, cx - thigh, bottom - 18, cx - ankle - 2, bottom);
    ctx.lineTo(cx - 2, bottom);
    ctx.bezierCurveTo(cx - 2, bottom - 24, cx - 4, yH + 22, cx, yH + 13);
    ctx.bezierCurveTo(cx + 4, yH + 22, cx + 2, bottom - 24, cx + 2, bottom);
    ctx.lineTo(cx + ankle + 2, bottom);
    ctx.bezierCurveTo(cx + thigh, bottom - 18, cx + hip - 1, yH + leg * .24, cx + hip, yH);
    ctx.bezierCurveTo(cx + waist, yW - 5, cx + bust + (female ? 1.5 : 0), yB - 5, cx + sh, yS + shoulderDrop);
    ctx.bezierCurveTo(cx + sh - 4, yS, cx + neck + 4, yS - 4, cx + neck, yS - 6);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.globalAlpha = .34; ctx.fill();
    ctx.globalAlpha = .92; ctx.strokeStyle = p.accent; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    ctx.fillStyle = p.card; ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (female) ctx.ellipse(cx, top + 10.5, 9.2, 11.3, 0, 0, Math.PI * 2);
    else ctx.arc(cx, top + 10.5, 10.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - neck, yS - 6); ctx.lineTo(cx - 3.5, top + 21);
    ctx.moveTo(cx + neck, yS - 6); ctx.lineTo(cx + 3.5, top + 21); ctx.stroke();

    /* 여성 기준은 둥근 흉곽과 허리 곡선을 한 번 더 읽히게 한다. 장식선이 아니라 형태 안내선이다. */
    if (female) {
      ctx.save(); ctx.strokeStyle = p.accent; ctx.globalAlpha = .42; ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(cx - bust * .72, yB + 1);
      ctx.quadraticCurveTo(cx - bust * .34, yB + 7, cx, yB + 3);
      ctx.quadraticCurveTo(cx + bust * .34, yB + 7, cx + bust * .72, yB + 1);
      ctx.stroke(); ctx.restore();
    }

    ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = p.muted; ctx.globalAlpha = .58; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - waist - 4, yW); ctx.lineTo(cx + waist + 4, yW); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, yS - 1); ctx.lineTo(cx, yH + 9); ctx.stroke(); ctx.restore();
    canvas.dataset.figureReady = 'body';
    canvas.dataset.figureGender = female ? 'female' : 'male';
    canvas.dataset.figureStyle = female ? 'croquis' : 'mannequin';
    return true;
  }

  function drawTail(ctx, x, y, dx, length, color, width) {
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + dx * .9, y + length * .28, x + dx * .75, y + length * .72, x + dx * .45, y + length);
    ctx.strokeStyle = color; ctx.lineWidth = width || 6; ctx.globalAlpha = .58; ctx.stroke(); ctx.globalAlpha = 1;
  }

  function drawBun(ctx, x, y, radius, fill, stroke) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.globalAlpha = .72; ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = stroke; ctx.lineWidth = 1.4; ctx.stroke();
  }

  function drawHair(canvas, value) {
    var f = entry('hairstyle', value), width = 96, height = 118;
    if (!f) return false;
    var ctx = surface(canvas, width, height);
    if (!ctx) return false;
    var p = palette(canvas), len = f[0], texture = f[1], volume = f[2], tie = f[3], fringe = f[4];
    var cx = 48, hy = 40, rx = 17, ry = 21, out = rx + volume * .8;
    var gathered = { mid:1, high:1, sidetail:1, twin:1, topbun:1, midbun:1, lowbun:1, twinbun:1, crown:1 };
    var bottom = gathered[tie] ? hy + ry - 1 : Math.min(103, hy + ry + len * 12);
    var amp = { wavy:3, curly:4.5, coily:6, ringlet:4, locs:2, fwave:2.2, wind:3.5 }[texture] || 0;
    var step = { coily:7, curly:9, ringlet:8, fwave:7 }[texture] || 11;
    var hair = ctx.createLinearGradient(20, 12, 78, 106);
    hair.addColorStop(0, p.accent); hair.addColorStop(.55, p.muted); hair.addColorStop(1, p.signal);

    /* 묶음과 번은 본체 뒤에 먼저 그린다. */
    var tailLength = 18 + len * 10;
    if (tie === 'mid') drawTail(ctx, cx, hy + ry - 3, 8, tailLength, p.accent, 7);
    if (tie === 'high') drawTail(ctx, cx + 2, hy - ry + 2, 14, tailLength + 5, p.accent, 7);
    if (tie === 'sidetail') drawTail(ctx, cx + out - 4, hy + 7, 13, tailLength, p.accent, 7);
    if (tie === 'twin') { drawTail(ctx, cx - out + 3, hy, -12, tailLength, p.accent, 6); drawTail(ctx, cx + out - 3, hy, 12, tailLength, p.accent, 6); }
    if (tie === 'topbun') drawBun(ctx, cx, hy - ry - 7, 8, hair, p.accent);
    if (tie === 'midbun') drawBun(ctx, cx, hy - ry - 3, 9, hair, p.accent);
    if (tie === 'lowbun') drawBun(ctx, cx, hy + ry + 6, 8, hair, p.accent);
    if (tie === 'twinbun') { drawBun(ctx, cx - out - 1, hy - 8, 7, hair, p.accent); drawBun(ctx, cx + out + 1, hy - 8, 7, hair, p.accent); }

    var rightBottom = texture === 'shave' ? hy + 5 : bottom;
    var leftBottom = texture === 'asym' ? Math.max(hy + 8, bottom - 24) : bottom;
    var right = [], left = [], y = hy - 7, i = 0;
    while (y < rightBottom) { y = Math.min(y + step, rightBottom); right.push([cx + out + (amp ? Math.sin(i++ * 1.45) * amp : 0), y]); }
    y = hy - 7; i = 0;
    while (y < leftBottom) { y = Math.min(y + step, leftBottom); left.push([cx - out - (amp ? Math.sin(i++ * 1.45) * amp : 0), y]); }
    ctx.save(); ctx.shadowColor = p.line; ctx.shadowBlur = 7; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.moveTo(cx - out, hy - 5); ctx.quadraticCurveTo(cx, hy - ry - 11, cx + out, hy - 5);
    right.forEach(function (pt) { ctx.lineTo(pt[0], pt[1]); });
    ctx.lineTo(cx, Math.max(leftBottom, rightBottom) + 5);
    left.slice().reverse().forEach(function (pt) { ctx.lineTo(pt[0], pt[1]); });
    ctx.closePath(); ctx.fillStyle = hair; ctx.globalAlpha = .56; ctx.fill();
    ctx.globalAlpha = .95; ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();

    /* 얼굴과 목은 중립색으로 두어 헤어 형태만 읽히게 한다. */
    ctx.beginPath(); ctx.ellipse(cx, hy, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = p.card; ctx.fill();
    ctx.strokeStyle = p.line; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 13, hy + ry + 2); ctx.quadraticCurveTo(cx, hy + ry + 10, cx + 13, hy + ry + 2);
    ctx.lineTo(cx + 21, hy + ry + 11); ctx.lineTo(cx - 21, hy + ry + 11); ctx.closePath();
    ctx.fillStyle = p.soft; ctx.globalAlpha = .72; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();

    ctx.strokeStyle = p.accent;
    if (fringe === 'blunt' || fringe === 'hime') { ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - rx + 2, hy - 7); ctx.lineTo(cx + rx - 2, hy - 7); ctx.stroke(); }
    if (fringe === 'side') { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - rx + 2, hy - 9); ctx.quadraticCurveTo(cx, hy + 1, cx + rx - 2, hy - 10); ctx.stroke(); }
    if (fringe === 'wispy') { ctx.lineWidth = 2; [-11,0,11].forEach(function (x) { ctx.beginPath(); ctx.moveTo(cx + x, hy - 10); ctx.lineTo(cx + x + (x < 0 ? -2 : 2), hy); ctx.stroke(); }); }
    if (tie === 'crown') { ctx.setLineDash([4,3]); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, hy - 3, out, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.setLineDash([]); }

    /* 질감은 작은 명암선으로만 표시한다. 색상이 아니라 형태 비교용이다. */
    ctx.strokeStyle = p.card; ctx.globalAlpha = .56; ctx.lineWidth = 1;
    if (texture === 'locs') [-12,-6,0,6,12].forEach(function (x) { ctx.beginPath(); ctx.moveTo(cx + x, hy - 18); ctx.lineTo(cx + x, bottom); ctx.stroke(); });
    if (texture === 'curly' || texture === 'coily' || texture === 'ringlet') {
      for (i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx - out + 7 + (i % 3) * (out - 5), hy - 8 + Math.floor(i / 3) * 13, texture === 'coily' ? 4 : 5, 0, Math.PI * 1.65); ctx.stroke(); }
    }
    if (texture === 'wavy' || texture === 'fwave' || texture === 'wind') {
      [-9,0,9].forEach(function (x) { ctx.beginPath(); ctx.moveTo(cx + x, hy - 18); ctx.bezierCurveTo(cx + x - 5, hy, cx + x + 6, hy + 12, cx + x, bottom - 2); ctx.stroke(); });
    }
    ctx.globalAlpha = 1;
    if (texture === 'shave') { ctx.setLineDash([2,2]); ctx.strokeStyle = p.muted; ctx.beginPath(); ctx.moveTo(cx + 4, hy - 12); ctx.lineTo(cx + rx + 2, hy + 10); ctx.stroke(); ctx.setLineDash([]); }
    canvas.dataset.figureReady = 'hair';
    return true;
  }

  root.AtelierFigures = {
    has: function (key, value) { return !!entry(key, value); },
    description: function (key, value) {
      var f = entry(key, value);
      return f ? f[f.length - 1] : '';
    },
    dimensions: function (key) { return key === 'body type' ? [92, 156] : [96, 118]; },
    drawBody: drawBody,
    drawHair: drawHair,
    drawForKey: function (key, value, gender, canvas) {
      if (key === 'body type') return drawBody(canvas, value, gender);
      if (key === 'hairstyle') return drawHair(canvas, value);
      return false;
    }
  };
})(window);
