from pathlib import Path
import json, re, html, sys
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT
ROOT=Path(__file__).resolve().parents[1]
BEGINNER='--beginner' in sys.argv
OUT=ROOT/'dist'/('Ready-Together-Beginner-Guide.pdf' if BEGINNER else 'Ready-Together-Guide.pdf')
FONT='/usr/share/fonts/truetype/dejavu/'
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Serif','DejaVuSerif.ttf')]: pdfmetrics.registerFont(TTFont(name,FONT+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
ink=HexColor('#193d39'); accent=HexColor('#b66a3a'); muted=HexColor('#526a65'); pale=HexColor('#edf3ee'); paper=HexColor('#faf8f2')
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=9.3,leading=14,textColor=ink,spaceAfter=7),
 'intro':ParagraphStyle('intro',fontName='Body',fontSize=11,leading=16.7,textColor=muted),
 'h2':ParagraphStyle('h2',fontName='Bold',fontSize=11.8,leading=15,textColor=ink),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=8.6,leading=12.6,textColor=ink),
 'th':ParagraphStyle('th',fontName='Bold',fontSize=8.3,leading=12,textColor=white),
 'small':ParagraphStyle('small',fontName='Body',fontSize=7.6,leading=11,textColor=muted),
 'callout':ParagraphStyle('callout',fontName='Bold',fontSize=9.5,leading=14,textColor=ink)
}
chapters=json.loads((ROOT/'docs'/('beginner-guide.json' if BEGINNER else 'guide.json')).read_text()); sources=json.loads((ROOT/'docs/sources.json').read_text())
if BEGINNER:
 used={n for chapter in chapters for n in chapter.get('sources',[])}
 sources=[s for s in sources if s['id'] in used]
SERIES='BEGINNER QUICK START / 1.1' if BEGINNER else 'HOUSEHOLD FIELD GUIDE / 1.1'
W,H=612,792; L=46; CW=520
c=canvas.Canvas(str(OUT),pagesize=(W,H)); c.setTitle('Ready Together | Household Preparedness Guide'); c.setAuthor('Ready Together'); c.setSubject('Three-tier US household preparedness guide, version 1.1')
page_num=0; page_bounds=[]
def p(text,sty='body'):
 return Paragraph(text,styles[sty])
def draw(thing,y):
 w,h=thing.wrap(CW,H); thing.drawOn(c,L,y-h); return y-h

def header(title,kicker):
 global page_num
 page_num+=1
 c.setFillColor(paper); c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(ink); c.setFont('Bold',8); c.drawString(L,758,'READY TOGETHER'); c.setFont('Body',8); c.drawRightString(566,758,SERIES)
 c.setStrokeColor(HexColor('#d7dfd7')); c.line(L,746,566,746)
 c.setFillColor(accent); c.setFont('Bold',8.5); c.drawString(L,719,kicker.upper())
 titlep=Paragraph(title,ParagraphStyle('title',fontName='Serif',fontSize=24,leading=29,textColor=ink))
 return draw(titlep,704)-14

def footer(refs=[]):
 if refs:
  c.setFont('Body',7); c.setFillColor(muted); c.drawString(L,48,'Sources: '+', '.join('['+str(i)+']' for i in refs)+' • Full links in the source directory.')
 c.setStrokeColor(HexColor('#d7dfd7')); c.line(L,37,566,37)
 c.setFont('Body',7); c.setFillColor(muted); c.drawString(L,24,'PRACTICAL PREPARATION. ORDINARY PEOPLE.'); c.drawRightString(566,24,str(page_num).zfill(2))
 c.showPage()

def table(d):
 heads=d['headers']; n=len(heads)
 if n==3: widths=[110,205,205]
 elif n==4: widths=[166,91,91,172]
 elif n==5: widths=[147,63,63,63,184]
 else: widths=[140,CW-140]
 rows=[[p(html.escape(str(v)),'th') for v in heads]]+[[p(html.escape(str(v)),'cell') for v in row] for row in d['rows']]
 t=Table(rows,colWidths=widths,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ink),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,pale]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,0),0.4,ink)]));return t
# Cover
page_num=1
c.setFillColor(ink);c.rect(0,0,W,H,fill=1,stroke=0)
c.setStrokeColor(HexColor('#355b51'))
for radius in (75,145,215,285):c.circle(520,605,radius,fill=0,stroke=1)
c.setFillColor(HexColor('#e8c49d'));c.setFont('Bold',10);c.drawString(L,724,'BEGINNER QUICK START' if BEGINNER else 'THE HOUSEHOLD PREPAREDNESS GUIDE')
c.setFillColor(white);c.setFont('Serif',49);c.drawString(L,620,'Ready');c.drawString(L,562,'Together.')
c.setFont('Body',15);c.drawString(L,512,'A simple first kit. No usage calculations.' if BEGINNER else 'A practical plan for the people you care about.')
c.setFillColor(HexColor('#d9e7dd'));c.setFont('Body',11)
for i,t in enumerate(['Start with the essentials. Build at your own pace.', 'Know what you have, what you need and when to leave.']):c.drawString(L,467-i*19,t)
for i,(n,title,days) in enumerate([('01','CORE','72 HOURS'),('02','ADVANCED','14 DAYS'),('03','SUPER PREP','30 DAYS')]):
 x=L+i*178;c.setFillColor(HexColor('#284e45'));c.roundRect(x,273,164,113,10,fill=1,stroke=0);c.setFillColor(HexColor('#e8c49d'));c.setFont('Bold',10);c.drawString(x+14,360,n);c.setFillColor(white);c.setFont('Bold',11);c.drawString(x+14,328,title);c.setFont('Body',9);c.drawString(x+14,304,days)
c.setFillColor(white);c.setFont('Body',11);c.drawString(L,224,'1 adult  /  2 adults  /  full family  /  custom households')
c.setFillColor(HexColor('#c4d6ca'));c.setFont('Body',9)
for i,t in enumerate(['Checklists • Quantities • Regional modules • Printable worksheets', 'US edition  |  Version 1.1  |  November 16, 2026','General preparedness education. Follow current local emergency instructions.']):c.drawString(L,142-i*19,t)
c.showPage()
# contents
contents_y=header('A clear path from here','Find what you need')
contents_step=min(19,550/(len(chapters)+1))
for i,ch in enumerate(chapters):
 text=ch['title'];pn=i+3
 c.setFont('Body',9.4);c.setFillColor(ink);c.drawString(L,contents_y-13,text);c.setFillColor(muted);c.drawRightString(566,contents_y-13,str(pn));contents_y-=contents_step
c.setFont('Body',9.4);c.setFillColor(ink);c.drawString(L,contents_y-13,'Sources, assumptions and review notes');c.drawRightString(566,contents_y-13,str(len(chapters)+3))
footer()
for ch in chapters:
 c.bookmarkPage('chapter'+str(page_num+1));c.addOutlineEntry(ch['title'],'chapter'+str(page_num+1),level=0)
 y=header(ch['title'],ch['kicker']);y=draw(p(ch['intro'],'intro'),y)-10
 if 'table' in ch:y=draw(table(ch['table']),y)-10
 for s in ch.get('sections',[]):
  y=draw(p(s['title'],'h2'),y)-5
  if 'text' in s:y=draw(p(s['text']),y)-8
  for b in s.get('bullets',[]):y=draw(p('• '+b),y)-5
  if 'bullets'in s:y-=5
 for label in ch.get('form',[]):
  y=draw(p(label,'small'),y);c.setStrokeColor(HexColor('#bacac1'));c.line(L,y-13,566,y-13);y-=22
 if 'callout'in ch:
  q=p(ch['callout'],'callout');_,qh=q.wrap(CW-22,H)
  c.setFillColor(HexColor('#eadfcb'));c.roundRect(L,y-qh-22,CW,qh+16,5,fill=1,stroke=0);q.drawOn(c,L+11,y-qh-14);y-=qh+30
 page_bounds.append((page_num,round(y,2),ch['title']))
 if y<61:raise RuntimeError(f'Page overflow {page_num} {y}: {ch["title"]}')
 footer(ch.get('sources',[]))
for offset in range(0,len(sources),11):
 y=header('Sources & review notes' if offset==0 else 'Source directory, continued','Read the original guidance')
 if offset==0:
  y=draw(p('Sources were reviewed for this edition on November 16, 2026. Bracketed numbers identify the guidance behind safety-sensitive statements. Quantities, tier milestones, example menus, budget pacing and dashboard formulas include original planning assumptions; they are not official readiness standards.','body'),y)-12
 for s in sources[offset:offset+11]:
  y=draw(p(f'<b>[{s["id"]}] {html.escape(s["title"])}</b>','small'),y)-1
  y=draw(p(f'{s["use"]}. <link href="{html.escape(s["url"])}" color="#b66a3a">Open official source</link>','small'),y)-8
 if offset+11>=len(sources):
  y=draw(p('Editorial scope','h2'),y)-6
  y=draw(p('This guide focuses on practical civilian household preparedness. It is not a clinical treatment manual, building inspection or individualized engineering plan. Local instructions, product labels and professional care plans take precedence. Review sources and local arrangements before each hazard season.'),y)-8
  y=draw(p('Versioning','h2'),y)-6
  y=draw(p('Update the date and version when changing the guide or calculation assumptions. Keep formulas and examples synchronized. Share the blank materials freely with friends; keep completed household worksheets private.'),y)
 if y<61:raise RuntimeError(('sources overflow',y))
 footer()
c.save()
(ROOT/'docs'/('beginner-pdf-layout-check.json' if BEGINNER else 'pdf-layout-check.json')).write_text(json.dumps({'pages':page_num,'chapter_bottoms':page_bounds},indent=2))
print(f'{OUT}: {page_num} pages')
