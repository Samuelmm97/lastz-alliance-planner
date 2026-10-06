import re
"""Five-minute diagnostic polling; Hermes runs only for actual incidents.

All credentials and incident evidence live in ignored .local. This reads the
existing backend; it never reads a member's screenshots or controls the game.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / '.local' / 'health-monitor'
CONFIG = ROOT / '.local' / 'health-monitor-config.json'


def read(path, default=None):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {} if default is None else default


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, indent=2), encoding='utf-8')
    temp.replace(path)


def failure(event):
    kind = event.get('kind')
    details = event.get('details', {})
    if kind == 'reading_completed':
        return details.get('mode') != 'manual' and (
            details.get('missingLevels', 0) > 0 or details.get('cards') == 0)
    return kind in {'reading_failed', 'reading_timeout', 'files_rejected',
                   'image_preview_failed', 'plan_submit_failed',
                   'data_load_failed', 'report_issue', 'backend_unreachable'}


def incident_key(event):
    # Same support code / category / reader in one day is one incident,
    # including retries of an identical partial read.
    d = event.get('details', {})
    value = [event.get('code'), event.get('version'), event.get('kind'),
             d.get('mode'), d.get('stage'), int(event.get('created_at', 0)) // 86400000]
    return hashlib.sha256(json.dumps(value).encode()).hexdigest()


def pending(events, state):
    groups = {}
    for event in events:
        if failure(event):
            key = incident_key(event)
            if key not in state.get('seen', {}):
                groups.setdefault(key, []).append(event)
    return groups


def request_json(url, headers=None, value=None):
    data = json.dumps(value).encode() if value is not None else None
    request = urllib.request.Request(url, data=data, headers={
        'User-Agent': 'LastZAlliancePlannerHealth/1.0', **(headers or {})})
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.load(response)


def notify(config, text):
    paired = read(config['telegram_config'])
    if not paired.get('bot_token') or not paired.get('chat_id'):
        raise RuntimeError('Paired Telegram configuration unavailable')
    result = request_json('https://api.telegram.org/bot' + paired['bot_token'] + '/sendMessage',
                          {'Content-Type': 'application/json'},
                          {'chat_id': paired['chat_id'], 'text': text[:3900]})
    if not result.get('ok'):
        raise RuntimeError('Telegram delivery was not confirmed')


def load_launcher(config):
    module_path = Path(config['helicopter_root']) / 'agent_recovery.py'
    spec = importlib.util.spec_from_file_location('lastz_existing_recovery', module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, module.hermes_launcher()


def clean_checkout():
    result = subprocess.run(['git', 'status', '--porcelain'], cwd=ROOT,
                            capture_output=True, text=True, timeout=15)
    return result.returncode == 0 and not result.stdout.strip()


def retained_evidence(config, codes):
    cache = LOCAL / 'retained-images'
    cache.mkdir(parents=True, exist_ok=True)
    images = []
    for code in codes:
        try:
            listing = request_json(config['api_base'] + '/api/failed-screenshots?code=' + code,
                                   {'Authorization': 'Bearer ' + config['leader_key']})
            for image in listing.get('images', [])[:8]:
                if not re.fullmatch(r'[a-f0-9]{64}', image.get('id', '')):
                    continue
                suffix = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/bmp': '.bmp'}.get(image.get('mime'))
                if not suffix or image['expires_at'] <= time.time()*1000:
                    continue
                target = cache / (image['id'] + suffix)
                request = urllib.request.Request(config['api_base'] + '/api/failed-screenshots?id=' + image['id'],
                    headers={'Authorization': 'Bearer ' + config['leader_key']})
                with urllib.request.urlopen(request, timeout=25) as response:
                    content = response.read(12*1024*1024 + 1)
                if len(content) > 12*1024*1024:
                    continue
                target.write_bytes(content)
                save(cache / (image['id'] + '.json'), {'path': str(target), 'expires_at': image['expires_at']})
                images.append({'path': str(target), 'expires_at': image['expires_at'], 'code': code})
        except Exception:
            continue
    return images


def cleanup_retained_evidence():
    cache = (LOCAL / 'retained-images').resolve()
    if not cache.exists():
        return
    for meta in cache.glob('*.json'):
        value = read(meta)
        if value.get('expires_at', 0) > time.time()*1000:
            continue
        target = Path(value.get('path', '')).resolve()
        if target.parent == cache and target.is_file():
            target.unlink()
        meta.unlink()


def run_hermes(config, folder, diagnose_only=False):
    module, launcher = load_launcher(config)
    if not launcher:
        return {'recovered': False, 'summary': 'No working Hermes launcher was found.'}
    prefix, cwd = launcher
    prompt = (ROOT / 'ops' / 'RECOVERY.md').read_text(encoding='utf-8')
    prompt += '\nRepository: ' + str(ROOT)
    prompt += '\nIncident evidence: ' + str(folder / 'incident.json')
    prompt += '\nWrite outcome JSON to: ' + str(folder / 'outcome.json')
    if diagnose_only:
        prompt += '\nDIAGNOSTIC TEST: do not edit, commit, push or deploy. Investigate and report only.'
    (folder / 'prompt.txt').write_text(prompt, encoding='utf-8')
    environment = module.launcher_env(prefix)
    home = module.hermes_home(prefix)
    if home:
        environment['HERMES_HOME'] = home
    command = [*prefix, 'chat', '--oneshot', '-Q', '--yolo', '--query-file',
               str(folder / 'prompt.txt'), '--max-turns', '40', '--run-budget', '480',
               '--source', 'lastz-planner-recovery', '-t', 'file,terminal,code_execution,web']
    with (folder / 'hermes-output.log').open('w', encoding='utf-8') as output:
        process = subprocess.Popen(command, cwd=cwd or ROOT, env=environment,
                                   stdin=subprocess.DEVNULL, stdout=output,
                                   stderr=subprocess.STDOUT,
                                   creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        save(folder / 'agent.json', {'pid': process.pid, 'started_at': time.time()})
        try:
            process.wait(timeout=510)
        except subprocess.TimeoutExpired:
            # Terminate the entire agent tree so a late child cannot publish after
            # the monitor has reported a timeout and another lease has started.
            if os.name == 'nt':
                subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                               capture_output=True, timeout=15)
            else:
                process.kill()
            return {'recovered': False, 'summary': 'Hermes recovery timed out.'}
    result = read(folder / 'outcome.json')
    if process.returncode != 0 or not isinstance(result.get('recovered'), bool):
        return {'recovered': False, 'summary': 'Hermes did not return a valid recovery result.'}
    return result


def run_once(dry_run=False, diagnose_only=False):
    config = read(CONFIG)
    state_path = LOCAL / 'state.json'
    state = read(state_path, {'seen': {}, 'queued': {}, 'last_agent_at': 0})
    now = time.time()
    if not dry_run:
        cleanup_retained_evidence()
    state.setdefault('queued', {})
    state['seen'] = {k: v for k, v in state.get('seen', {}).items() if now-v < 8*86400}
    try:
        data = request_json(config['api_base'] + '/api/diagnostics',
                            {'Authorization': 'Bearer ' + config['leader_key']})
        if not isinstance(data.get('events'), list):
            raise RuntimeError('Diagnostics response invalid')
    except Exception as error:
        # Never log exception URLs: Telegram/HTTP errors may contain credentials.
        state['poll_failures'] = state.get('poll_failures', 0) + 1
        save(LOCAL / 'status.json', {'at': now, 'status': 'backend_unreachable',
                                   'error_type': type(error).__name__})
        if dry_run or state['poll_failures'] < 2:
            if not dry_run:
                save(state_path, state)
            return {'status': 'backend_unreachable'}
        data = {'events': [{'code': 'backend', 'version': 'service',
                           'kind': 'backend_unreachable', 'details': {},
                           'created_at': int(now*1000)}]}
    else:
        state['poll_failures'] = 0
    groups = pending(data['events'], state)
    if dry_run:
        return {'status': 'ready', 'events': len(data['events']), 'new_incidents': len(groups)}
    for key, events in groups.items():
        state['queued'][key] = events
        state['seen'][key] = now
    # Persist before delivery/agent dispatch. Retries remain queued, but polling
    # the same event does not send another message or spend another agent run.
    save(state_path, state)
    queue = state['queued']
    if queue and not state.get('queued_notified'):
        events = [e for group in queue.values() for e in group]
        codes = sorted({e['code'] for e in events})
        missing = sum(e.get('details', {}).get('missingLevels', 0) for e in events)
        state['queued_notified'] = 'attempted'
        save(state_path, state)
        try:
            notify(config, 'Last Z planner issue: ' + str(len(queue)) + ' grouped incidents. Support codes: ' + ', '.join(codes[:12]) + '. Missing levels observed: ' + str(missing) + '. Hermes investigation queued. Failed screenshots are retained privately for 7 days when the upload succeeds; older incidents may lack originals.')
            state['queued_notified'] = 'delivered'
        except Exception:
            state['queued_notified'] = 'unconfirmed'
        save(LOCAL / 'last-alert.json', {'at': now, 'status': state['queued_notified'], 'codes': codes})
    if queue and now-state.get('last_agent_at', 0) >= 3600 and (diagnose_only or clean_checkout()):
        folder = LOCAL / 'incidents' / str(uuid.uuid4())
        images = retained_evidence(config, sorted({e['code'] for group in queue.values() for e in group if re.fullmatch(r'[a-f0-9]{16}', e['code'])}))
        save(folder / 'incident.json', {'at': now, 'groups': queue, 'screenshots': images})
        # Durable lease and drained queue survive a monitor/PC restart.
        state['last_agent_at'] = now
        state['queued'] = {}
        state.pop('queued_notified', None)
        state['active_folder'] = str(folder)
        save(state_path, state)
        save(LOCAL / 'status.json', {'at': now, 'status': 'hermes_running', 'incident': folder.name})
        try:
            result = run_hermes(config, folder, diagnose_only)
        except Exception as error:
            result = {'recovered': False, 'summary': 'Recovery runner failed: ' + type(error).__name__}
        # Recovery uses temporary originals only; server retains the seven-day copy.
        for image in images:
            target = Path(image['path']).resolve()
            cache = (LOCAL / 'retained-images').resolve()
            if target.parent == cache:
                target.unlink(missing_ok=True)
                target.with_suffix('.json').unlink(missing_ok=True)
        save(folder / 'outcome.json', result)
        state.pop('active_folder', None)
        state['last_outcome'] = result
        save(state_path, state)
        try:
            notify(config, 'Last Z planner Hermes: ' + ('recovered. ' if result['recovered'] else 'needs follow-up. ') + str(result.get('summary', ''))[:2500])
        except Exception:
            save(folder / 'notification.json', {'status': 'unconfirmed'})
    else:
        save(state_path, state)
    save(LOCAL / 'status.json', {'at': time.time(), 'status': 'backend_unreachable' if state['poll_failures'] else 'ready',
                               'events': len(data['events']), 'queued': len(state['queued']),
                               'notification': state.get('queued_notified')})
    return {'status': 'ready', 'new_incidents': len(groups), 'queued': len(state['queued'])}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--diagnose-only', action='store_true')
    args = parser.parse_args()
    print(json.dumps(run_once(args.check, args.diagnose_only)))
