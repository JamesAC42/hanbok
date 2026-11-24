// Feature flags live in git, not in the server's api.env.
//
// server/config/flags.<target>.env is baked into the API image, so merging a
// change to it is the whole rollout: CD builds the image and recreates the
// containers. A key listed there wins over the same key in api.env; keys it
// doesn't list keep their api.env value. Secrets stay in api.env only.
//
// target: HANBOK_FLAGS if set ("production", "staging", or "none" to skip),
// otherwise staging when the server is configured as staging (MONGODB_DB or
// FRONTEND_URL), otherwise production. Local dev (NODE_ENV not production)
// loads nothing unless HANBOK_FLAGS names a file.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG_DIR = path.join(__dirname, '..', 'config');

const flagTarget = (env = process.env) => {
    if (env.HANBOK_FLAGS) return env.HANBOK_FLAGS === 'none' ? null : env.HANBOK_FLAGS;
    if (env.NODE_ENV !== 'production') return null;
    if (env.MONGODB_DB === 'hanbok_staging' || /\/\/staging\./.test(env.FRONTEND_URL || '')) return 'staging';
    return 'production';
};

// KEY=value lines; # comments and blank lines ignored; optional quotes stripped.
const parseFlags = (text) => {
    const flags = {};
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const m = line.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
        if (!m) throw new Error(`bad flag line: ${raw}`);
        let value = m[2].replace(/\s+#.*$/, '').trim();
        if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
        flags[m[1]] = value;
    }
    return flags;
};

let applied = { target: null, version: null, keys: [] };

const applyFlags = (env = process.env, dir = CONFIG_DIR) => {
    const target = flagTarget(env);
    if (!target) return (applied = { target: null, version: null, keys: [] });
    if (!/^[a-z-]+$/.test(target)) throw new Error(`bad HANBOK_FLAGS: ${target}`);
    const file = path.join(dir, `flags.${target}.env`);
    const flags = parseFlags(fs.readFileSync(file, 'utf8'));
    const changed = [];
    for (const [key, value] of Object.entries(flags)) {
        if (env[key] !== undefined && env[key] !== value) changed.push(`${key} ${env[key]} -> ${value}`);
        env[key] = value;
    }
    const keys = Object.keys(flags).sort();
    const version = crypto.createHash('sha1')
        .update(keys.map((k) => `${k}=${flags[k]}`).join('\n')).digest('hex').slice(0, 8);
    applied = { target, version, keys };
    console.log(`Flags: ${path.basename(file)} v${version}: ${keys.map((k) => `${k}=${flags[k]}`).join(' ')}`);
    if (changed.length) console.log(`Flags: overriding api.env: ${changed.join(', ')}`);
    return applied;
};

const appliedFlags = () => applied;

module.exports = { applyFlags, appliedFlags, parseFlags, flagTarget };
