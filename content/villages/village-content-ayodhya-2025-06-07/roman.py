import re, unicodedata
C={'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n','ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n',
   'त':'t','थ':'th','द':'d','ध':'dh','न':'n','प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h',
   'क़':'q','ख़':'kh','ग़':'gh','ज़':'z','फ़':'f','ड़':'r','ढ़':'rh','ळ':'l'}
V={'अ':'a','आ':'a','इ':'i','ई':'i','उ':'u','ऊ':'u','ऋ':'ri','ए':'e','ऐ':'ai','ओ':'o','औ':'au','ऑ':'o'}
M={'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u','ृ':'ri','े':'e','ै':'ai','ो':'o','ौ':'au','ॉ':'o','ॅ':'e'}
VIR='्'; NUK='़'
def word(w):
    w=unicodedata.normalize('NFC',w)
    # merge nukta forms
    w=w.replace('ड'+NUK,'ड़').replace('ढ'+NUK,'ढ़').replace('ज'+NUK,'ज़').replace('फ'+NUK,'फ़').replace('क'+NUK,'क़').replace('ख'+NUK,'ख़').replace('ग'+NUK,'ग़')
    units=[]  # each: [cons, vowel, explicit, nasal]
    i=0
    while i<len(w):
        ch=w[i]
        if ch in C or (ch in 'डढजफकखग' and i+1<len(w) and w[i+1]==NUK):
            base=C.get(ch,'')
            if i+1<len(w) and w[i+1]==NUK:
                base={'ड':'r','ढ':'rh','ज':'z','फ':'f','क':'q','ख':'kh','ग':'gh'}[ch]; i+=1
            u=[base,'a',False,'']; i+=1
            if i<len(w) and w[i]==VIR: u[1]='';u[2]=True;i+=1
            elif i<len(w) and w[i] in M: u[1]=M[w[i]];u[2]=True;i+=1
            units.append(u)
        elif ch in V:
            units.append(['',V[ch],True,'']); i+=1
        elif ch in 'ंँ':
            if units: units[-1][3]='n'
            i+=1
        elif ch=='ः': i+=1
        elif ch.isdigit() or ch.isascii(): units.append([ch,'',True,'']); i+=1
        else: i+=1
    # schwa deletion: final
    if len(units)>1 and units[-1][1]=='a' and not units[-1][2] and units[-1][0]: units[-1][1]=''
    # medial: V C a C V -> delete, scan right to left
    for k in range(len(units)-2,0,-1):
        u=units[k]
        if u[1]=='a' and not u[2] and u[0] and not u[3]:
            prev=units[k-1]; nxt=units[k+1]
            if prev[1] and nxt[1] and nxt[0] and not (prev[1]=='' ) :
                # don't delete if previous unit already lost its vowel (avoid 3-consonant clusters)
                u[1]=''
    for u in units:
        if u[0]=='ph' and u[1] in ('a','i','ai','e',''): u[0]='f'
        if u[0]=='v' and u[1] in ('a','o','au'): u[0]='w'
    out=''
    for k,(c,v,e,n) in enumerate(units):
        nas=''
        if n:
            nxt=units[k+1][0] if k+1<len(units) else ''
            nas='m' if nxt[:1] in ('p','b','m') else 'n'
        out+=c+v+nas
    out=re.sub(r'(.)\1\1+',r'\1\1',out)
    return out
SUF=['नगर','पुरवा','पुरा','पुर','गंज','बाग','बाजार','मोहल्ला','गांव','गाँव','खुर्द','कलां','गढ़','पट्टी','डीह','टोला','पारा','बाड़ी','घाट','कोट','पाली','मऊ','ताल','पार','कला','आबाद','बाद']
def compound(w):
    for sfx in sorted(SUF,key=len,reverse=True):
        if w.endswith(sfx) and len(w)>len(sfx)+1:
            return compound(w[:-len(sfx)])+word(sfx)
    return word(w)
def roman(s):
    s=re.sub(r'\s+',' ',s.strip())
    parts=re.split(r'(\s+|[()\-/,.0-9]+)',s)
    res=''.join(compound(p) if re.search(r'[ऀ-ॿ]',p) else p for p in parts)
    res=res.replace('  ',' ')
    res=re.sub(r'\(\s*','(',res); res=re.sub(r'\s*\)',')',res)
    out=' '.join(x[:1].upper()+x[1:] if x else x for x in res.split(' '))
    out=re.sub(r'\((\w)',lambda m:'('+m.group(1).upper(),out)
    return out
def slug(en):
    s=unicodedata.normalize('NFKD',en).encode('ascii','ignore').decode().lower()
    s=re.sub(r'[^a-z0-9]+','-',s).strip('-')
    return s
if __name__=='__main__':
    for s in ['कटरा गोशाईगंज','रिकाबगंज','देवकाली','सिविल लाइन','चिर्रा मोहम्मद पुर','कस्तूरीपुर','कुढ़ा केशवपुर मांझा','फतेहपुर सरैया उपरहर','भदरसा','कश्मीरी मोहल्ला','कसाब बाड़ा','करम अली का पुरवा','दर्शन नगर','रानोपाली','सोहावल','कुमारगंज','मिल्कीपुर','रुदौली','बीकापुर','जमुनियाबाग','खवासपुरा','अंगूरीबाग','काजीपुर चितावां (मणि पर्वत )','हाजीपुर बरसेण्डी उपरहरर','तहसीनपुर','दौलतपुर','नजीबपुर','ठेवंगा','मुमताजनगर','कनकपुर']:
        print(f'{s:32s} {roman(s):32s} {slug(roman(s))}')
