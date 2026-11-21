import urllib.request
import zlib
import base64

def plantuml_encode(text):
    zlibbed = zlib.compress(text.encode('utf-8'))[2:-4]
    b64 = base64.b64encode(zlibbed).decode('ascii')
    trans = str.maketrans('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
                          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_')
    return b64.translate(trans)

with open('NovaCare_PlantUML/Activity_UC_AUTH_02_Dang_Nhap.puml', 'r', encoding='utf-8') as f:
    code = f.read()

encoded = plantuml_encode(code)
url = f'http://www.plantuml.com/plantuml/svg/~1{encoded}'
print('Testing URL fetch for puml...')
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        svg_content = resp.read().decode('utf-8')
        if 'Syntax Error' in svg_content:
            print('SYNTAX ERROR DETECTED in current puml!')
        else:
            print('RENDER VALID! SVG size:', len(svg_content))
except Exception as e:
    print('Request error:', e)
