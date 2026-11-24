# Regenerates lib/hmrc-eoy/catalog.json from HMRC's published API specs
# (github.com/hmrc/<api>/resources/public/api/conf/<version>).
#
#   python3 scripts/hmrc/build-eoy-catalog.py      # needs PyYAML
#
# The catalog lists every endpoint of the end-of-year, property and
# non-business income APIs, with each request body's JSON schema and HMRC's
# Gov-Test-Scenario values. The year-end workspace renders its forms from it,
# so an API version bump is: change the version below, rerun, review the diff.
import json,yaml
import re,sys,os,urllib.request,posixpath
specs=[l.split() for l in """individual-losses-api 7.0 main
individuals-tax-liability-adjustments-api 1.0 main
self-assessment-bsas-api 7.0 main
self-assessment-biss-api 3.0 main
business-details-api 2.0 main
individual-calculations-api 8.0 main
property-business-api 6.0 main
individuals-employments-income-api 2.0 main
individuals-pensions-income-api 2.0 main
individuals-state-benefits-api 2.0 main
individuals-charges-api 3.0 main
individuals-expenses-api 3.0 main""".splitlines()]
import tempfile
out=tempfile.mkdtemp()
for name,v,br in specs:
  base=f"https://raw.githubusercontent.com/hmrc/{name}/{br}/resources/public/api/conf/{v}/"
  seen=set(); todo=['application.yaml']
  while todo:
    rel=posixpath.normpath(todo.pop())
    if rel in seen or rel.startswith('..'): continue
    seen.add(rel)
    try: data=urllib.request.urlopen(base+rel,timeout=20).read().decode()
    except Exception as e: print('ERR',name,rel,e); continue
    p=os.path.join(out,name,rel); os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'w').write(data)
    for r in re.findall(r"\"?\$ref\"?\s*:\s*['\"]?([^'\"#\s,}]+)",data):
      if r.startswith('http'): continue
      todo.append(posixpath.join(posixpath.dirname(rel),r))
  print(name,len(seen))

root=out
out=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','lib','hmrc-eoy','catalog.json')
APIS={'individual-losses-api':('Individual Losses','7.0'),
'individuals-tax-liability-adjustments-api':('Individuals Tax Liability Adjustments','1.0'),
'self-assessment-bsas-api':('Business Source Adjustable Summary','7.0'),
'self-assessment-biss-api':('Business Income Source Summary','3.0'),
'business-details-api':('Business Details','2.0'),
'individual-calculations-api':('Individual Calculations','8.0'),
'property-business-api':('Property Business','6.0'),
'individuals-employments-income-api':('Individuals Employments Income','2.0'),
'individuals-pensions-income-api':('Individuals Pensions Income','2.0'),
'individuals-state-benefits-api':('Individuals State Benefits','2.0'),
'individuals-charges-api':('Individuals Charges','3.0'),
'individuals-expenses-api':('Individuals Expenses','3.0')}
def untemplate(t):
  pat=re.compile(r"\{\{#(if|unless) \((enabled|releasedInProduction) ['\"][^'\"]+['\"]\)\}\}((?:(?!\{\{#(?:if|unless)).)*?)\{\{/(?:if|unless)\}\}",re.S)
  while True:
    m=pat.search(t)
    if not m: break
    kind,fn,body=m.group(1),m.group(2),m.group(3)
    a,_,b=body.partition('{{else}}')
    if kind=='if': keep=a
    elif fn=='enabled': keep=b
    else: keep=a
    t=t[:m.start()]+keep+t[m.end():]
  t=re.sub(r"\{\{[^}]*\}\}","",t)
  return t
def load(path):
  txt=untemplate(open(path).read())
  if path.endswith('.json'): return json.loads(re.sub(r',(\s*[}\]])',r'\1',txt))
  try: return yaml.safe_load(txt)
  except Exception:
    # fall back: strip description blocks
    m=re.search(r'^summary:\s*(.*)$',txt,re.M)
    return {'summary':m.group(1).strip() if m else None,'_broken':True}
def resolve(node,base,stack=()):
  if isinstance(node,dict):
    if '$ref' in node and isinstance(node['$ref'],str):
      ref=node['$ref']; f,_,frag=ref.partition('#')
      fp=posixpath.normpath(posixpath.join(posixpath.dirname(base),f)) if f else base
      key=(fp,frag)
      if key in stack: return {}
      try: doc=load(fp)
      except Exception as e: print('UNRESOLVED',ref,file=sys.stderr); return {}
      for part in [p for p in frag.split('/') if p]: doc=doc.get(part,{})
      merged=resolve(doc,fp,stack+(key,))
      rest={k:v for k,v in node.items() if k!='$ref'}
      if rest and isinstance(merged,dict): merged={**merged,**resolve(rest,base,stack)}
      return merged
    return {k:resolve(v,base,stack) for k,v in node.items()}
  if isinstance(node,list): return [resolve(v,base,stack) for v in node]
  return node
def slim(s):
  # keep what the form needs
  if isinstance(s,dict):
    keep={k:({pk:slim(pv) for pk,pv in v.items()} if k=='properties' and isinstance(v,dict) else slim(v)) for k,v in s.items() if k in ('type','properties','items','required','enum','title','description','minimum','maximum','pattern','format','oneOf','anyOf','allOf','minItems','maxItems','minLength','maxLength','multipleOf','example')}
    if 'description' in keep and isinstance(keep['description'],str): keep['description']=keep['description'][:400]
    return keep
  if isinstance(s,list): return [slim(v) for v in s]
  return s
cat=[]
for api,(name,ver) in APIS.items():
  app=load(f"{root}/{api}/application.yaml")
  for path,ref in app['paths'].items():
    pf=os.path.join(root,api,ref['$ref'])
    pd=load(pf)
    for m in ('get','post','put','delete'):
      if m not in pd: continue
      opref=pd[m].get('$ref') if isinstance(pd[m],dict) else None
      of=posixpath.normpath(posixpath.join(posixpath.dirname(pf),opref)) if opref else pf
      op=load(of) if opref else pd[m]
      bodies=[]
      rb=(op.get('requestBody') or {}).get('content',{}).get('application/json',{}) if not op.get('_broken') else {}
      if rb:
        sch=resolve(rb.get('schema',{}),of)
        ex=resolve(rb.get('example',{}),of) if 'example' in rb else None
        exs=rb.get('examples')
        variants=[]
        if isinstance(sch,dict) and ('oneOf' in sch or 'anyOf' in sch) and 'properties' not in sch: variants=sch.get('oneOf') or sch.get('anyOf')
        else: variants=[sch]
        exlist=[]
        if exs: exlist=[resolve(v,of).get('value',resolve(v,of)) if isinstance(v,dict) else v for v in exs.values()]
        elif ex is not None: exlist=[ex]
        for i,v in enumerate(variants):
          bodies.append({'title':(v.get('title') or v.get('description','')[:80] or f'Variant {i+1}'),'schema':slim(v),'example':exlist[i] if i<len(exlist) else (exlist[0] if exlist else None)})
      summ=op.get('summary') or ''
      ep_id=re.sub(r'[^a-z0-9]+','-',f"{api.replace('-api','')} {m} {summ}".lower()).strip('-')
      desc=op.get('description') or ''
      head=desc.split('### Test data')[0].strip()
      head=re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',head))[:700]
      scen=[]
      if 'Gov-Test-Scenario' in desc:
        for row in re.findall(r'^\|\s*(?:<p>)?([A-Z][A-Z0-9_]{2,})(?:</p>)?\s*\|\s*(.*?)\s*\|\s*$',desc.split('Gov-Test-Scenario',1)[1],re.M):
          scen.append({'value':row[0],'desc':re.sub(r'<[^>]+>','',row[1])[:200]})
      query=[]
      for prm in (op.get('parameters') or []) if not op.get('_broken') else []:
        prm=resolve(prm,of) if isinstance(prm,dict) else {}
        if prm.get('in')=='query':
          sc=prm.get('schema') or {}
          query.append({'name':prm.get('name'),'required':bool(prm.get('required')),'enum':sc.get('enum'),'description':re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',str(prm.get('description') or '')))[:300]})
      cat.append({'query':query,'description':head,'scenarios':scen,'id':ep_id,'apiKey':api,'api':name,'version':ver,'method':m.upper(),'path':path,'summary':summ,'bodies':bodies})
ids=[c['id'] for c in cat]; dup={i for i in ids if ids.count(i)>1}
for c in cat:
  if c['id'] in dup: c['id']+= '-'+re.sub(r'[^a-z0-9]+','-',c['path'].lower()).strip('-')[-40:]
json.dump(cat,open(out,'w'),indent=1)
print(len(cat),'endpoints', sum(len(c['bodies']) for c in cat),'bodies', os.path.getsize(out)//1024,'KB')
for c in cat:
  if not c['summary']: print('NO SUMMARY',c['method'],c['path'])
  for b in c['bodies']:
    if '_unresolved' in json.dumps(b): print('UNRESOLVED',c['id'])
