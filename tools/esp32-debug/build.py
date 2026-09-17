"""Build the same LVGL C UI for the browser and, optionally, ESP32."""
import argparse, atexit, concurrent.futures, hashlib, json, os, shutil, subprocess, tempfile, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
UI = ROOT / 'apps/esp32/lvgl_port'
OUT = HERE / 'generated'
p = argparse.ArgumentParser()
p.add_argument('--firmware', action='store_true')
p.add_argument('--lvgl', type=Path, default=None)
p.add_argument('--emsdk', type=Path, default=Path(os.environ.get('EMSDK', 'C:/t/operit-emsdk')))
a = p.parse_args()
subprocess.run(['node', str(HERE/'compile-layout.mjs')], check=True)
def shared_hash():
    files=sorted(UI.glob('*.c'))+sorted(UI.glob('*.h'))+[ROOT/'apps/esp32/ui/layout.json']
    return hashlib.sha256(b''.join(f.read_bytes() for f in files)).hexdigest()
lvgl = a.lvgl or next(Path('C:/t/xtensa-esp32-espidf/release/build').glob('esp-idf-sys-*/out/managed_components/lvgl__lvgl'), None)
if not lvgl: raise SystemExit('LVGL source not found; pass --lvgl /path/to/lvgl (v9.3.0)')
sdk = lvgl.parent.parent / 'build/config/sdkconfig.h'
if not sdk.exists(): raise SystemExit('Build ESP32 once first: generated sdkconfig.h is required to share LVGL configuration')
emcc = a.emsdk / 'upstream/emscripten/emcc.py'
if not emcc.exists(): raise SystemExit('Install/activate Emscripten 4.0.14, or pass --emsdk')
OUT.mkdir(exist_ok=True)
temporary = tempfile.TemporaryDirectory(prefix='.build-', dir=OUT)
atexit.register(temporary.cleanup)
staging = Path(temporary.name)
objdir = OUT / 'objects'; objdir.mkdir(exist_ok=True)
# Import the firmware LVGL options, leaving ESP-IDF platform headers out of Wasm.
config = '\n'.join(line for line in sdk.read_text().splitlines() if line.startswith('#define CONFIG_LV_'))
(staging / 'sdkconfig.h').write_text(config + '\n', encoding='utf-8')
env = os.environ.copy();env['EMSDK'] = str(a.emsdk);env['EM_CONFIG'] = str(a.emsdk / '.emscripten')
command = [shutil.which('python'), str(emcc)]
flags = ['-O2', '-DLV_CONF_SKIP', '-DLV_KCONFIG_PRESENT', '-include', str(staging / 'sdkconfig.h'), '-I'+str(staging), '-I'+str(HERE/'wasm'), '-I'+str(UI), '-I'+str(lvgl)]
version = (lvgl/'lv_version.h').read_text()
config_hash = hashlib.sha256((config+version+' '.join(flags).replace(str(staging), '<build>')).encode()).hexdigest()
sources = list((lvgl/'src').rglob('*.c')) + list(UI.glob('*.c')) + [HERE/'wasm/bridge.c']
# Keep only one object per current source; removed sources cannot accumulate.
expected = {hashlib.sha256(str(source).encode()).hexdigest()[:20] + suffix
            for source in sources for suffix in ('.o', '.sha')}
for cached in objdir.iterdir():
    if cached.is_file() and cached.suffix in ('.o', '.sha') and cached.name not in expected:
        cached.unlink()

def compile_one(source):
    dest = objdir / (hashlib.sha256(str(source).encode()).hexdigest()[:20]+'.o')
    stamp=dest.with_suffix('.sha'); signature=hashlib.sha256(source.read_bytes()+config_hash.encode()+b''.join(f.read_bytes() for f in sorted(UI.glob('*.h')) if f.name!='layout.generated.h' or source.parent==UI)+(HERE/'wasm/esp_timer.h').read_bytes()).hexdigest()
    if not dest.exists() or not stamp.exists() or stamp.read_text()!=signature:
        result=subprocess.run(command+flags+['-c',str(source),'-o',str(dest)],env=env,capture_output=True,text=True)
        if result.returncode: raise RuntimeError(result.stderr)
        stamp.write_text(signature)
    return dest
source_hash=shared_hash()
print('Compiling shared LVGL UI to WebAssembly...',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: objects=list(pool.map(compile_one,sources))
exports=['_operit_store_validate','_simulator_init','_simulator_frame','_simulator_generation','_simulator_heap_used','_simulator_touch','_operit_lvgl_pump','_operit_lvgl_navigate_home','_operit_lvgl_navigate_apps','_operit_lvgl_set_connection','_operit_lvgl_set_expression','_operit_lvgl_set_theme','_operit_lvgl_theme_index','_operit_lvgl_round_icons','_operit_lvgl_current_page','_operit_lvgl_layout_clear','_operit_lvgl_layout_add','_operit_lvgl_layout_geometry','_operit_lvgl_layout_bind','_operit_lvgl_layout_page_meta','_operit_lvgl_layout_style']
args=[str(x) for x in objects]+['-O2','--no-entry','-sMODULARIZE=1','-sEXPORT_ES6=1','-sENVIRONMENT=web','-sALLOW_MEMORY_GROWTH=1','-sEXPORTED_FUNCTIONS='+json.dumps(exports),'-sEXPORTED_RUNTIME_METHODS=["ccall","HEAPU8"]','-o',str(staging/'ui.mjs')]
rsp=staging/'link.rsp';rsp.write_text('\n'.join(json.dumps(x) for x in args),encoding='utf-8')
subprocess.run(command+['@'+str(rsp)],env=env,check=True)
runtime_hash=hashlib.sha256(b''.join(f.read_bytes() for f in sorted(UI.glob('*.c'))+sorted(f for f in UI.glob('*.h') if f.name!='layout.generated.h')+sorted((ROOT/'apps/esp32/src').glob('*.rs'))+[ROOT/'apps/esp32/partitions.csv'])).hexdigest()
manifest={'runtimeHash':runtime_hash,'sourceHash':source_hash,'builtAt':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'lvgl':'9.3.0','firmwareBuilt':False,'source':'apps/esp32/lvgl_port/operit_lvgl.c'}
if a.firmware:
    print('Building ESP32 from the same source...',flush=True)
    sdk_path=ROOT/'apps/esp32/.embuild/espressif/esp-idf-8988cb4ae4b051da/v5.3.2'
    if sdk_path.exists():env['IDF_PATH']=str(sdk_path)
    # esp-idf-sys does not track extra component source edits itself.
    archive = lvgl.parent.parent/'build/esp-idf/lvgl_port/liblvgl_port.a'
    newest = max(x.stat().st_mtime for x in UI.iterdir() if x.suffix in ('.c','.h','.txt'))
    if not archive.exists() or archive.stat().st_mtime < newest:
        (ROOT/'apps/esp32/sdkconfig.defaults').touch()
    with (OUT/'firmware-build.log').open('w',encoding='utf-8') as log:
        result=subprocess.run(['cargo','build','--release'],cwd=ROOT/'apps/esp32',env=env,stdout=log,stderr=subprocess.STDOUT)
    # Retain only the latest diagnostic tail, including failures.
    logfile = OUT/'firmware-build.log'
    with logfile.open('rb') as log:
        log.seek(max(0, logfile.stat().st_size - 256 * 1024))
        tail = log.read()
    logfile.write_bytes(tail)
    if result.returncode:raise SystemExit('Firmware failed; see generated/firmware-build.log')
    manifest['firmwareBuilt']=True
    manifest['firmwareElf']='C:/t/xtensa-esp32-espidf/release/operit-esp32'
    manifest['firmwareSha256']=hashlib.sha256(Path(manifest['firmwareElf']).read_bytes()).hexdigest()
    release=Path(manifest['firmwareElf']).parent
    dist=ROOT/'apps/esp32/dist'; dist.mkdir(exist_ok=True)
    flash=['espflash','save-image','--chip','esp32','--flash-mode','dio','--flash-size','4mb','--skip-update-check','--bootloader',str(release/'bootloader.bin'),'--partition-table',str(ROOT/'apps/esp32/partitions.csv')]
    subprocess.run(flash+[manifest['firmwareElf'],str(dist/'operit-esp32.bin')],check=True)
    subprocess.run(flash+['--merge',manifest['firmwareElf'],str(dist/'operit-esp32-4mb-full.bin')],check=True)
    for name in ['bootloader.bin','partition-table.bin']:shutil.copy2(release/name,dist/name)

if source_hash != shared_hash():
    raise SystemExit('UI changed during build; rebuild before publishing matching artifacts')
shutil.copy2(staging/'ui.wasm', OUT/'ui.wasm')
shutil.copy2(staging/'ui.mjs', OUT/'ui.mjs')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Build complete: '+source_hash[:12],flush=True)
