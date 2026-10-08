// Browser side of a Speak call: microphone + WebRTC to OpenAI Realtime.
// The server opens the call (POST /api/speak/session) so the API key and
// Horang's instructions stay server-side; this file only moves audio and
// listens to the data channel for captions, tool calls and speaking state.

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
    }

    emit(name, ...args) {
        try { this.h[name]?.(...args); } catch (e) { console.error(e); }
    }

    async start({ scenarioId, level, language, nativeLanguage }) {
        this.mic = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        const pc = new RTCPeerConnection();
        this.pc = pc;
        this.audio = new Audio();
        this.audio.autoplay = true;
        pc.ontrack = (e) => { this.audio.srcObject = e.streams[0]; this.audio.play?.().catch(() => {}); };
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
        this.dc.onopen = () => this.emit('onOpen');

        await pc.setLocalDescription(await pc.createOffer());
        await waitForIce(pc);

        const res = await fetch('/api/speak/session', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenarioId, level, language, nativeLanguage, sdp: pc.localDescription.sdp }),
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
        await pc.setRemoteDescription({ type: 'answer', sdp: data.answer });
        return data;
    }

    send(event) {
        if (this.dc?.readyState === 'open') this.dc.send(JSON.stringify(event));
    }

    // A note to Horang that the learner didn't say out loud (button presses).
    nudge(text) {
        this.send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } });
        this.send({ type: 'response.create' });
    }

    setMuted(muted) {
        this.mic?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    }

    onEvent(ev) {
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

    stopLocal() {
        this.ended = true;
        try { this.dc?.close(); } catch { /* closed */ }
        try { this.pc?.close(); } catch { /* closed */ }
        this.mic?.getTracks().forEach((t) => t.stop());
        if (this.audio) { this.audio.srcObject = null; }
    }

    // Hang up and tell the server how it went. `beacon` is for page unload.
    async end({ goalsDone = 0, transcript = [], reason = 'user', beacon = false } = {}) {
        if (this.ended && !this.sessionId) return null;
        this.stopLocal();
        if (!this.sessionId) return null;
        const id = this.sessionId;
        this.sessionId = null;
        const body = JSON.stringify({ goalsDone, transcript, usage: this.usage, reason });
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
