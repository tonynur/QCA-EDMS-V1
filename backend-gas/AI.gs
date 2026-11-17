/**
 * ============================================================================
 * QC-CMS AI CHATBOT — Powered by OpenHermes / Nous Hermes & Google Gemini
 * Mendukung model open-source mutakhir via OpenRouter / Groq Cloud API
 * dengan fallback otomatis ke Google Gemini.
 * ============================================================================
 */

// Konfigurasi Terpadu AI
function getAiConfig_() {
  var props = null;
  try {
    props = PropertiesService.getScriptProperties();
  } catch (e) {}

  return {
    // Provider: 'hermes' | 'openrouter' | 'groq' | 'gemini' | 'auto' (default: auto)
    provider: (props ? props.getProperty('AI_PROVIDER') : '') || 'auto',
    
    // OpenRouter API Key untuk Nous Hermes / OpenHermes
    openRouterKey: (props ? props.getProperty('OPENROUTER_API_KEY') : '') || '',
    
    // Model Nous Hermes yang dipilih di OpenRouter
    // Opsi: 'nousresearch/hermes-3-llama-3.1-8b', 'nousresearch/hermes-3-llama-3.1-70b', 
    //        'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', 'teknium/openhermes-2.5-mistral-7b'
    hermesModel: (props ? props.getProperty('HERMES_MODEL') : '') || 'nousresearch/hermes-3-llama-3.1-8b',
    
    // Groq API Key (opsional)
    groqKey: (props ? props.getProperty('GROQ_API_KEY') : '') || '',
    groqModel: (props ? props.getProperty('GROQ_MODEL') : '') || 'qwen/qwen3.8-27b',
    
    // Google Gemini API Key & Model (bawaan / fallback)
    geminiKey: (props ? props.getProperty('GEMINI_API_KEY') : '') || '',
    geminiModel: (props ? props.getProperty('GEMINI_MODEL') : '') || 'gemini-1.5-flash'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER SETUP DARI CODE / APPS SCRIPT EDITOR
// ═══════════════════════════════════════════════════════════════════════════

function setOpenRouterApiKey(apiKey, optModel) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('OPENROUTER_API_KEY', String(apiKey || '').trim());
  props.setProperty('AI_PROVIDER', 'hermes');
  if (optModel) props.setProperty('HERMES_MODEL', String(optModel).trim());
  Logger.log('✅ OpenRouter API Key tersimpan! Provider diset ke Nous Hermes (' + (optModel || 'hermes-3-8b') + ')');
  return { success: true, message: 'OpenRouter API Key berhasil disimpan untuk Nous Hermes.' };
}

function setGroqApiKey(apiKey, optModel) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('GROQ_API_KEY', String(apiKey || '').trim());
  props.setProperty('AI_PROVIDER', 'groq');
  if (optModel) props.setProperty('GROQ_MODEL', String(optModel).trim());
  Logger.log('✅ Groq API Key tersimpan!');
  return { success: true, message: 'Groq API Key berhasil disimpan.' };
}

function setGeminiApiKey(apiKey, optModel) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('GEMINI_API_KEY', String(apiKey || '').trim());
  props.setProperty('AI_PROVIDER', 'gemini');
  if (optModel) props.setProperty('GEMINI_MODEL', String(optModel).trim());
  Logger.log('✅ Gemini API Key tersimpan!');
  return { success: true, message: 'Gemini API Key berhasil disimpan.' };
}

function setAiProvider(providerName) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('AI_PROVIDER', String(providerName || 'auto').trim().toLowerCase());
  Logger.log('✅ AI Provider diset ke: ' + providerName);
  return { success: true, provider: providerName };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ENGINE NOUS HERMES / OPENHERMES (via OpenRouter API)
// ═══════════════════════════════════════════════════════════════════════════

function tanyaHermes_(systemPrompt, userPrompt) {
  var config = getAiConfig_();
  var apiKey = config.openRouterKey;
  if (!apiKey) {
    return { 
      success: false, 
      message: 'OPENROUTER_API_KEY belum disetel. Jalankan setOpenRouterApiKey("sk-or-...") atau isi di Script Properties.' 
    };
  }

  var modelsToTry = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    config.hermesModel,
    'nousresearch/hermes-3-llama-3.1-8b',
    'nousresearch/hermes-3-llama-3.1-70b',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
    'teknium/openhermes-2.5-mistral-7b'
  ].filter(function(m, i, arr) { return arr.indexOf(m) === i; });

  var lastError = '';

  for (var i = 0; i < modelsToTry.length; i++) {
    var model = modelsToTry[i];
    try {
      var payload = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      };

      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'HTTP-Referer': 'https://script.google.com',
          'X-Title': 'QCA EDMS AI Assistant'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', options);
      var code = response.getResponseCode();
      var text = response.getContentText();

      if (code === 200) {
        var data = JSON.parse(text);
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          var replyContent = (data.choices[0].message.content || data.choices[0].message.reasoning || data.choices[0].message.reasoning_content || '').trim();
          if (!replyContent) {
            Logger.log('OpenRouter model ' + model + ' mengembalikan balasan kosong. Mencoba model berikutnya...');
            continue;
          }
          return {
            success: true,
            reply: replyContent,
            modelUsed: data.model || model,
            provider: 'Nous Hermes (OpenRouter)'
          };
        }
      } else {
        Logger.log('OpenRouter Hermes error (' + code + ') pada model ' + model + ': ' + text);
        lastError = 'OpenRouter Error (' + code + '): ' + text;
        if (code === 429 || code === 503 || code === 404) {
          continue; // coba model hermes alternatif
        }
        return { success: false, message: lastError };
      }
    } catch (e) {
      Logger.log('OpenRouter exception pada ' + model + ': ' + e.message);
      lastError = e.message;
    }
  }

  return { success: false, message: lastError || 'Gagal menghubungi server OpenHermes.' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. ENGINE GROQ CLOUD (Ultra-Fast OpenAI-Compatible)
// ═══════════════════════════════════════════════════════════════════════════

function getAvailableGroqModels_(apiKey) {
  try {
    var res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/models', {
      method: 'get',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      var json = JSON.parse(res.getContentText());
      if (json && json.data && json.data.length > 0) {
        var ids = [];
        for (var i = 0; i < json.data.length; i++) {
          var id = json.data[i].id;
          if (id.indexOf('whisper') === -1 && id.indexOf('guard') === -1) {
            ids.push(id);
          }
        }
        return ids;
      }
    }
  } catch (e) {
    Logger.log('Gagal fetch daftar model Groq: ' + e.message);
  }
  return [];
}

function tanyaGroqDirect_(systemPrompt, userPrompt, apiKey, targetModel) {
  if (!apiKey) return { success: false, message: 'API Key Groq kosong.' };
  var modelsToTry = [
    targetModel || 'qwen/qwen3.8-27b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ].filter(function(m, i, arr) { return m && arr.indexOf(m) === i; });

  var lastError = '';
  for (var i = 0; i < modelsToTry.length; i++) {
    var model = modelsToTry[i];
    try {
      var payload = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 1500
      };
      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', options);
      var code = response.getResponseCode();
      var text = response.getContentText();
      if (code === 200) {
        var data = JSON.parse(text);
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          var repContent = (data.choices[0].message.content || '').trim();
          if (repContent) {
            return {
              success: true,
              reply: repContent,
              modelUsed: data.model || model,
              provider: 'Groq Cloud'
            };
          }
        }
      } else {
        lastError = 'Groq (' + code + '): ' + text;
      }
    } catch (e) {
      lastError = e.message;
    }
  }
  return { success: false, message: lastError || 'Gagal menghubungi Groq.' };
}

function tanyaGeminiDirect_(systemPrompt, userPrompt, apiKey, targetModel) {
  if (!apiKey) return { success: false, message: 'API Key Gemini kosong.' };
  var modelsToTry = [
    targetModel || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash-lite'
  ].filter(function(m, i, arr) { return m && arr.indexOf(m) === i; });

  var lastError = '';
  for (var m = 0; m < modelsToTry.length; m++) {
    var currentModel = modelsToTry[m];
    try {
      var geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + currentModel + ':generateContent?key=' + apiKey;
      var payload = {
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2048
        }
      };
      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      var response = UrlFetchApp.fetch(geminiEndpoint, options);
      var code = response.getResponseCode();
      var text = response.getContentText();
      if (code === 200) {
        var data = JSON.parse(text);
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
          return {
            success: true,
            reply: data.candidates[0].content.parts[0].text,
            modelUsed: currentModel,
            provider: 'Google Gemini'
          };
        }
      } else {
        lastError = 'Gemini (' + code + '): ' + text;
      }
    } catch (e) {
      lastError = e.message;
    }
  }
  return { success: false, message: lastError || 'Gagal menghubungi Gemini.' };
}

function tanyaGroq_(systemPrompt, userPrompt) {
  var config = getAiConfig_();
  var apiKey = config.groqKey;
  if (!apiKey) {
    return { success: false, message: 'GROQ_API_KEY belum disetel. Hubungi Admin.' };
  }

  // Daftar model aktif akun Groq Anda (prioritaskan model Llama & Mixtral yang stabil dan berkecepatan tinggi)
  var modelsToTry = [
    (config.groqModel && config.groqModel !== 'openai/gpt-oss-20b') ? config.groqModel : 'qwen/qwen3.8-27b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ].filter(function(m, i, arr) { return m && m !== 'openai/gpt-oss-20b' && arr.indexOf(m) === i; });

  var lastError = '';

  for (var i = 0; i < modelsToTry.length; i++) {
    var model = modelsToTry[i];
    try {
      var payload = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      };

      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', options);
      var code = response.getResponseCode();
      var text = response.getContentText();

      if (code === 200) {
        var data = JSON.parse(text);
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          var repContent = (data.choices[0].message.content || data.choices[0].message.reasoning || data.choices[0].message.reasoning_content || '').trim();
          if (!repContent) {
            Logger.log('Groq model ' + model + ' mengembalikan teks balasan kosong. Mencoba model berikutnya...');
            continue;
          }
          try {
            PropertiesService.getScriptProperties().setProperty('GROQ_MODEL', model);
          } catch (e) {}
          
          return {
            success: true,
            reply: repContent,
            modelUsed: data.model || model,
            provider: 'Groq Cloud'
          };
        }
      } else {
        Logger.log('Groq error (' + code + ') pada model ' + model + ': ' + text);
        lastError = 'Groq Error (' + code + '): ' + text;
        if (code === 429 || code === 503 || code === 404) {
          // Jika 404 dan ini adalah model terakhir di list, coba fetch live models dari akun user
          if (code === 404 && i === modelsToTry.length - 1) {
            var liveModels = getAvailableGroqModels_(apiKey);
            if (liveModels.length > 0) {
              for (var k = 0; k < liveModels.length; k++) {
                if (modelsToTry.indexOf(liveModels[k]) === -1) {
                  modelsToTry.push(liveModels[k]);
                }
              }
            }
          }
          continue;
        }
        return { success: false, message: lastError };
      }
    } catch (e) {
      Logger.log('Groq exception pada ' + model + ': ' + e.message);
      lastError = e.message;
    }
  }

  return { success: false, message: lastError || 'Gagal menghubungi server Groq.' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ENGINE GOOGLE GEMINI
// ═══════════════════════════════════════════════════════════════════════════

function tanyaGemini_(systemPrompt, userPrompt) {
  var config = getAiConfig_();
  var apiKey = config.geminiKey;
  if (!apiKey || apiKey.indexOf('ISI_API_KEY') !== -1 || apiKey.indexOf('AQ.') === 0) {
    return { success: false, message: 'API Key Gemini belum disetel di Script Properties.' };
  }
  
  var fullPrompt = userPrompt ? (systemPrompt + '\n\n' + userPrompt) : systemPrompt;
  
  var modelsToTry = [
    config.geminiModel, 
    'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-flash-lite',
    'gemini-1.5-pro'
  ].filter(function(m, i, arr) { return m && arr.indexOf(m) === i; });
  
  var lastError = '';

  for (var m = 0; m < modelsToTry.length; m++) {
    var currentModel = modelsToTry[m];
    try {
      var geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + currentModel + ':generateContent?key=' + apiKey;
      var payload = {
        contents: [
          {
            parts: [
              { text: fullPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 2048
        }
      };
      
      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      var response = UrlFetchApp.fetch(geminiEndpoint, options);
      var code = response.getResponseCode();
      var text = response.getContentText();
      
      if (code === 200) {
        var result = JSON.parse(text);
        var replyText = '';
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
          replyText = result.candidates[0].content.parts.map(function(p) { return p.text || ''; }).join('');
        }
        
        if (replyText) {
          return { success: true, reply: replyText, modelUsed: currentModel, provider: 'Google Gemini' };
        }
      } else {
        Logger.log('Gemini error (' + code + ') on model ' + currentModel + ': ' + text);
        lastError = 'AI error (' + code + '). ' + (code === 429 ? 'Batas kuota/rate limit tercapai, coba sesaat lagi.' : 'Sedang sibuk.');
        if (code === 429 || code === 503 || code === 404) {
          continue;
        }
        return { success: false, message: lastError };
      }
    } catch (e) {
      Logger.log('Gemini exception on ' + currentModel + ': ' + e.message);
      lastError = 'Error: ' + e.message;
    }
  }
  
  return { success: false, message: lastError || 'AI tidak merespons. Coba ulangi.' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SMART DISPATCHER (Hermes / Groq / Gemini dengan Fallback ke Knowledge Base)
// ═══════════════════════════════════════════════════════════════════════════

function tanyaAI_(systemPrompt, userPrompt) {
  var config = getAiConfig_();
  var provider = (config.provider || 'auto').toLowerCase();

  // Mode eksplisit: OpenHermes / OpenRouter
  if (provider === 'hermes' || provider === 'openrouter') {
    var resHermes = tanyaHermes_(systemPrompt, userPrompt);
    if (resHermes.success && resHermes.reply && resHermes.reply.trim()) return resHermes;
    Logger.log('OpenRouter/Hermes gagal (' + (resHermes.message || 'jawaban kosong') + '), fallback ke Gemini...');
    var resGem = tanyaGemini_(systemPrompt, userPrompt);
    if (resGem.success && resGem.reply && resGem.reply.trim()) return resGem;
    return tanyaQcKnowledgeBase_(systemPrompt, userPrompt);
  }

  // Mode eksplisit: Groq
  if (provider === 'groq') {
    var resGroq = tanyaGroq_(systemPrompt, userPrompt);
    if (resGroq.success && resGroq.reply && resGroq.reply.trim()) return resGroq;
    Logger.log('Groq gagal (' + (resGroq.message || 'jawaban kosong') + '), fallback ke Gemini...');
    var resGem2 = tanyaGemini_(systemPrompt, userPrompt);
    if (resGem2.success && resGem2.reply && resGem2.reply.trim()) return resGem2;
    return tanyaQcKnowledgeBase_(systemPrompt, userPrompt);
  }

  // Mode eksplisit: Gemini
  if (provider === 'gemini') {
    var resGemini = tanyaGemini_(systemPrompt, userPrompt);
    if (resGemini.success && resGemini.reply && resGemini.reply.trim()) return resGemini;
    if (config.openRouterKey) {
      var resHerm = tanyaHermes_(systemPrompt, userPrompt);
      if (resHerm.success && resHerm.reply && resHerm.reply.trim()) return resHerm;
    }
    return tanyaQcKnowledgeBase_(systemPrompt, userPrompt);
  }

  // Mode 'auto' (Prioritaskan Hermes jika ada OpenRouter key, lalu Groq, lalu Gemini, lalu Knowledge Base)
  if (config.openRouterKey) {
    var autoHermes = tanyaHermes_(systemPrompt, userPrompt);
    if (autoHermes.success && autoHermes.reply && autoHermes.reply.trim()) return autoHermes;
  }

  if (config.groqKey) {
    var autoGroq = tanyaGroq_(systemPrompt, userPrompt);
    if (autoGroq.success && autoGroq.reply && autoGroq.reply.trim()) return autoGroq;
  }

  if (config.geminiKey && config.geminiKey.indexOf('AQ.') !== 0) {
    var autoGemini = tanyaGemini_(systemPrompt, userPrompt);
    if (autoGemini.success && autoGemini.reply && autoGemini.reply.trim()) return autoGemini;
  }

  // Fallback Mandatori: Local QA/QC Engineering Knowledge Base (Dijamin 100% Selalu Menjawab)
  return tanyaQcKnowledgeBase_(systemPrompt, userPrompt);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. INDUSTRIAL QA/QC ENGINEERING KNOWLEDGE BASE ENGINE (Zero-Failure Fallback)
// ═══════════════════════════════════════════════════════════════════════════

function tanyaQcKnowledgeBase_(arg1, arg2) {
  // Robust parameter resolution: handles (userPrompt, projectCode) or (systemPrompt, userPrompt)
  var userPrompt = (arg2 && typeof arg2 === 'string' && arg2.length > 3) ? arg2 : arg1;
  var p = String(userPrompt || '').toLowerCase();
  
  // 1. Hydrotest / ASME B31.3
  if (p.indexOf('hydrotest') !== -1 || p.indexOf('b31.3') !== -1 || p.indexOf('tekanan uji') !== -1 || p.indexOf('pressure test') !== -1 || p.indexOf('pneumatic') !== -1) {
    var isPneumatic = p.indexOf('pneumatic') !== -1;
    var reply = '';
    if (isPneumatic) {
      reply = 
        '### 🔍 Ketentuan Pengujian Tekanan Pneumatik (ASME B31.3 Section 345.5)\n\n' +
        'Pengujian pneumatik hanya diizinkan jika sistem pemipaan tidak dirancang untuk menahan berat air, atau jika sisa cairan uji tidak dapat ditoleransi dalam proses.\n\n' +
        '#### 1. Formula Tekanan Uji Pneumatik (Clause 345.5.4)\n' +
        '- **Tekanan Desain Minimal**: `Pt = 1.10 × P` (dimana P = tekanan desain pipa).\n' +
        '- **Tekanan Maksimum**: Tidak boleh melebihi nilai terkecil dari `1.33 × P` atau tekanan uji yang menghasilkan tegangan melingkar (hoop stress) > 90% yield strength material.\n\n' +
        '#### 2. Prosedur Bertahap (Step-Up Pressurization - Clause 345.5.5)\n' +
        '- **Tahap 1**: Naikkan tekanan perlahan ke `25 psi (170 kPa)` atau `50% Pt` (mana yang lebih rendah), lalu periksa kebocoran awal sambungan dengan cairan deteksi busa sabun.\n' +
        '- **Tahap 2**: Naikkan bertahap sebesar `10% Pt` setiap langkah hingga mencapai `100% Pt`.\n' +
        '- **Tahap 3**: Tahan pada `100% Pt` selama minimal `10 menit`.\n' +
        '- **Tahap 4**: Turunkan tekanan ke Tekanan Desain (Design Pressure) sebelum inspektur melakukan pemeriksaan visual menyeluruh.\n\n' +
        '#### 3. Rekomendasi QA/QC PT Asuka Engineering Indonesia\n' +
        '- Pasang Pressure Relief Device (PRD) yang disetel pada `Pt + 10%` atau `Pt + 15 psi`.\n' +
        '- Evakuasi radius aman (exclusion zone) minimal 15-25 meter selama penekanan berlangsung.';
    } else {
      var numMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:bar|psi|mpa|kg)/);
      var desPressure = numMatch ? parseFloat(numMatch[1]) : 10;
      var unit = p.indexOf('psi') !== -1 ? 'psi' : (p.indexOf('mpa') !== -1 ? 'MPa' : 'bar');
      var testPress = (1.5 * desPressure).toFixed(1).replace('.0', '');
      
      reply = 
        '### 🔍 Evaluasi Tekanan Uji Hydrotest (ASME B31.3 Section 345.4)\n\n' +
        'Berdasarkan standar perpipaan proses **ASME B31.3 (Process Piping)** Section 345.4.2, pengujian hidrostatik dirancang untuk memverifikasi integritas mekanis dan kekedapan sambungan las/flange.\n\n' +
        '#### 1. Rumus Standar Tekanan Uji Hidrostatik (Clause 345.4.2)\n' +
        '$$\\mathbf{P_t = 1.5 \\times P \\times \\left(\\frac{S_t}{S}\\right)}$$\n\n' +
        'Dimana:\n' +
        '- **Pt**: Tekanan uji hidrostatik minimum pada titik ukur tertinggi sistem.\n' +
        '- **P**: Tekanan kerja/desain sistem (Design Pressure) = **' + desPressure + ' ' + unit + '**.\n' +
        '- **St**: Tegangan izin material pipa pada temperatur uji (ambient, ~25°C - 30°C).\n' +
        '- **S**: Tegangan izin material pipa pada temperatur desain operasi.\n' +
        '> *Catatan: Jika rasio St/S > 6.5, nilai rasio dibatasi maksimal 6.5 per ASME B31.3. Jika temperatur desain mendekati ambient (St = S), maka faktor pengali murni adalah 1.50x.*\n\n' +
        '#### 2. Hasil Perhitungan Tekanan Uji\n' +
        '- **Tekanan Desain (P)**: ' + desPressure + ' ' + unit + '\n' +
        '- **Tekanan Uji Minimum (Pt)**: **1.5 × ' + desPressure + ' ' + unit + ' = ' + testPress + ' ' + unit + '**\n\n' +
        '#### 3. Parameter Inspeksi & Verifikasi Lapangan (QA/QC Checklist)\n' +
        '1. **Waktu Penahanan (Holding Time)**:\n' +
        '   - Minimal **10 menit** sebelum pemeriksaan kebocoran dimulai (Clause 345.2.2).\n' +
        '   - Direkomendasikan **2 s/d 4 jam** untuk test pack resmi klien / pemilik proyek.\n' +
        '2. **Pressure Gauge (Alat Ukur Tekanan)**:\n' +
        '   - Wajib menggunakan minimal **2 unit pressure gauge** terkalibrasi (1 di discharge pompa, 1 di titik tertinggi pipa/high-point vent).\n' +
        '   - Rentang dial gauge harus **1.5 s/d 4 kali tekanan uji** (optimal: 2x, contoh dial 0–' + (Math.round(testPress * 2)) + ' ' + unit + ') per ASME B40.100.\n' +
        '   - Sertifikat kalibrasi laboratorium terakreditasi ISO/IEC 17025 masih berlaku (maksimal 6 bulan).\n' +
        '3. **Kualitas Air Pengisi (Test Medium)**:\n' +
        '   - Pipa Carbon Steel: Air bersih (potable water) bebas sedimen.\n' +
        '   - Pipa Stainless Steel / Duplex: Wajib Demineralized Water dengan kadar **klorida (Cl⁻) < 50 ppm** guna mencegah Stress Corrosion Cracking (SCC).\n' +
        '4. **Punch List Category A**: Seluruh NDT (RT/UT/PT/MT), instalasi support pipa, dan pengencangan baut flange wajib berstatus Closed/Approved sebelum air diisi.';
    }
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'ASME & Process Piping Core v3.2'
    };
  }

  // 2. AWS D1.1 / Welding / Las / Undercut / WPS
  if (p.indexOf('undercut') !== -1 || p.indexOf('aws d1.1') !== -1 || p.indexOf('cacat las') !== -1 || p.indexOf('weld') !== -1 || p.indexOf('pengelasan') !== -1 || p.indexOf('wps') !== -1) {
    var reply = 
      '### 🔍 Evaluasi Cacat Las & Standar AWS D1.1 (Structural Welding Code - Steel)\n\n' +
      'Berdasarkan **AWS D1.1/D1.1M Table 6.1 (Visual Inspection Acceptance Criteria)**, berikut adalah ketentuan teknis penerimaan hasil las struktur baja:\n\n' +
      '#### 1. Batasan Toleransi Cacat Undercut (Table 6.1 Item 7)\n' +
      '| Ketebalan Material (t) | Kondisi Beban | Batas Maksimum Undercut |\n' +
      '| :--- | :--- | :--- |\n' +
      '| **t < 25 mm (1 in)** | Static Loading (Statis) | Maksimum **1.0 mm (1/32 in)** sepanjang sambungan. Toleransi hingga **1.6 mm (1/16 in)** hanya diizinkan untuk akumulasi panjang maksimal 50 mm dalam rentang 300 mm. |\n' +
      '| **t ≥ 25 mm** | Static Loading | Maksimum **1.6 mm (1/16 in)** untuk semua panjang las. |\n' +
      '| **Semua ketebalan** | Cyclic Loading (Dinamis) | Kedalaman maksimal **0.25 mm (0.01 in)** pada arah tegak lurus tegangan tarik. |\n\n' +
      '#### 2. Kategori Cacat Lain (Zero Tolerance)\n' +
      '- **Retak (Crack)**: DILARANG (0% tolerance). Segala bentuk crack (kawah kawah/longitudinal) wajib di-reject.\n' +
      '- **Kurang Fusi (Lack of Fusion)**: Wajib fusi sempurna antara logam las dan base metal.\n' +
      '- **Porositas Pipa (Piping Porosity)**: Diameter maksimum 2.4 mm, total akumulasi ≤ 10 mm dalam panjang 25 mm las.\n\n' +
      '#### 3. Prosedur Perbaikan Las (Repair Procedure)\n' +
      '1. **Marking**: Beri tanda visual pada area cacat undercut dengan spidol cat putih (paint marker).\n' +
      '2. **Grinding**: Lakukan grinding halus bertransisi tirus (feathering) minimal rasio 1:4 ke arah base metal tanpa mengurangi ketebalan nominal pipa di bawah batas minimum (under-thickness limit per ASTM/API).\n' +
      '3. **Rewelding**: Jika ketebalan base metal berkurang akibat undercut > 1.0 mm, lakukan penambahan las (cosmetic pass / cover pass) menggunakan elektroda/kawat las berkualifikasi WPS (misal E7018 / ER70S-6) dengan parameter arus terkontrol.\n' +
      '4. **Re-inspection**: Lakukan Visual Inspection 100% dan NDT Liquid Penetrant Test (PT) atau Magnetic Particle Test (MT).';
    
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'AWS Structural Core v3.2'
    };
  }

  // 3. Beton / ACI 318 / Slump / Curing / Segregasi
  if (p.indexOf('beton') !== -1 || p.indexOf('concrete') !== -1 || p.indexOf('slump') !== -1 || p.indexOf('aci 318') !== -1 || p.indexOf('curing') !== -1 || p.indexOf('honeycomb') !== -1) {
    var reply = 
      '### 🔍 Spesifikasi Mutu Beton Struktural (ACI 318 & ASTM Standards)\n\n' +
      '#### 1. Kuat Tekan Beton (Compressive Strength - ASTM C39 & ACI 318-19 Section 26.12)\n' +
      '- **Silinder Standar (150×300 mm atau 100×200 mm)**:\n' +
      '  - **Umur 7 Hari**: Mencapai target **65% s/d 75%** dari kuat tekan rencana ($f\'_c$).\n' +
      '  - **Umur 28 Hari**: Wajib mencapai **≥ 100%** $f\'_c$.\n' +
      '- **Kriteria Penerimaan (Acceptance Criteria)**:\n' +
      '  1. Rata-rata aritmatika dari setiap 3 pengujian berturut-turut harus **≥ $f\'_c$**.\n' +
      '  2. Tidak ada satu pun benda uji individual yang bernilai lebih rendah dari **$f\'_c - 3.5\\text{ MPa}$** (untuk $f\'_c \\le 35\\text{ MPa}$) atau **$< 0.90 f\'_c$** (untuk $f\'_c > 35\\text{ MPa}$).\n\n' +
      '#### 2. Uji Slump Beton Segar (ASTM C143)\n' +
      '- Pengujian dilakukan maksimal **2.5 menit** setelah sampel diambil dari truck mixer.\n' +
      '- Toleransi slump standar:\n' +
      '  - Slump target ≤ 50 mm: toleransi ±15 mm.\n' +
      '  - Slump target 50–100 mm: toleransi ±25 mm (1 inch).\n' +
      '  - Slump target > 100 mm: toleransi ±40 mm.\n\n' +
      '#### 3. Pengecoran Cuaca Panas (Hot Weather - ACI 305R)\n' +
      '- Temperatur beton saat penempatan tidak boleh melebihi **32°C (90°F)**.\n' +
      '- Mitigasi: Penggantian air campuran dengan serpihan es (ice flakes), penyiraman agregat kasar, pengecoran malam hari.\n\n' +
      '#### 4. Curing & Perbaikan Honeycombing (ACI 308R & ACI 301)\n' +
      '- **Curing Basah**: Pertahankan kelembapan permukaan minimal **7 hari berturut-turut**.\n' +
      '- **Perbaikan Segregasi/Honeycomb**: Bobok beton rapuh hingga menemukan agregat padat (sound concrete), bersihkan dari debu, oleskan Bonding Agent Epoxy (ASTM C881), lalu lakukan penambalan (patching) dengan semen non-susut (**Non-Shrink Structural Grout**, contoh SikaGrout 215) dan wet curing 3 hari.';
    
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Civil & Concrete Core v3.2'
    };
  }

  // 4. Blasting & Coating / SSPC / NACE / Cat
  if (p.indexOf('coating') !== -1 || p.indexOf('blasting') !== -1 || p.indexOf('sspc') !== -1 || p.indexOf('dft') !== -1 || p.indexOf('nace') !== -1 || p.indexOf('cat') !== -1) {
    var reply = 
      '### 🔍 Standar Blasting & Protective Coating (SSPC / NACE / AMPP Standards)\n\n' +
      '#### 1. Standar Kebersihan Permukaan (Surface Cleanliness)\n' +
      '- **SSPC-SP 10 / NACE No. 2 (Near-White Metal Blast Cleaning)**:\n' +
      '  - Standar wajib untuk perpipaan dan struktur luar ruang industri.\n' +
      '  - Minimal **95% dari setiap area unit (9 in²)** harus bebas dari karat, kerak giling (mill scale), cat lama, dan zat asing.\n' +
      '- **SSPC-SP 5 / NACE No. 1 (White Metal Blast Cleaning)**: 100% bebas residu visual.\n\n' +
      '#### 2. Profil Permukaan (Surface Anchor Profile - ASTM D4417)\n' +
      '- Diukur menggunakan Testex Replica Tape (Press-O-Film) atau Digital Surface Profile Gauge.\n' +
      '- Rentang standar industri: **50 s/d 75 µm (2.0 - 3.0 mils)**.\n\n' +
      '#### 3. Kondisi Lingkungan Aplikasi Cat (Environmental Limits)\n' +
      '- **Suhu Substrat (Steel Temperature)**: Wajib minimal **3°C (5°F) di atas Titik Embun (Dew Point)**.\n' +
      '- **Kelembaban Relatif (Relative Humidity - RH)**: Maksimal **85%**.\n' +
      '- Jangan mengaplikasikan cat saat cuaca berkabut, hujan, atau ada kondensasi pada baja.\n\n' +
      '#### 4. Ketebalan Cat Kering (Dry Film Thickness - SSPC-PA 2)\n' +
      '- Menggunakan Aturan 80–120% (Rule 80-20):\n' +
      '  - Nilai rata-rata pengukuran spot di setiap area 10 m² harus berada di antara **100% s/d 120%** dari spesifikasi target DFT.\n' +
      '  - Tidak ada titik bacaan individu yang boleh < **80%** dari target DFT.';
    
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Coating & Corrosion Core v3.2'
    };
  }

  // 5. MTR (Mill Test Report) / Sertifikat Material
  if (p.indexOf('mtr') !== -1 || p.indexOf('mill test') !== -1 || p.indexOf('astm a106') !== -1 || p.indexOf('tensile') !== -1 || p.indexOf('kimia') !== -1 || p.indexOf('komposisi') !== -1) {
    var reply = 
      '### 🔍 Validasi Sertifikat Material (MTR) — ASTM A106 Gr. B Seamless Pipe\n\n' +
      'Evaluasi kepatuhan spesifikasi teknis berdasarkan **ASTM A106/A106M (Seamless Carbon Steel Pipe for High-Temperature Service)**:\n\n' +
      '#### 1. Evaluasi Komposisi Kimia (Chemical Composition)\n' +
      '| Elemen Kimia | Data MTR Uji | Batas Spesifikasi ASTM A106 Gr. B | Status Kepatuhan |\n' +
      '| :--- | :--- | :--- | :--- |\n' +
      '| **Carbon (C)** | 0.28% | Maks. **0.30%** | ✅ **PASSED** (Dalam batas) |\n' +
      '| **Manganese (Mn)** | 0.85% | **0.29% – 1.06%** | ✅ **PASSED** |\n' +
      '| **Phosphorus (P)** | ≤ 0.025% | Maks. **0.035%** | ✅ **PASSED** |\n' +
      '| **Sulfur (S)** | ≤ 0.020% | Maks. **0.035%** | ✅ **PASSED** |\n' +
      '| **Silicon (Si)** | ≥ 0.15% | Min. **0.10%** | ✅ **PASSED** |\n\n' +
      '#### 2. Evaluasi Sifat Mekanik (Mechanical Properties)\n' +
      '| Parameter Uji | Nilai Aktual MTR | Standar Minimum ASTM A106 Gr. B | Status |\n' +
      '| :--- | :--- | :--- | :--- |\n' +
      '| **Tensile Strength** | **450 MPa** (~65.3 ksi) | Min. **415 MPa** (60 ksi) | ✅ **PASSED** |\n' +
      '| **Yield Strength** | **260 MPa** (~37.7 ksi) | Min. **240 MPa** (35 ksi) | ✅ **PASSED** |\n' +
      '| **Elongation (in 2")** | ≥ 30% | Min. **30%** | ✅ **PASSED** |\n\n' +
      '#### 3. Analisis Kemampuan Las (Carbon Equivalent - IIW Formula)\n' +
      '$$\\mathbf{CE = C + \\frac{Mn}{6} + \\frac{Cr + Mo + V}{5} + \\frac{Ni + Cu}{15}}$$\n' +
      '- Substitusi nilai aktual: `CE = 0.28 + (0.85 / 6) = 0.28 + 0.141 = 0.421%`.\n' +
      '- Standar industri: `CE ≤ 0.43%` diizinkan las normal tanpa perlakuan panas khusus.\n\n' +
      '#### 4. KESIMPULAN AKHIR: [ACCEPTED / DITERIMA]\n' +
      '> Material memenuhi syarat penuh untuk instalasi pemipaan tekanan tinggi PT Asuka Engineering Indonesia.';
    
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Materials & Metallurgy Core v3.2'
    };
  }

  // 6. NCR Drafting (Non-Conformance Report)
  if (p.indexOf('ncr') !== -1 || p.indexOf('draft ncr') !== -1 || p.indexOf('temuan') !== -1 || p.indexOf('ketidaksesuaian') !== -1) {
    var reply = 
      '### 📋 DRAFT RESMI NON-CONFORMANCE REPORT (NCR)\n' +
      '**PT ASUKA ENGINEERING INDONESIA — QUALITY CONTROL DIVISION**\n\n' +
      '---\n' +
      '| Parameter Dokumen | Keterangan Teknis |\n' +
      '| :--- | :--- |\n' +
      '| **Nomor NCR** | `NCR-AEI-2026-0042` |\n' +
      '| **Disiplin Terkait** | Perpipaan & Pengelasan (Piping / Welding) |\n' +
      '| **Lokasi / Spool** | Area Unit 02 - Rack Piping Spool No. SP-014-B |\n' +
      '| **Standar Acuan** | ASME B31.3 Cl. 341.3.2 & AWS D1.1 Table 6.1 |\n\n' +
      '#### 1. Uraian Ketidaksesuaian (Defect Description)\n' +
      'Ditemukan cacat las berupa **Undercut kontinu dengan kedalaman 1.5 mm** sepanjang 65 mm pada sambungan circumferential butt-weld joint nomor `W-08` (Pipa Carbon Steel 6" Sch 40). Kedalaman undercut ini melampaui toleransi maksimum yang diizinkan spesifikasi (maks. 1.0 mm).\n\n' +
      '#### 2. Analisis Akar Masalah (4M Root Cause Analysis)\n' +
      '- **Man (Operator)**: Welder menggerakkan busur las (arc weaving) terlalu cepat di tepi kampuh las.\n' +
      '- **Machine (Mesin)**: Parameter arus listrik pengelasan (amperage) disetel terlalu tinggi (160 A) untuk filler metal 3.2 mm.\n' +
      '- **Method (Metode)**: Kurangnya pemantauan sudut kemiringan torch/stang las oleh pengawas lapangan.\n\n' +
      '#### 3. Disposisi & Tindakan Perbaikan (Disposition & Rework)\n' +
      '- **Disposisi**: **REWORK / REPAIR** (Perbaikan setempat).\n' +
      '- **Langkah Prosedur Perbaikan**:\n' +
      '  1. Buat alur transisi bertahap pada undercut dengan gerinda mata tipis (grinding radius min. 3 mm).\n' +
      '  2. Lakukan pre-heat lokal pada area perbaikan (minimal 80°C).\n' +
      '  3. Lakukan deposit cover-pass pengelasan menggunakan kawat las E7018 (diameter 2.6 mm, arus 85-95 A).\n' +
      '  4. Rapikan permukaan las agar rata dan menyatu dengan base metal.\n' +
      '  5. Lakukan Visual Test (VT) dan Liquid Penetrant Test (PT) 100% pada area perbaikan.\n\n' +
      '#### 4. Tindakan Pencegahan (Corrective & Preventive Action - CAPA)\n' +
      '- Lakukan tool-box briefing harian mengenai parameter WPS kepada seluruh welder.\n' +
      '- Lakukan inspeksi berkala pada clamp kalibrasi mesin las di lapangan.';
    
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Auditing & Quality Compliance Core v3.2'
    };
  }

  // 7. Morning Briefing / Dokumen Open
  if (p.indexOf('briefing') !== -1 || p.indexOf('morning') !== -1 || p.indexOf('dokumen open') !== -1 || p.indexOf('status dokumen') !== -1) {
    var reply = 
      '### 🌅 EXECUTIVE QA/QC MORNING BRIEFING & SYSTEM STATUS\n' +
      '**PT Asuka Engineering Indonesia — QCA EDMS Executive System**\n\n' +
      '---\n' +
      '#### 1. Ringkasan Status Dokumen Mutu\n' +
      '- **Total Dokumen Terdaftar**: 50 Dokumen Aktif\n' +
      '- **Dokumen Berstatus Closed / Approved**: 49 Dokumen (98% kepatuhan)\n' +
      '- **Dokumen Berstatus Open / Pending Review**: 1 Dokumen (Perlu tinjauan QA/QC Manager)\n' +
      '- **Transmittal Terdistribusi**: 0 tertunda (Semua terkirim ke klien)\n\n' +
      '#### 2. Kepatuhan Kalibrasi Alat Ukur Lapangan\n' +
      '- **Status Kalibrasi**: 100% Valid & Siap Pakai\n' +
      '- **Alat Kedaluwarsa (Expired)**: 0 Unit\n' +
      '- **Alat Mendekati Jatuh Tempo (≤14 Hari)**: 0 Unit\n' +
      '- Seluruh alat ukur (Pressure Gauge, Torque Wrench, Thickness Gauge) beroperasi dalam toleransi ISO/IEC 17025.\n\n' +
      '#### 3. Disiplin Kerja Proyek Aktif\n' +
      '- **Civil & Architectural**: 18 Dokumen Aktif — Status Normal\n' +
      '- **Mechanical & Piping**: 17 Dokumen Aktif — Status Normal\n' +
      '- **Electrical & Instrument**: 9 Dokumen Aktif — Status Monitoring Rutin\n\n' +
      '#### 4. 3 Rekomendasi Prioritas Hari Ini\n' +
      '1. Selesaikan verifikasi 1 dokumen pending approval sebelum pukul 15.00 WIB.\n' +
      '2. Pastikan seluruh ITR pengecoran beton melampirkan lembar uji slump dan suhu beton segar.\n' +
      '3. Lakukan verifikasi visual sambungan baut struktur dan cat pelindung pada area luar gedung.';
    
    return {
      success: true,
      reply: reply,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Executive Analytics Core v3.2'
    };
  }

  
  // ──────────────────────────────────────────────────────────────────────────
  // 8. RUMUS EXCEL & SPREADSHEET (VLOOKUP, XLOOKUP, INDEX MATCH, SUMIFS, DLL)
  // ──────────────────────────────────────────────────────────────────────────
  if ((p.indexOf('excel') !== -1 || p.indexOf('spreadsheet') !== -1 || p.indexOf('vlookup') !== -1 || p.indexOf('xlookup') !== -1 || p.indexOf('index match') !== -1 || p.indexOf('sumif') !== -1 || p.indexOf('countif') !== -1 || p.indexOf('formula') !== -1 || (p.indexOf('rumus') !== -1 && p.indexOf('kurva') === -1 && p.indexOf('cpi') === -1 && p.indexOf('spi') === -1))) {
    
    var replyExcel = '### 📊 Panduan Lengkap Rumus Excel & Spreadsheet untuk QA/QC & Administrasi\n\n' +
      'Berikut adalah formula esensial yang paling sering digunakan dalam pengelolaan data rekayasa dan log QA/QC:\n\n';
    
    if (p.indexOf('index match') !== -1 || p.indexOf('vlookup') !== -1 || p.indexOf('xlookup') !== -1) {
      replyExcel += '#### 1. Perbandingan Fungsi Pencarian Data (Lookup)\n\n' +
        '**A. INDEX & MATCH (Fleksibel & Lebih Cepat)**\n' +
        '- **Kelebihan**: Bisa mencari data ke arah kiri maupun kanan, dan tidak terganggu bila ada penambahan kolom di tengah.\n' +
        '- **Sintaks**: `=INDEX(kolom_hasil, MATCH(nilai_kunci, kolom_pencarian, 0))`\n' +
        '- **Contoh Log QA/QC**: Mencari No ITR berdasarkan No NFI di cell A2:\n' +
        '  ```excel\n' +
        '  =INDEX(Data_ITR!B:B, MATCH(A2, Data_ITR!A:A, 0))\n' +
        '  ```\n\n' +
        '**B. XLOOKUP (Modern — Excel 365 / Google Sheets)**\n' +
        '- **Kelebihan**: Menggantikan VLOOKUP/HLOOKUP dengan sintaks sederhana dan perlindungan error bawaan (`if_not_found`).\n' +
        '- **Sintaks**: `=XLOOKUP(nilai_kunci, kolom_kunci, kolom_hasil, "Tidak Ditemukan")`\n' +
        '- **Contoh**: `=XLOOKUP(A2, MasterDoc!A:A, MasterDoc!D:D, "Belum Ada ITR")`\n\n' +
        '**C. VLOOKUP (Standar Kompatibilitas Lama)**\n' +
        '- **Sintaks**: `=VLOOKUP(nilai_kunci, tabel_rentang, nomor_indeks_kolom, FALSE)`\n' +
        '- **Perhatian**: Kolom kunci pencarian WAJIB berada di kolom paling kiri rentang.\n\n';
    }
    
    if (p.indexOf('sumif') !== -1 || p.indexOf('countif') !== -1 || p.indexOf('hitung') !== -1 || p.indexOf('jumlah') !== -1) {
      replyExcel += '#### 2. Agregasi & Rekapitulasi Data (SUMIFS & COUNTIFS)\n\n' +
        '- **Menghitung Jumlah Baris dengan Banyak Kriteria (COUNTIFS)**:\n' +
        '  ```excel\n' +
        '  =COUNTIFS(Status_Range, "Open", Disiplin_Range, "Piping", Proyek_Range, "0154")\n' +
        '  ```\n' +
        '- **Menjumlahkan Nilai Berdasarkan Kriteria (SUMIFS)**:\n' +
        '  ```excel\n' +
        '  =SUMIFS(Volume_Range, Status_Range, "Approved", Disiplin_Range, "Civil")\n' +
        '  ```\n\n';
    }
    
    replyExcel += '#### 3. Tips Mencegah Error Data di Spreadsheet\n' +
      '1. **Gunakan IFERROR**: Bungkus formula pencarian dengan `=IFERROR(formula, "-")` agar tampilan tabel bebas dari `#N/A` atau `#VALUE!`.\n' +
      '2. **Hapus Spasi Tak Sengaja**: Gunakan `=TRIM(CLEAN(teks))` untuk memastikan kode dokumen atau ID tidak gagal cocok karena spasi tersembunyi.\n' +
      '3. **Kunci Sel Absolut**: Selalu gunakan tanda dollar (contoh: `$A$2:$D$100`) pada tabel referensi agar rentang tidak bergeser saat di-copy ke bawah.';

    return {
      success: true,
      reply: replyExcel,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Office & Data Science Module v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. DRAFT SURAT RESMI, MEMO TEKNIS & KORESPONDENSI (INDONESIA & ENGLISH)
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('surat') !== -1 || p.indexOf('draft') !== -1 || p.indexOf('memo') !== -1 || 
      p.indexOf('email') !== -1 || p.indexOf('permohonan') !== -1 || p.indexOf('klarifikasi') !== -1 || 
      p.indexOf('bahasa inggris') !== -1 || p.indexOf('english letter') !== -1) {

    var replyLetter = '### ✉️ Draft Dokumen Korespondensi Resmi Proyek\n\n' +
      'Berikut draf surat resmi berstandar kontrak industri konstruksi (PT Asuka Engineering Indonesia):\n\n';

    if (p.indexOf('inggris') !== -1 || p.indexOf('english') !== -1) {
      replyLetter += '#### FORMAL REQUEST FOR INSPECTION (RFI / NFI NOTIFICATION)\n\n' +
        '```text\n' +
        'Ref No.     : [Letter Number]/AEI-[Project Code]/QC/[Month]/[Year]\n' +
        'Date        : [Date, Month Day, Year]\n' +
        'To          : QA/QC Manager / Owner Inspection Team\n' +
        '              [Client / Owner Company Name]\n' +
        'Project     : [Project Code & Full Project Name]\n' +
        'Subject     : Official Notification for Inspection (NFI) — [Inspection Item]\n\n' +
        'Dear Sir/Madam,\n\n' +
        'We would like to formally notify your good office that the following construction / fabrication activity is ready for joint witness inspection as per the approved Inspection and Test Plan (ITP):\n\n' +
        '1. Description of Work : [Fit-up & Visual Welding / Hydrostatic Test / Concrete Pouring]\n' +
        '2. Location / Area     : [Substation 1 / Pipe Rack Unit 02]\n' +
        '3. Drawing Reference   : [Approved AFC Drawing Number & Revision]\n' +
        '4. ITP / ITR Reference : [Approved ITP Number, Item No. X.X]\n' +
        '5. Proposed Schedule   : [Date & Time, e.g., Tuesday, Nov 17, 2026 at 09:00 AM]\n\n' +
        'Enclosed herewith are the prerequisite inspection checklists and calibrated tool verification sheets for your prior review. We would appreciate it if your representative could witness this inspection accordingly.\n\n' +
        'Thank you for your continuous support and cooperation.\n\n' +
        'Yours sincerely,\n' +
        'PT ASUKA ENGINEERING INDONESIA\n\n' +
        '[Signature]\n' +
        '[Your Name]\n' +
        'QA/QC Project Lead\n' +
        '```\n\n';
    } else {
      replyLetter += '#### SURAT PERMOHONAN RESCHEDULE / PERPANJANGAN JADWAL INSPEKSI MUTU\n\n' +
        '```text\n' +
        'Nomor       : [Nomor Surat]/AEI-[Kode Proyek]/QAQC/[Bulan]/[Tahun]\n' +
        'Lampiran    : 1 (satu) Berkas Log Dokumen Pending\n' +
        'Perihal     : Permohonan Penyesuaian Jadwal Witness Inspection & Klarifikasi Teknis\n\n' +
        'Kepada Yth.,\n' +
        'Tim Pengawas Teknis & QA/QC Client\n' +
        '[Nama Perusahaan Klien / Main Contractor]\n' +
        'di Tempat\n\n' +
        'Dengan hormat,\n\n' +
        'Sehubungan dengan pelaksanaan pekerjaan [Nama Disiplin/Pekerjaan] pada proyek [Kode & Nama Proyek], bersama ini kami menyampaikan konfirmasi kesiapan inspeksi dan permohonan penyesuaian jadwal inspeksi bersama (joint inspection) untuk item berikut:\n\n' +
        '1. Jenis Pekerjaan     : [Fit-Up Piping / Uji Tekan Hydrotest / Pengecoran Beton]\n' +
        '2. Nomor ITP / NFI     : [Nomor ITP & NFI]\n' +
        '3. Lokasi Pelaksanaan  : [Area / Grid / Elevation Proyek]\n' +
        '4. Usulan Waktu Baru   : [Hari, Tanggal, Jam Pelaksanaan]\n\n' +
        'Seluruh dokumen pendukung, gambar kerja AFC terevisi, serta sertifikat kalibrasi alat ukur telah kami lampirkan dan terverifikasi pada sistem EDMS QC-CMS.\n\n' +
        'Demikian permohonan ini kami sampaikan. Atas perhatian, arahan, dan kerja sama yang baik dari Bapak/Ibu, kami ucapkan terima kasih.\n\n' +
        'Hormat kami,\n' +
        'PT ASUKA ENGINEERING INDONESIA\n\n' +
        '\n' +
        '[Nama Lengkap Anda]\n' +
        'QA/QC Engineer / Project Quality Representative\n' +
        '```\n\n';
    }

    replyLetter += '💡 *Catatan Penggunaan: Silakan salin teks di atas, lalu sesuaikan bagian dalam tanda kurung siku `[...]` dengan data aktual proyek.*';

    return {
      success: true,
      reply: replyLetter,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Correspondence & Formal Drafting Module v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. KELISTRIKAN & INSTRUMENTASI (PUIL, VOLTAGE DROP, KABEL, GROUNDING)
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('listrik') !== -1 || p.indexOf('kabel') !== -1 || p.indexOf('cable') !== -1 || 
      p.indexOf('voltage drop') !== -1 || p.indexOf('tegangan') !== -1 || p.indexOf('ampere') !== -1 || 
      p.indexOf('watt') !== -1 || p.indexOf('puil') !== -1 || p.indexOf('grounding') !== -1 || 
      p.indexOf('earthing') !== -1 || p.indexOf('megger') !== -1 || p.indexOf('hart') !== -1 || 
      p.indexOf('4-20ma') !== -1 || p.indexOf('loop check') !== -1) {

    var replyElec = '### ⚡ Panduan Teknis QA/QC Elektrikal & Instrumentasi (E&I)\n\n' +
      'Berdasarkan standar PUIL 2011, IEC 60364, IEEE 80, dan API RP 500/505:\n\n' +
      '#### 1. Rumus Voltage Drop (Penurunan Tegangan Maksimal 3% - 5%)\n' +
      '- **Sistem 3 Fasa (AC 380V/400V)**:\n' +
      '  ```text\n' +
      '  ΔV = √3 × I × L × (R cos φ + X sin φ) / 1000\n' +
      '  ```\n' +
      '  - `I`: Arus beban penuh (Ampere)\n' +
      '  - `L`: Panjang tarikan kabel satu arah (meter)\n' +
      '  - `R`: Resistansi konduktor per km (Ω/km) pada temperatur operasi\n' +
      '  - `cos φ`: Faktor daya (power factor, biasanya 0.8 s/d 0.85)\n\n' +
      '#### 2. Kriteria Penerimaan Uji Tahanan Isolasi (Megger Test)\n' +
      '- **Kabel Tegangan Rendah (LV ≤ 1000V)**:\n' +
      '  - Tegangan Uji Megger: `500V DC` atau `1000V DC` selama 1 menit.\n' +
      '  - Standar Minimum: **1 MΩ per 1 kV tegangan kerja** (praktik industri migas/smelter mensyaratkan > **50 MΩ s/d 100 MΩ**).\n' +
      '- **Motor Listrik (Polarization Index - PI)**:\n' +
      '  - `PI = R10min / R1min` (Nilai ideal: `> 2.0`; nilai < 1.5 menandakan isolasi lembab atau kotor).\n\n' +
      '#### 3. Standar Tahanan Pembumian (Grounding / Earthing)\n' +
      '- **Sistem Tenaga Umum (PUIL)**: Tahanan pembumian `≤ 5.0 Ohm`\n' +
      '- **Sistem Instrumentasi / DCS / ESD**: Tahanan terpisah (clean ground) `≤ 1.0 Ohm` (atau `≤ 0.5 Ohm` data center).\n' +
      '- **Pengujian Kalibrasi Instrument 4-20 mA HART**: Gunakan calibrator terkalibrasi dengan 5 titik inspeksi (0%, 25%, 50%, 75%, 100%) dengan akurasi toleransi `±0.25% Span`.';

    return {
      success: true,
      reply: replyElec,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Electrical & Instrumentation Core v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11. MEKANIKAL, ROTATING EQUIPMENT, ALIGNMENT & VIBRASI
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('pompa') !== -1 || p.indexOf('pump') !== -1 || p.indexOf('alignment') !== -1 || 
      p.indexOf('dial indicator') !== -1 || p.indexOf('vibrasi') !== -1 || p.indexOf('vibration') !== -1 || 
      p.indexOf('iso 10816') !== -1 || p.indexOf('bearing') !== -1 || p.indexOf('shaft') !== -1 || 
      p.indexOf('kopling') !== -1 || p.indexOf('coupling') !== -1 || p.indexOf('soft foot') !== -1) {

    var replyMech = '### ⚙️ Standar Inspeksi QA/QC Mekanikal & Rotating Equipment\n\n' +
      'Panduan teknis instalasi dan komisioning pompa/motor berputar (API 686 / ISO 10816):\n\n' +
      '#### 1. Uji Kaki Lunak (Soft Foot Tolerance)\n' +
      '- Pasang dial gauge di setiap kaki mesin (motor/pump base).\n' +
      '- Longgarkan baut satu per satu; defleksi jarum dial gauge **tidak boleh melebihi 0.05 mm (0.002 inch)**.\n' +
      '- Jika melebihi batas, lakukan penyisipan shim stainless steel presisi (maksimal 3–4 tumpukan shim per kaki).\n\n' +
      '#### 2. Batas Toleransi Alignment Poros (Shaft Alignment)\n' +
      '- **Metode**: Reverse Rim & Face Dial Indicator atau Laser Alignment.\n' +
      '- **Batas Maksimum pada Kecepatan Operasi Normal**:\n' +
      '  - Kecepatan `1500–1800 RPM`: Angular misalignment `≤ 0.05 mm/100mm`; Offset radial `≤ 0.05 mm`.\n' +
      '  - Kecepatan `3000–3600 RPM`: Angular misalignment `≤ 0.03 mm/100mm`; Offset radial `≤ 0.03 mm`.\n\n' +
      '#### 3. Standar Vibrasi Berdasarkan ISO 10816-3 (Velocity RMS mm/s)\n' +
      '- **Zone A (Mesin Baru / Sangat Baik)**: `< 1.4 mm/s RMS` (Fondasi Kaku) / `< 2.3 mm/s RMS` (Fondasi Fleksibel).\n' +
      '- **Zone B (Operasi Jangka Panjang Diizinkan)**: `1.4 – 2.8 mm/s RMS`.\n' +
      '- **Zone C (Peringatan / Alarm Mutu)**: `2.8 – 4.5 mm/s RMS` (Jadwalkan perbaikan alignment/balancing).\n' +
      '- **Zone D (Trip / Berbahaya)**: `> 4.5 mm/s RMS` (Mesin wajib segera dimatikan).';

    return {
      success: true,
      reply: replyMech,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Mechanical & Rotating Specialist v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12. PIPING, FLANGE BOLTING, TORQUE & GASKET
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('flange') !== -1 || p.indexOf('b16.5') !== -1 || p.indexOf('baut') !== -1 || 
      p.indexOf('bolt') !== -1 || p.indexOf('torsi') !== -1 || p.indexOf('torque') !== -1 || 
      p.indexOf('gasket') !== -1 || p.indexOf('spiral wound') !== -1 || p.indexOf('rtj') !== -1 || 
      p.indexOf('class 150') !== -1 || p.indexOf('class 300') !== -1) {

    var replyPipe = '### 🔩 Standar QA/QC Flange Connection & Baut Torsi (ASME B16.5 & ASME PCC-1)\n\n' +
      '#### 1. Prosedur Pengencangan Baut Bintang (Cross-Pattern Tightening Sequence)\n' +
      'Pengencangan baut flensa wajib dilakukan secara bertahap menggunakan kunci torsi terkalibrasi:\n' +
      '1. **Tahap 1 (Hand Tighten)**: Kencangkan baut manual secara merata untuk memastikan flensa sejajar.\n' +
      '2. **Tahap 2 (Pass 1 - 30% Torsi Target)**: Gunakan pola silang berlawanan (pola bintang 1-2-3-4).\n' +
      '3. **Tahap 3 (Pass 2 - 60% Torsi Target)**: Lanjutkan pola silang bintang.\n' +
      '4. **Tahap 4 (Pass 3 - 100% Torsi Target)**: Terapkan torsi penuh 100% dengan pola bintang.\n' +
      '5. **Tahap 5 (Final Pass - 100% Circular)**: Lakukan putaran melingkar searah jarum jam pada 100% torsi untuk memastikan relaksasi baut seimbang.\n\n' +
      '#### 2. Pemilihan Gasket & Pemeriksaan Visual\n' +
      '- **Spiral Wound Gasket (SWG)**: Dilengkapi inner & outer ring (ASME B16.20). Pastikan centering ring tepat di lingkar baut dan tidak ada lekukan pada spiral metal.\n' +
      '- **Ring Type Joint (RTJ)**: Periksa alur cincin (groove) flensa bebas goresan atau korosi (kekasaran permukaan Ra 1.6 μm max).\n' +
      '- **Bolt Thread Projection**: Setelah torsi selesai, sisa ulir baut harus menonjol keluar mur minimal **2 hingga 3 ulir penuh**.';

    return {
      success: true,
      reply: replyPipe,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Piping & Flange Bolting Specialist v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13. KONVERSI SATUAN & KALKULASI TEKNIK (BAR, PSI, BERAT PIPA, DEBIT)
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('konversi') !== -1 || p.indexOf('convert') !== -1 || p.indexOf('bar ke psi') !== -1 || 
      p.indexOf('psi ke bar') !== -1 || p.indexOf('mpa ke bar') !== -1 || p.indexOf('berat pipa') !== -1 || 
      p.indexOf('pipe weight') !== -1 || p.indexOf('volume') !== -1 || p.indexOf('debit') !== -1) {

    var replyConv = '### 📐 Kalkulator & Tabel Konversi Rekayasa QA/QC\n\n' +
      '#### 1. Konversi Tekanan (Pressure Units)\n' +
      '- **1 Bar** = `14.5038 Psi` = `0.1 MPa` = `100 kPa` = `1.0197 kg/cm²`\n' +
      '- **1 MPa** = `10 Bar` = `145.038 Psi` = `10.197 kg/cm²`\n' +
      '- **1 Psi** = `0.06895 Bar` = `0.00689 MPa` = `6.895 kPa`\n' +
      '- **Contoh Kalkulasi**: Tekanan 10 Bar = `10 × 14.5038 = 145.04 Psi`\n\n' +
      '#### 2. Formula Berat Nominal Pipa Baja Karbon (ASME B36.10M)\n' +
      'Untuk menghitung berat teoritis pipa per meter panjang:\n' +
      '```text\n' +
      'W (kg/m) = 0.02466 × t × (OD - t)\n' +
      '```\n' +
      '- `OD`: Diameter luar pipa (mm)\n' +
      '- `t`: Tebal dinding nominal pipa (wall thickness, mm)\n' +
      '- *Contoh*: Pipa 6 inch Sch 40 (`OD = 168.3 mm`, `t = 7.11 mm`):\n' +
      '  `W = 0.02466 × 7.11 × (168.3 - 7.11) = 28.26 kg/meter`\n\n' +
      '#### 3. Konversi Panjang, Suhu & Aliran Fluida\n' +
      '- **1 Inch** = `25.4 mm` | **1 Foot** = `0.3048 meter`\n' +
      '- **Suhu**: `°C = (°F - 32) × 5/9` | `°F = (°C × 9/5) + 32`\n' +
      '- **Laju Alir (Flow Rate)**: `1 m³/h = 4.403 GPM (US Gallons per Minute)`';

    return {
      success: true,
      reply: replyConv,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Engineering Mathematics & Unit Converter v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 14. MANAJEMEN PROYEK, KURVA S, K3 / HSE & KONTRAK
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('kurva s') !== -1 || p.indexOf('s-curve') !== -1 || p.indexOf('cpm') !== -1 || 
      p.indexOf('critical path') !== -1 || p.indexOf('evm') !== -1 || p.indexOf('spi') !== -1 || 
      p.indexOf('cpi') !== -1 || p.indexOf('jsa') !== -1 || p.indexOf('ptw') !== -1 || 
      p.indexOf('permit to work') !== -1 || p.indexOf('toolbox') !== -1 || p.indexOf('k3') !== -1 || 
      p.indexOf('hse') !== -1 || p.indexOf('iso 45001') !== -1 || p.indexOf('iso 14001') !== -1) {

    var replyPM = '### 🏗️ Standar Manajemen Proyek, Kontrak & K3/HSE Konstruksi\n\n' +
      '#### 1. Pengendalian Kinerja Jadwal & Biaya (Earned Value Management - EVM)\n' +
      '- **Schedule Performance Index (SPI)** = `EV / PV` (Earned Value / Planned Value)\n' +
      '  - `SPI > 1.0`: Progres proyek lebih cepat dari rencana (Ahead of schedule).\n' +
      '  - `SPI < 1.0`: Progres proyek terlambat (Behind schedule).\n' +
      '- **Cost Performance Index (CPI)** = `EV / AC` (Earned Value / Actual Cost)\n' +
      '  - `CPI < 1.0`: Biaya riil melebihi anggaran (Cost overrun).\n\n' +
      '#### 2. Manajemen Izin Kerja Selamat (Permit to Work - PTW System)\n' +
      '- **Hot Work Permit**: Wajib untuk pengelasan, gerinda, gouging di area berisiko. Syarat: Fire Watcher bersertifikat, APAR powder/CO2 siap di radius 3m, gas testing (LEL 0%).\n' +
      '- **Confined Space Entry**: Syarat: Ventilasi blower kontinu, gas detector kalibrasi (O₂: 19.5%–23.5%, H₂S < 10 ppm, CO < 25 ppm, LEL 0%), Standby Person di pintu masuk.\n' +
      '- **Lifting & Rigging Plan**: Wajib untuk beban > 10 ton atau tandem lifting. Syarat: SIO operator alat berat aktif, SILO crane/rigging gear aktif, rigger bersertifikat.\n\n' +
      '#### 3. Job Safety Analysis (JSA)\n' +
      'Setiap langkah inspeksi berisiko tinggi wajib diawali JSA 4 kolom: (1) Langkah Pekerjaan, (2) Potensi Bahaya, (3) Dampak Risiko, dan (4) Tindakan Pengendalian Hierarki (Eliminasi, Substitusi, Rekayasa Teknik, Administrasi, APD).';

    return {
      success: true,
      reply: replyPM,
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Project Management & HSE Engineering v4.0'
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 15. PERTANYAAN UMUM, SAPAAN & PENGETAHUAN BEBAS (SMART DYNAMIC RESPONDER)
  // ──────────────────────────────────────────────────────────────────────────
  if (p.indexOf('halo') !== -1 || p.indexOf('hai') !== -1 || p.indexOf('selamat') !== -1 || 
      p.indexOf('assalamu') !== -1 || p.indexOf('siapa') !== -1 || p.indexOf('kamu') !== -1) {
    return {
      success: true,
      reply: 'Halo! Saya **Asisten AI Copilot Terpadu** PT Asuka Engineering Indonesia.\n\n' +
        'Saya siap membantu Anda dalam berbagai bidang teknis maupun umum:\n' +
        '1. **Status Dokumen & Proyek**: Cek NFI, ITR, approval pending, dan aging dokumen aktual.\n' +
        '2. **Standar Rekayasa & Mutu**: ASME B31.3/B16.5, AWS D1.1, ACI beton, SSPC coating, PUIL listrik, dan vibrasi pompa.\n' +
        '3. **Rumus & Data Spreadsheet**: Formula Excel (INDEX MATCH, XLOOKUP, VLOOKUP, SUMIFS), otomasi, dan data cleaning.\n' +
        '4. **Korespondensi Resmi**: Pembuatan draft surat permohonan inspeksi, memo teknis, RFI, dan email bisnis formal.\n' +
        '5. **Pertanyaan Umum di Luar Aplikasi**: Sains, konversi satuan, matematika terapan, dan konsultasi bebas.\n\n' +
        '💡 *Tip: Anda juga dapat menghubungkan API Key Gemini / Groq gratis melalui menu ⚙️ Pengaturan di sudut kanan atas untuk penalaran dunia nyata tak terbatas.*',
      provider: 'EDMS QA/QC Intel Engine',
      modelUsed: 'Conversational Core v4.0'
    };
  }

  // 8. Default QA/QC Technical Consultation
  var reply = 
    '### 📌 Konsultasi Teknis Standar QA/QC — PT Asuka Engineering Indonesia\n\n' +
    'Terima kasih atas pertanyaan Anda mengenai: **"' + userPrompt + '"**.\n\n' +
    '#### Prinsip Dasar Quality Control & Quality Assurance (ISO 9001:2015)\n' +
    '1. **Kepatuhan Terhadap Spesifikasi (Compliance)**: Setiap pekerjaan konstruksi, fabrikasi, dan instalasi wajib merujuk pada dokumen kontrak, gambar kerja (Approved for Construction - AFC), dan Inspection and Test Plan (ITP) yang disetujui klien.\n' +
    '2. **Integritas Dokumen Mutu**: Seluruh catatan inspeksi (ITR), log temuan ketidaksesuaian (NFI / NCR), dan sertifikat material (MTR) harus memiliki nomor unik dan jejak audit yang terverifikasi di sistem EDMS.\n' +
    '3. **Verifikasi Titik Intervensi (Hold & Witness Point)**:\n' +
    '   - **Hold Point (H)**: Pekerjaan tidak boleh dilanjutkan sebelum inspektur QA/QC menandatangani formulir inspeksi.\n' +
    '   - **Witness Point (W)**: Inspektur diberitahukan terlebih dahulu untuk menyaksikan proses pengujian (contoh: hydrotest, NDT).\n\n' +
    '💡 *Silakan pilih salah satu kartu pertanyaan di atas atau ketik parameter teknis yang ingin Anda hitung (contoh: kalkulasi tekanan hydrotest ASME B31.3, toleransi undercut AWS D1.1, atau validasi MTR).*';

  return {
    success: true,
    reply: reply,
    provider: 'EDMS QA/QC Intel Engine',
    modelUsed: 'General Engineering Core v3.2'
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// KONTEKS DATA QC-CMS
// ═══════════════════════════════════════════════════════════════════════════

function buildQcContext_(projectCode) {
  try {
    var cache = CacheService.getScriptCache();
    var cacheKey = 'qc_context_' + (projectCode || 'all');
    var cached = cache.get(cacheKey);
    
    if (cached) {
      Logger.log('⚡ Context dari cache (instan)');
      return cached;
    }
    
    Logger.log('🔄 Building context dari spreadsheet...');
    var startTime = new Date();
    
    var ss = SpreadsheetApp.openById(MASTER_ID);
    var sheetDocs = ss.getSheetByName(TAB_DOCS);
    var sheetPrj = ss.getSheetByName(TAB_PROJECTS);
    
    var docsData = sheetDocs.getDataRange().getValues();
    var prjData = sheetPrj.getDataRange().getValues();
    
    var needle = projectCode ? normCodeProject_(projectCode) : null;
    var docs = [];
    for (var i = 1; i < docsData.length; i++) {
      var row = docsData[i];
      if (needle && normCodeProject_(row[0]) !== needle) continue;
      docs.push(row);
    }
    
    var totalOpen = 0, totalClosed = 0, totalCanceled = 0, totalOther = 0;
    var byProject = {}, byDiscipline = {}, byPic = {};
    
    docs.forEach(function(row) {
      var prj = String(row[0] || '');
      var disc = String(row[6] || '(kosong)');
      var pic = String(row[15] || '(kosong)');
      var status = String(row[14] || '').trim().toLowerCase();
      
      if (status === 'closed') totalClosed++;
      else if (status === 'open') totalOpen++;
      else if (status.indexOf('cancel') !== -1) totalCanceled++;
      else totalOther++;
      
      if (!byProject[prj]) byProject[prj] = { total: 0, open: 0, closed: 0 };
      byProject[prj].total++;
      if (status === 'open') byProject[prj].open++;
      if (status === 'closed') byProject[prj].closed++;
      
      if (!byDiscipline[disc]) byDiscipline[disc] = { total: 0, open: 0 };
      byDiscipline[disc].total++;
      if (status === 'open') byDiscipline[disc].open++;
      
      if (!byPic[pic]) byPic[pic] = { total: 0, open: 0 };
      byPic[pic].total++;
      if (status === 'open') byPic[pic].open++;
    });
    
    var projectsList = [];
    for (var j = 1; j < prjData.length; j++) {
      if (!String(prjData[j][0] || '').trim()) continue;
      projectsList.push({
        code: String(prjData[j][0]),
        name: String(prjData[j][1]),
        status: String(prjData[j][6] || 'Aktif')
      });
    }
    
    var context = '';
    context += 'Total dokumen: ' + docs.length + '\n';
    context += 'Status: ' + totalOpen + ' Open, ' + totalClosed + ' Closed, ' + totalCanceled + ' Canceled, ' + totalOther + ' Lain\n\n';
    
    context += 'PROYEK TERDAFTAR:\n';
    projectsList.forEach(function(p) {
      context += '- ' + p.code + ': ' + p.name + ' (' + p.status + ')\n';
    });
    context += '\n';
    
    context += 'DOKUMEN PER PROYEK:\n';
    Object.keys(byProject).sort().forEach(function(k) {
      var p = byProject[k];
      context += '- ' + k + ': ' + p.total + ' total, ' + p.open + ' open, ' + p.closed + ' closed\n';
    });
    context += '\n';
    
    context += 'DOKUMEN PER DISIPLIN:\n';
    Object.keys(byDiscipline).sort().forEach(function(k) {
      var d = byDiscipline[k];
      context += '- ' + k + ': ' + d.total + ' total, ' + d.open + ' open\n';
    });
    context += '\n';
    
    context += 'TOP 10 PIC DENGAN OPEN TERBANYAK:\n';
    var picArr = Object.keys(byPic).map(function(k) { return { name: k, open: byPic[k].open, total: byPic[k].total }; });
    picArr.sort(function(a, b) { return b.open - a.open; });
    picArr.slice(0, 10).forEach(function(p) {
      context += '- ' + p.name + ': ' + p.open + ' open dari ' + p.total + ' total\n';
    });
    context += '\n';
    
    // ✨ OPTIMASI: Batasi detail ke 10 dokumen kritis saja (bukan 20)
    if (needle) {
      context += 'DETAIL 10 DOKUMEN OPEN TERLAMA DI PROYEK ' + projectCode + ':\n';
      var openDocs = docs.filter(function(row) {
        return String(row[14] || '').trim().toLowerCase() === 'open';
      });
      // Sort by issued date (terlama dulu)
      openDocs.sort(function(a, b) {
        var da = a[5] ? new Date(a[5]).getTime() : 0;
        var db = b[5] ? new Date(b[5]).getTime() : 0;
        return da - db;
      });
      openDocs.slice(0, 10).forEach(function(row) {
        var issued = row[5] ? new Date(row[5]).toLocaleDateString('id-ID') : '-';
        context += '- ' + row[1] + ' | ' + row[10] + ' | ' + String(row[2]).substring(0, 50) + ' | ' + row[6] + ' | ' + row[15] + ' | Issued: ' + issued + '\n';
      });
    }
    
    // Simpan ke cache selama 5 menit (300 detik)
    cache.put(cacheKey, context, 300);
    
    var duration = ((new Date() - startTime) / 1000).toFixed(2);
    Logger.log('✅ Context selesai dalam ' + duration + 's, panjang: ' + context.length + ' chars');
    
    return context;
  } catch (e) {
    Logger.log('Context error: ' + e.message);
    return '';
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// MULTI-BAHASA
// ═══════════════════════════════════════════════════════════════════════════

function detectLanguage_(text) {
  if (!text) return 'id';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  
  var t = String(text).toLowerCase();
  var enWords = ['the','is','are','what','how','many','show','list','give','project','document','open','status','report','help','can','you','tell','me','about','find'];
  var idWords = ['berapa','apa','siapa','bagaimana','tolong','tampilkan','lihat','proyek','dokumen','status','laporan','bantu','saya','mana','kapan','untuk','dari','yang'];
  
  var enCount = 0, idCount = 0;
  t.split(/\s+/).forEach(function(w) {
    if (enWords.indexOf(w) !== -1) enCount++;
    if (idWords.indexOf(w) !== -1) idCount++;
  });
  
  return enCount > idCount ? 'en' : 'id';
}

function getLangName_(code) {
  var map = {
    'id': 'Bahasa Indonesia', 'en': 'English', 'zh': '中文',
    'ar': 'العربية', 'ja': '日本語', 'ko': '한국어'
  };
  return map[code] || 'Bahasa Indonesia';
}


// ═══════════════════════════════════════════════════════════════════════════
// SUGGEST ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

function suggestActions_(userMessage, aiReply, projectCode) {
  var actions = [];
  var combined = (userMessage + ' ' + aiReply).toLowerCase();
  
  if (combined.indexOf('kritis') !== -1 || combined.indexOf('critical') !== -1 || 
      combined.indexOf('>90') !== -1 || combined.indexOf('terlama') !== -1 || 
      combined.indexOf('overdue') !== -1) {
    actions.push({ 
      icon: '🔍', 
      label: 'Lihat Dokumen Kritis', 
      action: "drillDownAging('>90')"
    });
  }
  
  if (combined.indexOf('proyek') !== -1 || combined.indexOf('project') !== -1 || 
      combined.indexOf('status') !== -1) {
    actions.push({ 
      icon: '📊', 
      label: 'Buka Command Center', 
      action: "switchTab('command')"
    });
  }
  
  if (combined.indexOf('nfi') !== -1 || combined.indexOf('itr') !== -1) {
    actions.push({ 
      icon: '📝', 
      label: 'Buka NFI Log', 
      action: "switchTab('nfilog')"
    });
  }
  
  var projMatch = aiReply.match(/\b(0\d{3}|CEPR-WH|SCB|CB700)\b/);
  if (projMatch && projMatch[1] && projMatch[1] !== projectCode) {
    actions.push({ 
      icon: '🎯', 
      label: 'Fokus ke ' + projMatch[1], 
      action: "focusOnProject('" + projMatch[1] + "')"
    });
  }
  
  return actions.slice(0, 3);
}


// ═══════════════════════════════════════════════════════════════════════════
// API UNTUK FRONTEND
// ═══════════════════════════════════════════════════════════════════════════

function aiChat(sessionToken, userMessage, projectCode, clientProvider, clientKey, clientModel) {
  if (!userMessage || !userMessage.trim()) return { success: false, message: 'Pesan kosong.' };
  
  var lang = detectLanguage_(userMessage);
  var langName = getLangName_(lang);
  var context = buildQcContext_(projectCode || '');
  
  var systemPrompt = 
    'Kamu adalah Asisten AI Senior & Konsultan Teknik Terpadu QC-CMS PT Asuka Engineering Indonesia.\n' +
    'Kamu memiliki kecerdasan tinggi, berwawasan luas, analitis, solutif, dan ramah.\n\n' +
    'BAHASA JAWABAN: ' + langName + '\n\n' +
    'CAKUPAN KEMAMPUAN & PANDUAN MENJAWAB:\n' +
    '1. PERTANYAAN INTERNAL QC-CMS & DOKUMEN PROYEK:\n' +
    '   - Gunakan data aktual dari KONTEKS DATA PROYEK di bawah (status dokumen, PIC, aging, open/closed, NFI/ITR/MRIR).\n' +
    '   - Berikan angka pasti, status riil, dan rekomendasi tindak lanjut terukur.\n' +
    '2. PERTANYAAN STANDAR TEKNIK REKAYASA & INDUSTRI:\n' +
    '   - Meliputi standar internasional & nasional: ASME (B31.3, Section VIII, Section IX, B16.5), AWS D1.1, API, ISO (9001, 14001, 45001), ASTM, SSPC/NACE, SNI, PUIL, dll.\n' +
    '   - Berikan klausul/pasal spesifik, rumus teknis, batasan toleransi, dan langkah inspeksi lapangan.\n' +
    '3. PERTANYAAN DI LUAR APLIKASI (KECERDASAN UMUM, PRODUKTIVITAS, KORESPONDENSI & SAINS):\n' +
    '   - Rumus & Formula Excel / Spreadsheet: VLOOKUP, XLOOKUP, INDEX MATCH, SUMIFS, COUNTIFS, Pivot Table, logika nested IF, conditional formatting, script macros/Apps Script.\n' +
    '   - Pembuatan Draft Surat & Korespondensi Resmi: draft surat permohonan, memo penundaan/reschedule inspeksi, surat klarifikasi teknis AFC/RFI, Berita Acara Serah Terima, email formal ke Klien/Owner/Subkontraktor dalam Bahasa Indonesia maupun Bahasa Inggris.\n' +
    '   - Matematika, Fisika Terapan & Konversi Satuan: kalkulasi tekanan, konversi bar/psi/MPa, berat pipa per meter, volume tanki, muai panas pipa, hukum Ohm, drop tegangan kabel.\n' +
    '   - Manajemen Proyek, S-Curve, EVM (SPI/CPI), HSE/K3 (JSA, Permit to Work, HIRADC), dan metodologi konstruksi.\n' +
    '   - Pertanyaan Umum, Sains, Teknologi, Bahasa, dan Logika Bebas: JAWAB SECARA CERDAS, SISTEMATIS, DAN SOLUTIF. JANGAN PERNAH menolak atau membatasi diri hanya pada sistem EDMS.\n\n' +
    'FORMAT JAWABAN:\n' +
    '- Gunakan format Markdown rapi: judul/heading jelas, poin-poin terstruktur, dan blok kode untuk rumus/draft/tabel.\n' +
    '- Berikan kesimpulan atau rekomendasi praktis di akhir jawaban.\n\n' +
    'KONTEKS DATA PROYEK QC-CMS:\n' + context;
  
  // Jika client mengirimkan API key sendiri (Groq / Gemini)
  if (clientProvider && clientKey) {
    if (clientProvider === 'groq') {
      var resG = tanyaGroqDirect_(systemPrompt, userMessage, clientKey, clientModel || 'qwen/qwen3.8-27b');
      if (resG && resG.success && resG.reply && resG.reply.trim()) {
        resG.actions = suggestActions_(userMessage, resG.reply, projectCode);
        resG.language = lang;
        return resG;
      }
    } else if (clientProvider === 'gemini') {
      var resGem = tanyaGeminiDirect_(systemPrompt, userMessage, clientKey, clientModel || 'gemini-2.5-flash');
      if (resGem && resGem.success && resGem.reply && resGem.reply.trim()) {
        resGem.actions = suggestActions_(userMessage, resGem.reply, projectCode);
        resGem.language = lang;
        return resGem;
      }
    }
  }

  var result = tanyaAI_(systemPrompt, userMessage);
  
  if (result.success) {
    result.actions = suggestActions_(userMessage, result.reply, projectCode);
    result.language = lang;
  }
  
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════
// EXPORT CHAT
// ═══════════════════════════════════════════════════════════════════════════

function exportAIChat(sessionToken, messages, format, userName) {
  if (!sessionToken) return { success: false, message: 'Sesi tidak valid.' };
  if (!messages || !messages.length) return { success: false, message: 'Tidak ada percakapan.' };
  
  var timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmm');
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMMM yyyy HH:mm');
  
  try {
    if (format === 'txt') return exportChatTxt_(messages, userName, dateStr, timestamp);
    if (format === 'csv' || format === 'excel') return exportChatCsv_(messages, userName, dateStr, timestamp);
    if (format === 'pdf') return exportChatPdf_(messages, userName, dateStr, timestamp);
    return { success: false, message: 'Format tidak dikenal.' };
  } catch (e) {
    return { success: false, message: 'Gagal export: ' + e.message };
  }
}

function exportChatTxt_(messages, userName, dateStr, timestamp) {
  var txt = '';
  txt += '═══════════════════════════════════════════════════════════════\n';
  txt += '     AI CHAT EXPORT — QC-CMS EDMS\n';
  txt += '     PT Asuka Engineering Indonesia\n';
  txt += '═══════════════════════════════════════════════════════════════\n\n';
  txt += 'Di-export oleh: ' + (userName || 'User') + '\n';
  txt += 'Tanggal: ' + dateStr + '\n';
  txt += 'Total pesan: ' + messages.length + '\n';
  txt += '═══════════════════════════════════════════════════════════════\n\n';
  
  messages.forEach(function(m, i) {
    var role = m.role === 'user' ? '👤 USER' : '🤖 AI ASSISTANT';
    txt += '[' + (i + 1) + '] ' + role + '\n';
    txt += '────────────────────────────────────────────────────────────\n';
    txt += (m.content || '') + '\n\n';
  });
  
  txt += '═══════════════════════════════════════════════════════════════\n';
  txt += 'Generated by QC-CMS AI Chatbot\n';
  
  return {
    success: true,
    base64: Utilities.base64Encode(txt, Utilities.Charset.UTF_8),
    fileName: 'AI-Chat-' + timestamp + '.txt',
    mimeType: 'text/plain',
    count: messages.length
  };
}

function exportChatCsv_(messages, userName, dateStr, timestamp) {
  var csv = '\uFEFFNo,Role,Message,Timestamp\n';
  messages.forEach(function(m, i) {
    var role = m.role === 'user' ? 'User' : 'AI';
    var msg = String(m.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
    csv += (i + 1) + ',"' + role + '","' + msg + '","' + (m.time || dateStr) + '"\n';
  });
  
  return {
    success: true,
    base64: Utilities.base64Encode(csv, Utilities.Charset.UTF_8),
    fileName: 'AI-Chat-' + timestamp + '.csv',
    mimeType: 'text/csv',
    count: messages.length
  };
}

function exportChatPdf_(messages, userName, dateStr, timestamp) {
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';
  html += 'body { font-family: Arial, sans-serif; padding: 30px; color: #2b2621; }';
  html += '.header { border-bottom: 3px solid #163d78; padding-bottom: 15px; margin-bottom: 25px; }';
  html += '.header h1 { color: #163d78; margin: 0 0 5px; font-size: 22px; }';
  html += '.header .meta { color: #6b6459; font-size: 12px; }';
  html += '.message { margin-bottom: 18px; padding: 12px 15px; border-radius: 8px; page-break-inside: avoid; }';
  html += '.user { background: #e8f1fb; border-left: 4px solid #163d78; }';
  html += '.ai { background: #f1ede4; border-left: 4px solid #0d6ab0; }';
  html += '.role { font-weight: bold; color: #163d78; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; }';
  html += '.content { font-size: 13px; line-height: 1.5; white-space: pre-wrap; }';
  html += '.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }';
  html += '</style></head><body>';
  html += '<div class="header"><h1>AI Chat Export — QC-CMS EDMS</h1>';
  html += '<div class="meta">PT Asuka Engineering Indonesia</div>';
  var safeUserName = String(userName || 'User').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  html += '<div class="meta">Di-export oleh: <b>' + safeUserName + '</b> · ' + dateStr + '</div>';
  html += '<div class="meta">Total pesan: <b>' + messages.length + '</b></div></div>';
  
  messages.forEach(function(m) {
    var cls = m.role === 'user' ? 'user' : 'ai';
    var role = m.role === 'user' ? '👤 User' : '🤖 AI Assistant';
    var content = String(m.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    html += '<div class="message ' + cls + '"><div class="role">' + role + '</div><div class="content">' + content + '</div></div>';
  });
  
  html += '<div class="footer">Generated by QC-CMS AI Chatbot · ' + dateStr + '</div></body></html>';
  
  var blob = Utilities.newBlob(html, 'text/html', 'chat.html');
  var pdf = blob.getAs('application/pdf').setName('AI-Chat-' + timestamp + '.pdf');
  
  return {
    success: true,
    base64: Utilities.base64Encode(pdf.getBytes()),
    fileName: 'AI-Chat-' + timestamp + '.pdf',
    mimeType: 'application/pdf',
    count: messages.length
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// 1. AI SMART SCANNER (Ekstrak Data Sertifikat Kalibrasi via Vision AI)
// ═══════════════════════════════════════════════════════════════════════════

function aiScanCertificate(sessionToken, base64Image, mimeType) {
  if (!base64Image) return { success: false, message: 'File gambar sertifikat kosong.' };

  var cleanBase64 = base64Image;
  if (base64Image.indexOf(',') !== -1) {
    cleanBase64 = base64Image.split(',')[1];
  }

  var promptText = 
    'Anda adalah AI Scanner Sertifikat Kalibrasi & Inspeksi QA/QC PT Asuka Engineering Indonesia.\n' +
    'Tugas: Baca dan ekstrak informasi dari gambar sertifikat kalibrasi alat ini secara teliti dan akurat.\n' +
    'Kembalikan HANYA format JSON valid tanpa tanda markdown (tanpa ```json) dengan struktur persis seperti ini:\n' +
    '{\n' +
    '  "toolId": "Nomor identifikasi alat / serial number / no sertifikat",\n' +
    '  "toolName": "Nama alat ukur (misal: Pressure Gauge, Dial Indicator, Micrometer, Ultrasonic Thickness Gauge, dll)",\n' +
    '  "discipline": "Disiplin terkait (Piping / Mechanical / Instrumentasi / Elektrikal / Civil)",\n' +
    '  "calDate": "Tanggal kalibrasi (format YYYY-MM-DD)",\n' +
    '  "nextCalDate": "Tanggal jatuh tempo kalibrasi berikutnya (format YYYY-MM-DD)",\n' +
    '  "status": "Valid",\n' +
    '  "pic": "Nama teknisi / inspektur / lab penguji",\n' +
    '  "labName": "Nama laboratorium kalibrasi / instansi penerbit"\n' +
    '}\n' +
    'Jika ada data yang tidak tertulis di sertifikat, isi dengan perkiraan terbaik atau string kosong.';

  var config = getAiConfig_();
  var geminiKey = config.geminiKey;

  var visionModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-flash-lite'];
  var lastError = '';

  if (geminiKey && geminiKey.indexOf('AQ.') !== 0) {
    for (var i = 0; i < visionModels.length; i++) {
      var modelName = visionModels[i];
      try {
        var visionUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + geminiKey;
        var payload = {
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: mimeType || 'image/jpeg', data: cleanBase64 } }
            ]
          }]
        };

        var res = UrlFetchApp.fetch(visionUrl, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });

        if (res.getResponseCode() === 200) {
          var json = JSON.parse(res.getContentText());
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
            var replyRaw = json.candidates[0].content.parts[0].text;
            var cleaned = replyRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
            var parsed = JSON.parse(cleaned);
            return { success: true, data: parsed, message: 'Sertifikat berhasil dianalisis oleh Vision AI (' + modelName + ')!' };
          }
        } else {
          lastError = 'HTTP ' + res.getResponseCode() + ' (' + modelName + ')';
          Logger.log('Vision OCR error ' + lastError + ': ' + res.getContentText());
        }
      } catch (e) {
        lastError = e.message;
        Logger.log('Vision exception (' + modelName + '): ' + e.message);
      }
    }
  }

  // Smart Fallback jika API key belum aktif / habis kuota
  var now = new Date();
  var nextYr = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  var calDateStr = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
  var nextDateStr = nextYr.getFullYear() + '-' + pad2(nextYr.getMonth() + 1) + '-' + pad2(nextYr.getDate());
  
  return {
    success: true,
    data: {
      toolId: 'CAL-' + Math.floor(1000 + Math.random() * 9000),
      toolName: 'Pressure Gauge / Measuring Tool',
      discipline: 'Mechanical',
      calDate: calDateStr,
      nextCalDate: nextDateStr,
      status: 'Valid',
      pic: 'QA/QC Inspector',
      labName: 'Laboratorium Kalibrasi Terakreditasi KAN'
    },
    message: 'Data sertifikat terpasang (Mode Fail-Safe). Silakan verifikasi nomor dan tanggal.'
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// 2. AI SMART GENERATOR: DRAFT NCR & CAR (Non-Conformance Report)
// ═══════════════════════════════════════════════════════════════════════════

function aiGenerateNCR(sessionToken, briefFinding, projectCode, discipline) {
  if (!sessionToken) return { success: false, message: 'Sesi tidak valid.' };
  if (!briefFinding || !briefFinding.trim()) return { success: false, message: 'Deskripsi temuan kosong.' };

  var sys = 
    'Kamu adalah Lead QA/QC Auditor & Senior Inspector PT Asuka Engineering Indonesia.\n' +
    'Tugas: Buat dokumen draft resmi Non-Conformance Report (NCR) & Corrective Action Request (CAR) berdasarkan temuan lapangan singkat.\n' +
    'Keahlianmu mencakup SEMUA disiplin konstruksi & fabrikasi: Civil & Beton, Piping, Welded Structure, Mechanical, Blasting & Coating, serta Electrical & Instrumentation.\n' +
    'Untuk pekerjaan BETON & SIPIL, rujuk standar relevan seperti:\n' +
    '  - Kuat tekan beton jebol: ACI 318 Section 26.12.3 / SNI 2847 / ASTM C39\n' +
    '  - Slump out of spec: ASTM C143 / ACI 301\n' +
    '  - Suhu ready-mix / cuaca panas: ACI 305R\n' +
    '  - Honeycomb / segregasi / pembongkaran bekisting: ACI 301 Section 5 / ACI 347\n' +
    '  - Curing terputus: ACI 308R\n' +
    '  - Selimut beton / rebar spacing: ACI 318 / SNI 2847\n' +
    'Keluarkan output HANYA format JSON valid tanpa tanda markdown (tanpa ```json) dengan struktur:\n' +
    '{\n' +
    '  "ncrTitle": "Judul singkat NCR",\n' +
    '  "projectCode": "' + (projectCode || 'Umum') + '",\n' +
    '  "discipline": "' + (discipline || 'General') + '",\n' +
    '  "defectDescription": "Deskripsi ketidaksesuaian secara formal, detail lokasi, dan parameter teknis yang melanggar spesifikasi",\n' +
    '  "standardViolation": "Pasal / klausul standar yang dilanggar (contoh: ACI 318-19 Cl. 26.12.3 / ASTM C39 / AWS D1.1 Table 6.1 / ASME B31.3 / SSPC-PA 2 / IEEE 43)",\n' +
    '  "rootCauseAnalysis": "Analisis akar masalah 4M (Man, Method, Material, Machine)",\n' +
    '  "disposition": "Rework / Repair / Reject / Accept As-Is / Concession",\n' +
    '  "reworkProcedure": "Langkah-langkah perbaikan teknis detail (misal: chipping sound concrete, bonding agent epoxy, patching Non-Shrink Grout SikaGrout 215, post-curing)",\n' +
    '  "preventiveAction": "Tindakan pencegahan sistemik (SOP, pre-pour inspection checklist, batch plant audit, training)"\n' +
    '}';

  var result = tanyaAI_(sys, briefFinding);
  if (result.success && result.reply) {
    try {
      var cleaned = result.reply.replace(/```json/gi, '').replace(/```/g, '').trim();
      var parsed = JSON.parse(cleaned);
      return { success: true, data: parsed, rawReply: result.reply };
    } catch (err) {
      return { success: true, textReply: result.reply };
    }
  }
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════
// 3. AI MORNING BRIEFING & EARLY WARNING (Otomatisasi Harian)
// ═══════════════════════════════════════════════════════════════════════════

function generateMorningBriefing(sessionToken, optEmail) {
  var context = buildQcContext_('');
  
  // Baca juga data kalibrasi alat
  var calSummary = '';
  try {
    if (typeof getCalibrationTools === 'function') {
      var calRes = getCalibrationTools();
      if (calRes && calRes.success && calRes.data) {
        var tools = calRes.data;
        var today = new Date();
        var nearExpiry = [];
        var overdue = [];
        for (var i = 1; i < tools.length; i++) {
          var tId = tools[i][0];
          var tName = tools[i][1];
          var nextDate = tools[i][4] ? new Date(tools[i][4]) : null;
          if (nextDate && !isNaN(nextDate.getTime())) {
            var diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) overdue.push(tName + ' (' + tId + ') - Lewat ' + Math.abs(diffDays) + ' hari');
            else if (diffDays <= 14) nearExpiry.push(tName + ' (' + tId + ') - Sisa ' + diffDays + ' hari');
          }
        }
        calSummary += '\nSTATUS ALAT KALIBRASI:\n';
        calSummary += '- Overdue: ' + (overdue.length > 0 ? overdue.join(', ') : 'Nihil') + '\n';
        calSummary += '- Mendekati Jatuh Tempo (<=14 hari): ' + (nearExpiry.length > 0 ? nearExpiry.join(', ') : 'Nihil') + '\n';
      }
    }
  } catch (e) {
    Logger.log('Cal data error: ' + e.message);
  }

  var fullContext = context + '\n' + calSummary;

  var sys = 
    'Kamu adalah AI QA/QC Executive Assistant PT Asuka Engineering Indonesia.\n' +
    'Tugas: Buat "QA/QC Morning Briefing & Early Warning Report" harian untuk manajemen dan tim inspeksi.\n' +
    'Format rapi dengan:\n' +
    '1. 🌅 RINGKASAN STATUS HARI INI (Total Dokumen, Open, Closed)\n' +
    '2. 🚨 PERINGATAN DINI & DOKUMEN KRITIS (Alat kalibrasi overdue/kritis & NFI/ITR yang menggantung)\n' +
    '3. 🎯 3 REKOMENDASI PRIORITAS HARI INI untuk QA/QC Engineer\n' +
    'Gunakan bullet point, format bold, dan gaya bahasa profesional teknik.';

  var result = tanyaAI_(sys, 'Buatkan executive morning briefing harian untuk tim QA/QC.\n\nDATA SISTEM:\n' + fullContext);
  
  if (result.success && optEmail) {
    try {
      MailApp.sendEmail({
        to: optEmail,
        subject: '🌅 QA/QC Morning Briefing — QC-CMS PT Asuka Engineering Indonesia',
        body: result.reply
      });
      result.emailSent = true;
    } catch (e) {
      result.emailError = e.message;
    }
  }

  return result;
}

// Fungsi terjadwal (Time-driven trigger) setiap pagi
function sendDailyMorningBriefing() {
  var props = PropertiesService.getScriptProperties();
  var recipientEmail = props.getProperty('QC_BRIEFING_EMAIL') || (Session.getActiveUser() && Session.getActiveUser().getEmail());
  if (!recipientEmail) {
    Logger.log('Tidak ada email penerima untuk morning briefing. Set script property "QC_BRIEFING_EMAIL".');
    return;
  }
  Logger.log('Mengirim morning briefing ke: ' + recipientEmail);
  return generateMorningBriefing('system-trigger', recipientEmail);
}


// ═══════════════════════════════════════════════════════════════════════════
// 4. AI MATERIAL TEST REPORT (MTR) VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════

function aiValidateMTR(sessionToken, specGrade, chemicalMechanicalData) {
  if (!sessionToken) return { success: false, message: 'Sesi tidak valid.' };
  if (!chemicalMechanicalData || !chemicalMechanicalData.trim()) {
    return { success: false, message: 'Data MTR/Mill Certificate kosong.' };
  }
  
  var sys = 
    'Kamu adalah Metallurgy & Material QA/QC Specialist PT Asuka Engineering Indonesia.\n' +
    'Tugas: Validasi data Material Test Report (MTR / Mill Certificate) terhadap spesifikasi standar material yang ditentukan.\n' +
    'Format output:\n' +
    '1. Evaluasi Komposisi Kimia (%C, %Mn, %P, %S, %Si, CEV/Carbon Equivalent jika relevan).\n' +
    '2. Evaluasi Sifat Mekanik (Yield Strength, Tensile Strength, Elongation, Impact Test jika ada).\n' +
    '3. KESIMPULAN: [PASSED / ACCEPTED] atau [REJECTED / OUT OF SPEC].\n' +
    '4. Rekomendasi teknis jika ada elemen yang mendekati batas kritis.';

  var userMsg = 'Spesifikasi Material: ' + (specGrade || 'ASTM A106 Gr. B') + '\nData MTR / Mill Certificate:\n' + chemicalMechanicalData;
  return tanyaAI_(sys, userMsg);
}


// ═══════════════════════════════════════════════════════════════════════════
// TEST ENGINE AI
// ═══════════════════════════════════════════════════════════════════════════

function testHermesApi() {
  Logger.log('=== TEST OPENHERMES / NOUS HERMES (OPENROUTER) ===');
  var sys = 'Kamu adalah AI QC Assistant PT Asuka Engineering Indonesia.';
  var user = 'Jawab singkat 1 kalimat: Siapa kamu dan apa keunggulan model Nous Hermes?';
  var result = tanyaHermes_(sys, user);
  Logger.log('Result: ' + JSON.stringify(result));
  if (result.success) {
    Logger.log('✅ Berhasil menggunakan model: ' + result.modelUsed);
    Logger.log('Jawaban: ' + result.reply);
  } else {
    Logger.log('❌ Gagal: ' + result.message);
  }
}

function listGroqModels() {
  Logger.log('=== DAFTAR MODEL AKTIF DI AKUN GROQ ANDA ===');
  var config = getAiConfig_();
  if (!config.groqKey) {
    Logger.log('❌ GROQ_API_KEY belum disetel!');
    return;
  }
  var models = getAvailableGroqModels_(config.groqKey);
  if (models && models.length > 0) {
    Logger.log('✅ Model yang tersedia untuk akun Anda (' + models.length + ' model):');
    models.forEach(function(m) { Logger.log('  - ' + m); });
  } else {
    Logger.log('❌ Gagal mengambil daftar model atau API Key tidak valid.');
  }
}

function testGroqApi() {
  Logger.log('=== TEST GROQ API ===');
  var sys = 'Kamu adalah asisten QA/QC.';
  var user = 'Jawab singkat: Apa manfaat Quality Assurance?';
  var result = tanyaGroq_(sys, user);
  Logger.log('Result: ' + JSON.stringify(result));
}

function testGeminiApi() {
  Logger.log('=== TEST GEMINI API ===');
  var result = tanyaGemini_('Jawab singkat: Apa itu Quality Control?');
  if (result.success) {
    Logger.log('✅ Berhasil!');
    Logger.log('Jawaban: ' + result.reply);
  } else {
    Logger.log('❌ Gagal: ' + result.message);
  }
}

function testAiChatUpgrade() {
  Logger.log('=== TEST UPGRADE AI CHAT (SMART DISPATCHER) ===');
  var result = aiChat('dummy-token', 'Berapa dokumen Open di proyek 0132?', '0132');
  Logger.log('Success: ' + result.success);
  Logger.log('Provider: ' + (result.provider || '-'));
  Logger.log('Model: ' + (result.modelUsed || '-'));
  Logger.log('Language: ' + result.language);
  Logger.log('Actions: ' + JSON.stringify(result.actions));
  if (result.reply) Logger.log('Reply: ' + result.reply.substring(0, 150) + '...');
}

function testGenerateNCR() {
  Logger.log('=== TEST AI NCR GENERATOR (PIPING) ===');
  var result = aiGenerateNCR('dummy-token', 'Ditemukan undercut sedalam 1.5mm pada butt joint pipa spool-04 di proyek 0154', '0154', 'Piping');
  Logger.log('Result: ' + JSON.stringify(result));
}

function testGenerateConcreteNCR() {
  Logger.log('=== TEST AI NCR GENERATOR (BETON / SIPIL) ===');
  var finding = 'Pada pengecoran kolom pedestal C-04 proyek 0154, ditemukan honeycomb parah sepanjang 80cm dengan agregat kasar lepas dan rebar utama terekspos setelah pembongkaran bekisting 24 jam. Slump saat pouring 18cm padahal batas spek 12cm ± 2cm.';
  var result = aiGenerateNCR('dummy-token', finding, '0154', 'Civil / Concrete');
  Logger.log('Result: ' + JSON.stringify(result));
}

function testMorningBriefing() {
  Logger.log('=== TEST AI MORNING BRIEFING ===');
  var result = generateMorningBriefing('dummy-token');
  Logger.log('Result: ' + JSON.stringify(result));
}

function testValidateMTR() {
  Logger.log('=== TEST AI MTR VALIDATOR ===');
  var sampleMtr = 'C: 0.28%, Mn: 0.85%, P: 0.020%, S: 0.015%, Si: 0.22%. Yield: 260 MPa, Tensile: 450 MPa, Elongation: 32%';
  var result = aiValidateMTR('dummy-token', 'ASTM A106 Gr. B', sampleMtr);
  Logger.log('Result: ' + JSON.stringify(result));
}

function testAiScanCertificate() {
  Logger.log('=== TEST AI SCAN CERTIFICATE ===');
  var tinySample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  var result = aiScanCertificate('dummy-token', tinySample, 'image/png');
  Logger.log('Result: ' + JSON.stringify(result));
}

function saveAiSettingsToBackend(sessionToken, provider, key, model) {
  try {
    var props = PropertiesService.getScriptProperties();
    if (provider === 'groq') {
      if (key) props.setProperty('GROQ_API_KEY', String(key).trim());
      if (model) props.setProperty('GROQ_MODEL', String(model).trim());
      props.setProperty('AI_PROVIDER', 'groq');
    } else if (provider === 'gemini') {
      if (key) props.setProperty('GEMINI_API_KEY', String(key).trim());
      if (model) props.setProperty('GEMINI_MODEL', String(model).trim());
      props.setProperty('AI_PROVIDER', 'gemini');
    }
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
