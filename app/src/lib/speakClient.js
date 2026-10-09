// Browser side of a Speak call: microphone + WebRTC to OpenAI (GPT-Live or
// the Realtime API, whichever the server opened). The server opens the call
// (POST /api/speak/session) so the API key and the character's instructions
// stay server-side; this file only moves audio and listens to the data
// channel for captions, tool calls and speaking state.

// GPT-Live sends transcript fragments without turn boundaries, so a pause in
// the fragments ends a line.
const LINE_GAP_MS = 900;
const YOU_GAP_MS = 1200;

const waitForIce = (pc) => new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const done = () => { if (pc.iceGatheringState === 'complete') resolve(); };
    pc.addEventListener('icegatheringstatechange', done);
    setTimeout(resolve, 2500);
});

export class SpeakCall {
    constructor(handlers = {}) {
        this.h = handlers;
        this.pc = null;
        this.dc = null;
        this.mic = null;
        this.audio = null;
        this.sessionId = null;
        this.usage = { inputAudio: 0, inputCachedAudio: 0, inputText: 0, outputAudio: 0, outputText: 0 };
        this.lines = new Map(); // response id -> transcript so far
        this.ended = false;
        this.engine = 'realtime';
        this.live = { line: '', lineId: null, lineTimer: null, you: '', youTimer: null, n: 0 };
    }

    emit(name, ...args) {
        try { this.h[name]?.(...args); } catch (e) { console.error(e); }
    }

    // Microphone loudness 0..1 for the level ring around the mic button.
    level() {
        if (!this.analyser || this.muted) return 0;
        this.analyser.getByteTimeDomainData(this.levelBuf);
        let sum = 0;
        for (let i = 0; i < this.levelBuf.length; i += 1) { const v = (this.levelBuf[i] - 128) / 128; sum += v * v; }
        return Math.min(1, Math.sqrt(sum / this.levelBuf.length) * 4);
    }

    async start({ scenarioId, level, assist, language, nativeLanguage }) {
        this.mic = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new Ctx();
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 512;
            this.ctx.createMediaStreamSource(this.mic).connect(this.analyser);
            this.levelBuf = new Uint8Array(this.analyser.fftSize);
        } catch { /* the level meter is optional */ }
        const pc = new RTCPeerConnection();
        this.pc = pc;
        this.audio = new Audio();
        this.audio.autoplay = true;
        pc.ontrack = (e) => {
            this.audio.srcObject = e.streams[0];
            this.audio.play?.().catch(() => {});
            // Lets the call wait for the character to finish talking before hanging up.
            try {
                this.outAnalyser = this.ctx.createAnalyser();
                this.outAnalyser.fftSize = 512;
                this.ctx.createMediaStreamSource(e.streams[0]).connect(this.outAnalyser);
            } catch { this.outAnalyser = null; }
        };
        pc.addTrack(this.mic.getAudioTracks()[0], this.mic);
        pc.onconnectionstatechange = () => {
            if (['failed', 'disconnected', 'closed'].includes(pc.connectionState) && !this.ended) {
                this.emit('onDrop', pc.connectionState);
            }
        };

        this.dc = pc.createDataChannel('oai-events');
        this.dc.onmessage = (e) => {
            try { this.onEvent(JSON.parse(e.data)); } catch (err) { console.error(err); }
        };
        this.dc.onopen = () => {
            // In case session.started came before the channel opened.
            this.live.openTimer = setTimeout(() => { if (this.engine === 'live' && !this.live.started) this.kickoff(); }, 3000);
            this.emit('onOpen');
        };

        await pc.setLocalDescription(await pc.createOffer());
        await waitForIce(pc);

        const res = await fetch('/api/speak/session', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenarioId, level, assist, language, nativeLanguage, sdp: pc.localDescription.sdp }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
            this.stopLocal();
            const err = new Error(data.error || 'Could not start the call');
            err.reachedLimit = !!data.reachedLimit;
            err.allowance = data.allowance;
            throw err;
        }
        this.sessionId = data.sessionId;
        this.engine = data.engine || 'realtime';
        await pc.setRemoteDescription({ type: 'answer', sdp: data.answer });
        return data;
    }

    send(event) {
        if (this.dc?.readyState === 'open') this.dc.send(JSON.stringify(event));
    }

    // A note to the character that the learner didn't say out loud (button presses).
    // `speak` false changes how they behave without asking for a reply.
    nudge(text, { speak = true } = {}) {
        if (this.engine === 'live') {
            this.send({ type: speak ? 'session.commentary.append' : 'session.instructions.append', content: text.slice(0, 1800), delegation_id: null });
            return;
        }
        this.send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } });
        if (speak) this.send({ type: 'response.create' });
    }

    setMuted(muted) {
        this.muted = muted;
        this.mic?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
        if (this.engine === 'live') this.send({ type: muted ? 'session.input_audio.mute' : 'session.input_audio.unmute' });
    }

    // The server seeds the call with a "just connected" turn so the character
    // opens the scene. If they still haven't spoken a few seconds after
    // session.started (commands before it are ignored), nudge them, twice at most.
    kickoff() {
        const L = this.live;
        if (L.started) return;
        L.started = true;
        const go = '(The call just connected. Start the scene now with your opening line.)';
        const quiet = () => !L.n && !L.line && !this.ended;
        L.kickTimer = setTimeout(() => {
            if (!quiet()) return;
            this.nudge(go);
            L.kickTimer = setTimeout(() => { if (quiet()) this.nudge(go); }, 5000);
        }, 3000);
    }

    onLiveEvent(ev) {
        const L = this.live;
        switch (ev.type) {
            case 'session.started':
                this.kickoff();
                break;
            case 'session.output_transcript.delta': {
                if (!L.lineId) {
                    L.n += 1;
                    L.lineId = `l${L.n}`;
                    L.line = '';
                    this.emit('onSpeaking', true);
                }
                L.line += ev.delta || '';
                this.emit('onHorangText', { id: L.lineId, text: L.line.trim(), done: false });
                clearTimeout(L.lineTimer);
                L.lineTimer = setTimeout(() => this.endLiveLine(), LINE_GAP_MS);
                break;
            }
            case 'session.input_transcript.delta': {
                if (!L.youTimer) { L.you = ''; this.emit('onListening', true); }
                L.you += ev.delta || '';
                clearTimeout(L.youTimer);
                L.youTimer = setTimeout(() => {
                    L.youTimer = null;
                    this.emit('onListening', false);
                    if (L.you.trim()) this.emit('onYouText', { id: `u${L.n}`, text: L.you.trim() });
                }, YOU_GAP_MS);
                break;
            }
            case 'session.delegation.created':
                // No tools on this side: let the character carry on by itself.
                this.send({ type: 'session.thinking.append', delegation_id: ev.delegation?.id || null, content: 'Nothing to look up here. Carry on the conversation yourself.' });
                break;
            case 'session.usage.updated':
                this.usage.seconds = ev.usage?.seconds || this.usage.seconds || 0;
                break;
            case 'session.closed':
                if (!this.ended) this.emit('onDrop', ev.reason);
                break;
            case 'error':
                console.warn('speak error', ev.error);
                this.emit('onError', ev.error);
                break;
            default:
        }
    }

    endLiveLine() {
        const L = this.live;
        clearTimeout(L.lineTimer);
        if (!L.lineId) return;
        const id = L.lineId;
        L.lineId = null;
        this.emit('onSpeaking', false);
        if (L.line.trim()) this.emit('onHorangText', { id, text: L.line.trim(), done: true });
    }

    onEvent(ev) {
        if (this.engine === 'live') { this.onLiveEvent(ev); return; }
        switch (ev.type) {
            case 'output_audio_buffer.started':
                this.emit('onSpeaking', true);
                break;
            case 'output_audio_buffer.stopped':
            case 'output_audio_buffer.cleared':
                this.emit('onSpeaking', false);
                break;
            case 'input_audio_buffer.speech_started':
                this.emit('onListening', true);
                break;
            case 'input_audio_buffer.speech_stopped':
                this.emit('onListening', false);
                break;
            case 'response.output_audio_transcript.delta': {
                const text = (this.lines.get(ev.response_id) || '') + (ev.delta || '');
                this.lines.set(ev.response_id, text);
                this.emit('onHorangText', { id: ev.response_id, text, done: false });
                break;
            }
            case 'response.output_audio_transcript.done':
                this.lines.set(ev.response_id, ev.transcript || this.lines.get(ev.response_id) || '');
                this.emit('onHorangText', { id: ev.response_id, text: this.lines.get(ev.response_id), done: true });
                break;
            case 'conversation.item.input_audio_transcription.completed':
                this.emit('onYouText', { id: ev.item_id, text: ev.transcript || '' });
                break;
            case 'response.done':
                this.onResponseDone(ev.response);
                break;
            case 'error':
                console.warn('speak error', ev.error);
                break;
            default:
        }
    }

    onResponseDone(response) {
        const u = response?.usage;
        if (u) {
            const inD = u.input_token_details || {};
            const outD = u.output_token_details || {};
            this.usage.inputAudio += inD.audio_tokens || 0;
            this.usage.inputCachedAudio += inD.cached_tokens_details?.audio_tokens || 0;
            this.usage.inputText += inD.text_tokens || 0;
            this.usage.outputAudio += outD.audio_tokens || 0;
            this.usage.outputText += outD.text_tokens || 0;
        }
        const items = response?.output || [];
        const calls = items.filter((i) => i.type === 'function_call');
        if (!calls.length) return;
        for (const call of calls) {
            let args = {};
            try { args = JSON.parse(call.arguments || '{}'); } catch { /* keep {} */ }
            this.emit('onTool', call.name, args);
            this.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: call.call_id, output: '{"ok":true}' } });
        }
        // A turn that was only tool calls: let Horang carry on talking.
        const spoke = items.some((i) => i.type === 'message');
        const ending = calls.some((c) => c.name === 'end_scene');
        if (!spoke && !ending) this.send({ type: 'response.create' });
    }

    // Resolves once the character has been silent for `quietMs` (their audio,
    // not the transcript, which runs ahead of it), or after `maxMs` at most.
    waitForQuiet({ quietMs = 1300, maxMs = 15000 } = {}) {
        return new Promise((resolve) => {
            const started = Date.now();
            let quietSince = Date.now();
            const buf = new Uint8Array(512);
            const tick = setInterval(() => {
                const an = this.outAnalyser;
                if (!an || this.ended) { clearInterval(tick); resolve(); return; }
                an.getByteTimeDomainData(buf);
                let peak = 0;
                for (let i = 0; i < buf.length; i += 1) peak = Math.max(peak, Math.abs(buf[i] - 128));
                if (peak > 4 || this.live.lineId) quietSince = Date.now();
                if (Date.now() - quietSince >= quietMs || Date.now() - started >= maxMs) { clearInterval(tick); resolve(); }
            }, 100);
        });
    }

    stopLocal() {
        this.ended = true;
        clearTimeout(this.live.lineTimer);
        clearTimeout(this.live.youTimer);
        clearTimeout(this.live.kickTimer);
        clearTimeout(this.live.openTimer);
        try { this.dc?.close(); } catch { /* closed */ }
        try { this.pc?.close(); } catch { /* closed */ }
        this.mic?.getTracks().forEach((t) => t.stop());
        if (this.audio) { this.audio.srcObject = null; }
        if (this.ctx && this.ctx.state !== 'closed') this.ctx.close().catch(() => {});
    }

    // Hang up and tell the server how it went. `beacon` is for page unload.
    async end({ goalsDone = 0, transcript = [], reason = 'user', beacon = false, ...notes } = {}) {
        if (this.ended && !this.sessionId) return null;
        this.stopLocal();
        if (!this.sessionId) return null;
        const id = this.sessionId;
        this.sessionId = null;
        const body = JSON.stringify({ goalsDone, transcript, usage: this.usage, reason, ...notes });
        if (beacon && navigator.sendBeacon) {
            navigator.sendBeacon(`/api/speak/session/${id}/end`, new Blob([body], { type: 'application/json' }));
            return null;
        }
        const res = await fetch(`/api/speak/session/${id}/end`, {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body,
        }).catch(() => null);
        return res ? res.json().catch(() => null) : null;
    }
}
