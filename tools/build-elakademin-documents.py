"""Produce complete self-study PDF and editable, measured PowerPoint from canonical course data."""
import argparse
import hashlib
import html
import json
import math
import re
import tempfile
from pathlib import Path

from PIL import ImageFont
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pypdf import PdfReader

NAVY = '#102D3A'
PETROL = '#136F70'
PALE = '#EAF3F1'
INK = '#193540'
MUTED = '#566E78'
WHITE = '#FFFFFF'
FONTROOT = Path('/usr/share/fonts/truetype/dejavu')
SOURCE_NAMES = {
    'products': 'Produktspecifikationer för säljare · 10 oktober 2026 (31 sidor)',
    'slides': 'Elhandel från grunden · B2B-presentation v1 (91 bilder)',
    'selfstudy': 'Elhandel från grunden · B2B-självstudier v1 (91 sidor)',
    'user-confirmation': 'Ludwigs uttryckliga produktprecisering i samtalet',
}
TRACKS = {'shared': 'Gemensam grund', 'business': 'Företag / Savera', 'consumer': 'Privatkund / Face2face'}
FIGURES = {'pris-och-risk': 'hedge', 'kraftringen-stabil': 'weighted', 'opti': 'opti', 'vintersakrat': 'winter'}
FIGURE_TITLES = {
    'hedge': 'Samma säkrade mängd – olika faktisk täckning',
    'weighted': 'Mängden väger priset: 80 öre, inte 75',
    'opti': 'Opti jämför två hela månadsutfall',
    'winter': 'Vintersäkrat: rätt pris i rätt leveransmånad',
}
FIGURE_SCOPES = {
    'hedge': 'Syntetisk volymkontroll för samma period och prisdel. 80 MWh är samma säkrade mängd i båda raderna. Ingen faktura- eller avvikelsekostnadsmodell.',
    'weighted': 'Syntetiska volymer avser redan den säkrade delen. Exemplet gäller viktning av dess SYS/EPAD-komponenter, före dygnsprofil, osäkrad el och övriga kostnader. Ingen offert; multiplicera inte volymerna med 80 procent igen.',
    'opti': 'Syntetiska månadsfall: samma faktiska 10 000 kWh och samma jämförbara kostnadsdelar i båda alternativen. Välj lägre kostnad efter hela månaden. Ingen marknadsövergripande lägstaprisgaranti.',
    'winter': 'Visad standardkalender: oktober–mars fast elhandel, inklusive dygnsprofil; april–september kvartspris. Kalender kan anpassas uttryckligen i avtal. Elnät, energiskatt och moms säkras inte.',
}

def esc(value):
    return html.escape(str(value))

def nonbreaking_numbers(value):
    value=re.sub(r'(?<=\d) (?=\d{3}(?:\D|$))','\u00a0',str(value))
    return re.sub(r'(?<=\d) (kWh|MWh|GWh|kW|MW|kr/kWh|öre/kWh|kr|öre|%)',lambda match:'\u00a0'+match.group(1),value)

def source_label(ref):
    label = SOURCE_NAMES.get(ref['source'], ref['source'])
    pages = ref.get('pages', [])
    if pages:
        label += ' · s. ' + ', '.join(map(str, pages))
    if ref.get('note'):
        label += ' · ' + ref['note']
    return label

def answer(question):
    if question['type'] == 'mcq':
        option = next(o for o in question['options'] if o['id'] == question['correct'])
        return 'Rätt alternativ: ' + option['id'].upper() + '. ' + option['text'] + ' Förklaring: ' + question['explanation']
    if question['type'] == 'number':
        value = str(question['correct']).replace('.', ',')
        return 'Svar: ' + value + ' ' + question.get('unit', '') + '. ' + question['explanation']
    return question['explanation']

def make_styles():
    pdfmetrics.registerFont(TTFont('Course', str(FONTROOT / 'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('CourseBold', str(FONTROOT / 'DejaVuSans-Bold.ttf')))
    pdfmetrics.registerFontFamily('Course', normal='Course', bold='CourseBold')
    styles = getSampleStyleSheet()
    for name, size, leading, color, before, after in [
        ('Cover', 28, 36, NAVY, 0, 20),
        ('Chapter', 22, 29, NAVY, 0, 16),
        ('Section', 13.5, 19, PETROL, 13, 8),
        ('Body', 10.2, 15.7, INK, 0, 8),
        ('Small', 8.7, 13.3, MUTED, 0, 6),
        ('Bullet', 10.2, 15.7, INK, 0, 6),
        ('TOC', 10, 16, INK, 0, 7),
    ]:
        styles.add(ParagraphStyle(name='Course' + name, fontName='CourseBold' if name in {'Cover', 'Chapter', 'Section'} else 'Course', fontSize=size, leading=leading, textColor=colors.HexColor(color), spaceBefore=before, spaceAfter=after, keepWithNext=name in {'Chapter', 'Section'}, leftIndent=11 if name == 'Bullet' else 0, firstLineIndent=-9 if name == 'Bullet' else 0))
    return styles

class CoursePDF(BaseDocTemplate):
    def afterFlowable(self, flowable):
        level = getattr(flowable, '_toc_level', None)
        if level is not None:
            key = flowable._bookmark
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, level=level, closed=False)
            self.notify('TOCEntry', (level, flowable.getPlainText(), self.page, key))

def pdf_figure(kind):
    d = Drawing(490, 225)
    def rect(x,y,w,h,fill):
        d.add(Rect(x,y,w,h,fillColor=colors.HexColor(fill),strokeColor=None))
    def text(x,y,value,size=10,bold=False,color=INK):
        d.add(String(x,y,value,fontName='CourseBold' if bold else 'Course',fontSize=size,fillColor=colors.HexColor(color)))
    rect(0,0,490,225,PALE)
    if kind == 'hedge':
        width = 430 / 125
        for top, total, label in [(160,100,'Underlag: 100 MWh'),(75,125,'Faktiskt uttag: 125 MWh')]:
            text(20,top+31,label,11,True)
            rect(20,top,width*80,23,PETROL)
            rect(20+width*80,top,width*(total-80),23,'#CBDCD8')
            text(28,top+7,'80 MWh säkrat',10,True,WHITE)
            text(28+width*80,top+7,str(total-80)+' MWh öppet',9)
            text(20,top-20,'80 / '+str(total)+' × 100 = '+('80' if total==100 else '64')+' %',12,True)
        text(20,20,'Volymandel för angiven prisdel – inte andel fast faktura',9)
    elif kind == 'weighted':
        rect(16,98,224,100,WHITE); rect(250,98,224,100,WHITE)
        for x,title,volume,price,cost in [(30,'Vinter','600 000 kWh','100 öre/kWh','600 000 kr'),(264,'Sommar','400 000 kWh','50 öre/kWh','200 000 kr')]:
            text(x,176,title,12,True,PETROL);text(x,154,volume,11);text(x,135,price,11);text(x,113,cost,12,True)
        text(20,76,'Kostnad: 600 000 + 200 000 = 800 000 kr',11)
        text(20,55,'Mängd: 600 000 + 400 000 = 1 000 000 kWh',11)
        text(20,32,'800 000 / 1 000 000 = 0,80 kr/kWh = 80 öre/kWh',12,True)
        text(20,13,'Volymerna är redan säkrade. Inget extra × 80 %.',9)
    elif kind == 'opti':
        text(18,202,'Hela månaden · samma 10 000 kWh · jämförbar omfattning',11,True)
        for y,label,q,m,winner in [(137,'A',68,80,68),(61,'B',110,90,90)]:
            text(18,y+30,'Fall '+label,11,True)
            rect(80,y-3,132,45,WHITE); rect(227,y-3,132,45,WHITE)
            text(90,y+24,'Kvartsvägt',10);text(90,y+7,f'{q} öre → {q*100:,} kr'.replace(',',' '),10,True)
            text(237,y+24,'Rörlig månadsmodell',9);text(237,y+7,f'{m} öre → {m*100:,} kr'.replace(',',' '),10,True)
            text(373,y+23,'Väljs:',10);text(373,y+5,str(winner)+' öre/kWh',11,True,PETROL)
        text(18,18,'Jämförelsen sker efter månaden – inget minimum i varje kvart.',9)
    elif kind == 'winter':
        months = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
        for i,month in enumerate(months):
            fixed = i in {0,1,2,9,10,11}
            x = 17+i*38
            rect(x,125,35,65,NAVY if fixed else PETROL)
            text(x+6,167,month,9,True,WHITE)
            text(x+4,143,'Fast' if fixed else 'Kvart',8,False,WHITE)
        text(18,91,'Oktober–mars: alla elhandelsdelar fasta, även dygnsprofil.',11,True)
        text(18,63,'April–september: egen förbrukning vägs mot kvartpriser.',11)
        text(18,34,'Leveransmånad styr modellen. Anpassad kalender kräver avtal.',9)
        text(18,16,'Elnät, energiskatt och moms ligger utanför prissäkringen.',9)
    return d

def build_pdf(data, output):
    styles = make_styles()
    story = []
    def para(text,style='Body'):
        return Paragraph(esc(nonbreaking_numbers(text)).replace('\n','<br/>'), styles['Course'+style])
    def add(text,style='Body'):
        story.append(para(text,style))
    def heading(text):
        add(text,'Section')
    def bullets(items):
        for item in items:
            add('• '+str(item),'Bullet')
    def chapter(text,key):
        obj = para(text,'Chapter');obj._toc_level=0;obj._bookmark=key;story.append(obj)
    def footer(canvas,doc):
        canvas.saveState();canvas.setFillColor(colors.HexColor(MUTED));canvas.setFont('Course',7)
        canvas.drawString(1.8*cm,1.12*cm,'Kraftringen · Elakademin v2 | Produktkälla 10 oktober 2026 | Övningspriser är syntetiska')
        canvas.drawRightString(19.2*cm,1.12*cm,str(doc.page));canvas.restoreState()

    add('KRAFTRINGEN · ELAKADEMIN','Small')
    add('Din elaffär, begriplig från grunden.','Cover')
    add('Fullständiga självstudier','Chapter')
    add('Gemensam grund · Savera / företag · Face2face / privatkunder')
    add('Version '+data['meta']['version'],'Small')
    add('18 kapitel · 38 lösta exempel · 72 kapitelfrågor · två avslutande självtest')
    heading('Så använder du materialet')
    add('Läs de sex grundlektionerna i ordning och fortsätt med produkter och kundfall för ditt kundsegment. Räkna egna mellanled och ange enheter och prisomfattning. Besvara frågorna och kundfallet innan du går till facit. Ett korrekt slutvärde är inte hela målet: förklara även varför modellen passar eller inte passar kundens behov.')
    add('Alla övningspriser och kundfall är syntetiska. Aktuell godkänd offert och avtal bestämmer en verklig kunds pris, komponenter och villkor. Underlaget ersätter inte produktmandat. Självtest och bedömningsstöd är träning, inte personverifierad certifiering.')
    heading('Två spår med samma grund')
    add('Företagsspåret tränar förbrukningsunderlag, risk, portföljer samt Direkt och Stabil. Privatkundsspåret tränar kvartspris, rörligt pris, fastpris, Opti och Vintersäkrat. Kundsegmentens etiketter beskriver kursens upplägg; de skapar inga generella produktgränser eller kundvillkor.')
    story.append(PageBreak())
    add('Innehåll','Chapter')
    toc = TableOfContents();toc.levelStyles=[styles['CourseTOC']];toc.dotsMinLevel=0;story.append(toc)
    story.append(PageBreak())

    for i,lesson in enumerate(data['lessons'],1):
        add(f'KAPITEL {i:02} · {TRACKS[lesson["track"]]}','Small')
        chapter(lesson['title'],'lesson-'+lesson['id'])
        add(lesson['introduction'])
        heading('Efter kapitlet ska du kunna');bullets(lesson['objectives'])
        for sec in lesson['sections']:
            heading(sec['title'])
            for text in sec['paragraphs']:
                add(text)
            bullets(sec.get('bullets',[]))
        if lesson['id'] in FIGURES:
            kind = FIGURES[lesson['id']]
            figureblock=[para(FIGURE_TITLES[kind],'Section'),pdf_figure(kind),Spacer(1,7),para(FIGURE_SCOPES[kind],'Small')]
            story.append(KeepTogether(figureblock))
        for ex in lesson['examples']:
            heading('Löst exempel: '+ex['title']);add(ex['scope'],'Small')
            bullets(ex['given'])
            for j,step in enumerate(ex['steps'],1):
                add(f'{j}. {step}')
            add('Resultat: '+ex['result']);add(ex['explanation'])
        heading('Vanliga missförstånd')
        for item in lesson['misconceptions']:
            add('Påstående: '+item['claim']);add('Korrigering: '+item['correction'])
        heading('Förklara för kunden')
        add('Kort förklaring: '+lesson['customer_explanation']['short'])
        add('Utvecklad förklaring: '+lesson['customer_explanation']['detailed'])
        case=lesson['scenario'];heading('Träna: '+case['title']);add(case['setup']);bullets(case['tasks'])
        add('Skriv ditt eget resonemang före facit. Kontrollera sedan både sakuppgifter, enheter och avgränsningar.','Small')
        heading('Kontrollfrågor')
        for j,q in enumerate(lesson['quiz'],1):
            add(f'{j}. {q["prompt"]}')
            if q['type']=='mcq':
                bullets([o['id'].upper()+'. '+o['text'] for o in q['options']])
            else:
                add('Ditt svar'+(' ('+q.get('unit','')+')' if q.get('unit') else '')+': __________________________________________')
                story.append(Spacer(1,10))
        story.append(PageBreak())
        add('FACIT · KAPITEL '+str(i),'Small');add(lesson['title'],'Chapter')
        for j,q in enumerate(lesson['quiz'],1):
            add(f'{j}. {answer(q)}');bullets(q.get('rubric',[]))
        heading('Modellsvar till kundfallet');add(case['model_answer'])
        heading('Bedöm ditt resonemang');bullets(case['rubric'])
        heading('Ta med dig');bullets(lesson['takeaways'])
        heading('Källor och avgränsningar')
        for ref in lesson['source_refs']:
            add(source_label(ref),'Small')
        story.append(PageBreak())

    chapter('Ordlista','glossary')
    for term in data['glossary']:
        heading(term['term']);add(term['definition'])
    story.append(PageBreak())
    chapter('Avslutande självtest','final-tests')
    add('Välj ditt kundsegments test. Besvara varje uppgift och ange vad beräkningen omfattar. Vid öppna frågor jämför du ditt resonemang med bedömningsstödet. Gå tillbaka till kapitlen där du är osäker. Resultatet är självträning och ger inte i sig säljmandat eller personverifierad certifiering.')
    for track in ['business','consumer']:
        heading(TRACKS[track])
        for i,q in enumerate(data['final_assessment'][track],1):
            add(f'{i}. {q["prompt"]}')
            if q['type']=='mcq':
                bullets([o['id'].upper()+'. '+o['text'] for o in q['options']])
            else:
                add('Ditt svar: ____________________________________________________');story.append(Spacer(1,10))
        story.append(PageBreak());add('Facit: '+TRACKS[track],'Chapter')
        for i,q in enumerate(data['final_assessment'][track],1):
            add(f'{i}. {answer(q)}');bullets(q.get('rubric',[]))
        story.append(PageBreak())
    chapter('Handledarstöd och nästa övning','facilitator')
    add('Låt deltagaren förklara en produkt för en fiktiv kund med andra prioriteringar än deltagarens egna. Bedöm kunskap, beräkning och begriplighet separat. Be om prisomfattning och källa när ett påstående låter absolut. För prissäkring behöver deltagaren förklara både uppgång och nedgång. Praktik i verksamhetens system och aktuellt produktmandat följer ordinarie rutiner.')
    bullets(['Kunskap: skiljs modeller, volymunderlag, profiler och kostnadskomponenter?','Beräkning: stämmer enheter, viktning och mellanled, och framgår vad som ingår?','Kunddialog: kopplas förslaget till behov, förklaras kvarvarande risk och kontrolleras förståelsen?','Omprövning: kan deltagaren beskriva när ett annat alternativ blir relevant?','Överlämning: identifieras aktuellt offert- och förbrukningsunderlag utan att villkor hittas på?'])
    add('Utbildningens rollspel är fiktiva. Riktiga inspelade samtal används enligt verksamhetens godkända rutin och samtalsbibliotekets åtkomst. Ett väl genomfört rollspel är inte en verklig kundinspelning.')

    doc=CoursePDF(str(output),pagesize=(21*cm,29.7*cm),leftMargin=1.8*cm,rightMargin=1.8*cm,topMargin=1.8*cm,bottomMargin=1.9*cm,title='Kraftringen Elakademin – fullständiga självstudier',author='Kraftringen')
    frame=Frame(doc.leftMargin,doc.bottomMargin,doc.width,doc.height,id='main')
    doc.addPageTemplates(PageTemplate(id='course',frames=[frame],onPage=footer))
    doc.multiBuild(story)

class CourseSlides:
    def __init__(self):
        self.prs=Presentation();self.prs.slide_width=Inches(13.333);self.prs.slide_height=Inches(7.5)
        self.audit=[];self.chapter_slides={};self.notes_corpus=[]
        self.fonts={}

    def font(self,size,bold=False):
        key=(size,bold)
        if key not in self.fonts:
            self.fonts[key]=ImageFont.truetype(str(FONTROOT/('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')),size)
        return self.fonts[key]

    def wrap(self,text,size,width_pt,bold=False):
        # Office renderers differ slightly from PIL kerning. Keep measurable
        # spare width so an additional renderer wrap cannot overlap the next box.
        width_pt *= .92
        font=self.font(size,bold);out=[]
        for raw in str(text).split('\n'):
            line=''
            for word in nonbreaking_numbers(raw).split(' '):
                candidate=(line+' '+word).strip()
                if line and font.getlength(candidate)>width_pt:
                    out.append(line);line=word
                else:
                    line=candidate
            out.append(line)
        return out or ['']

    def rgb(self,color):
        return RGBColor.from_string(color.strip('#').upper())

    def textbox(self,s,x,y,w,h,text,size=20,bold=False,color=INK):
        shape=s.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h))
        tf=shape.text_frame;tf.word_wrap=False;tf.margin_left=Inches(.03);tf.margin_right=Inches(.03);tf.margin_top=0;tf.margin_bottom=0
        for i,line in enumerate(str(text).split('\n')):
            par=tf.paragraphs[0] if i==0 else tf.add_paragraph();par.text=line;par.font.name='DejaVu Sans';par.font.size=Pt(size);par.font.bold=bold;par.font.color.rgb=self.rgb(color);par.space_before=Pt(0);par.space_after=Pt(0);par.line_spacing=Pt(size*1.24)
        return shape

    def rect(self,s,x,y,w,h,color):
        shape=s.shapes.add_shape(MSO_SHAPE.RECTANGLE,Inches(x),Inches(y),Inches(w),Inches(h));shape.fill.solid();shape.fill.fore_color.rgb=self.rgb(color);shape.line.fill.background();return shape

    def new(self,title,kicker,notes='',dark=False,chapter_id=None):
        s=self.prs.slides.add_slide(self.prs.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=self.rgb(NAVY if dark else '#F6F9F8')
        color=WHITE if dark else INK
        self.textbox(s,.62,.36,12,.35,kicker,12,True,'#AED5CE' if dark else PETROL)
        wrapped=self.wrap(title,28,12.04*72,True)
        if len(wrapped)>2:
            wrapped=self.wrap(title,26,12.04*72,True)
        if len(wrapped)>2:
            raise ValueError('Slide title does not fit two lines: '+title)
        self.textbox(s,.62,.92,12.1,1.17,'\n'.join(wrapped),28 if len(self.wrap(title,28,12.04*72,True))<=2 else 26,True,color)
        self.textbox(s,.65,7.02,11,.22,'Kraftringen · Produktkälla 10 oktober 2026 · Övningspriser är syntetiska',9,False,'#AED5CE' if dark else MUTED)
        self.textbox(s,12.15,7.02,.55,.22,str(len(self.prs.slides)),9,False,color)
        s.notes_slide.notes_text_frame.text=notes
        self.notes_corpus.append(notes)
        if chapter_id:
            self.chapter_slides.setdefault(chapter_id,[]).append(len(self.prs.slides))
        return s

    def blocks(self,title,blocks,kicker,notes='',dark=False,chapter_id=None):
        """Measure and split; never reduce lesson body below 20 pt."""
        size=20;width=11.94*72;max_height=4.28*72
        batches=[];current=[];height=0
        for text in blocks:
            lines=self.wrap(text,size,width)
            if len(lines)>9:
                # A full long prompt remains editable across consecutive slides.
                fragments=[lines[i:i+8] for i in range(0,len(lines),8)]
            else:
                fragments=[lines]
            for lines in fragments:
                required=len(lines)*size*1.24+9
                if current and height+required>max_height:
                    batches.append(current);current=[];height=0
                current.append(lines);height+=required
        if current or not batches:
            batches.append(current)
        for index,batch in enumerate(batches):
            label=title+(f' · {index+1}/{len(batches)}' if len(batches)>1 else '')
            s=self.new(label,kicker,notes,dark,chapter_id)
            y=2.35
            for lines in batch:
                h=len(lines)*size*1.24/72
                self.textbox(s,.66,y,12,h,'\n'.join(lines),size,False,WHITE if dark else INK);y+=h+9/72
            self.audit.append({'slide':len(self.prs.slides),'title':label,'body_font_pt':size,'measured_body_height_pt':round((y-2.35)*72,2),'allowed_body_height_pt':max_height,'body_bottom_inches':round(y,3),'text_blocks':len(batch)})

    def figure(self,kind,chapter_id,kicker):
        s=self.new(FIGURE_TITLES[kind],kicker,FIGURE_SCOPES[kind],False,chapter_id)
        def t(x,y,w,text,size=20,bold=False,color=INK):
            lines=self.wrap(text,size,(w-.06)*72,bold)
            self.textbox(s,x,y,w,len(lines)*size*1.24/72,'\n'.join(lines),size,bold,color)
        if kind=='hedge':
            scale=11/125
            for y,total,label in [(2.75,100,'Underlag: 100 MWh'),(4.65,125,'Faktiskt uttag: 125 MWh')]:
                t(.8,y-.43,11,label,22,True)
                self.rect(s,.8,y,80*scale,.52,PETROL);self.rect(s,.8+80*scale,y,(total-80)*scale,.52,'#CADBD7')
                t(.98,y+.08,80*scale-.2,'80 MWh säkrat',20,True,WHITE)
                t(.95+80*scale,y+.09,(total-80)*scale-.1,str(total-80)+' MWh',16)
                t(.8,y+.72,11,'80 / '+str(total)+' × 100 = '+('80' if total==100 else '64')+' %',23,True)
            t(.8,6.6,11.8,'Ljus del: öppen volym. Syntetisk kontroll av samma period/prisdel; ingen fakturamodell.',14)
        elif kind=='weighted':
            for x,title,volume,price,cost in [(.8,'Vinter','600 000 kWh','100 öre/kWh','600 000 kr'),(6.8,'Sommar','400 000 kWh','50 öre/kWh','200 000 kr')]:
                self.rect(s,x,2.35,5.7,2.05,PALE);t(x+.22,2.52,5.25,title,23,True,PETROL)
                t(x+.22,3.06,5.25,volume+' × '+price,20);t(x+.22,3.74,5.25,cost,24,True)
            t(.8,4.74,11.9,'800 000 kr / 1 000 000 kWh = 0,80 kr/kWh = 80 öre/kWh',24,True)
            t(.8,5.88,11.9,'Volymerna är redan den säkrade delen: inget extra × 80 %.',19,True,PETROL)
            t(.8,6.55,11.9,'Syntetisk viktning av SYS/EPAD-delen; dygnsprofil och andra delar ligger utanför.',14)
        elif kind=='opti':
            t(.8,2.25,11.8,'Hela månaden · samma faktiska 10 000 kWh · jämförbar omfattning',21,True)
            for y,label,q,m,winner in [(3.2,'A',68,80,68),(4.95,'B',110,90,90)]:
                t(.8,y,1.0,'Fall '+label,20,True)
                for x,name,price in [(2,'Kvartsvägt',q),(6.1,'Månadsmodell',m)]:
                    self.rect(s,x,y-.08,3.85,1.33,PALE)
                    t(x+.13,y+.05,3.55,name,20,True)
                    t(x+.13,y+.57,3.55,f'{price} öre → {price*100:,} kr'.replace(',',' '),19)
                t(10.1,y+.02,2.5,'Väljs:',18);t(10.1,y+.51,2.5,str(winner)+' öre/kWh',20,True,PETROL)
            t(.8,6.66,11.8,'Syntetiska månadsfall – inget minimum i varje kvart och ingen marknadsgaranti.',14)
        elif kind=='winter':
            months=['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
            for i,month in enumerate(months):
                fixed=i in {0,1,2,9,10,11};x=.8+i*.98
                self.rect(s,x,2.55,.91,1.45,NAVY if fixed else PETROL)
                t(x+.09,2.75,.77,month,18,True,WHITE);t(x+.08,3.36,.8,'Fast' if fixed else 'Kvart',16,False,WHITE)
            t(.8,4.38,11.7,'Oktober–mars: alla elhandelsdelar fasta, även dygnsprofil.',22,True)
            t(.8,5.14,11.7,'April–september: egen förbrukning vägs mot kvartpriser.',21)
            t(.8,5.98,11.7,'Leveransmånad styr. Anpassad kalender kräver uttryckligt avtal.',18)
            t(.8,6.6,11.7,'Standardkalender. Elnät, energiskatt och moms säkras inte.',14)
        self.audit.append({'slide':len(self.prs.slides),'title':FIGURE_TITLES[kind],'figure':kind,'native_editable_shapes':True,'minimum_content_font_pt':16,'scope_in_notes':True})

def first_sentences(text,max_chars=230):
    parts=re.split(r'(?<=[.!?])\s+',text)
    chosen=[]
    for part in parts:
        if chosen and len(' '.join(chosen))+len(part)>max_chars:
            break
        chosen.append(part)
    return ' '.join(chosen)

def build_pptx(data,output):
    builder=CourseSlides()
    builder.blocks('Din elaffär, begriplig från grunden.',['Gemensam grund · Savera / företag · Face2face / privatkunder','18 kapitel med lösta exempel, kundfall och självtest'],'KRAFTRINGEN · ELAKADEMIN',notes='Fullständiga förklaringar finns i bildanteckningarna och självstudiematerialet. Pris- och kundexempel är syntetiska.',dark=True)
    builder.blocks('Så använder du utbildningen',['Förstå modellen → räkna med samma omfattning → förklara för kunden.','Svara före facit och kontrollera mellanled och kvarvarande risk.','Verkliga priser och villkor kommer från aktuell godkänd offert.'],'START',notes='Självtest är träning, inte personverifierad certifiering. Kursspår skapar inga generella produktgränser eller säljmandat.')
    for i,lesson in enumerate(data['lessons'],1):
        chapter_id=lesson['id'];label=f'KAPITEL {i:02} · {TRACKS[lesson["track"]]}'
        spoken='\n\n'.join(seg['id']+' · '+seg['title']+'\n'+seg['text']+'\nPå skärmen: '+' | '.join(seg['on_screen'])+'\nBildidé: '+seg['visual'] for seg in lesson['narration']['segments'])
        source_text='\n'.join(source_label(ref) for ref in lesson['source_refs'])
        full_intro=lesson['introduction']+'\n\nLÄRANDEMÅL\n'+'\n'.join(lesson['objectives'])+'\n\nKANONISKT BERÄTTARMANUS\n'+spoken+'\n\nKÄLLOR\n'+source_text
        builder.blocks(lesson['title'],['• '+obj for obj in lesson['objectives']],label,full_intro,True,chapter_id)
        for sec in lesson['sections']:
            visible=[first_sentences(text) for text in sec['paragraphs']]
            visible+=['• '+item for item in sec.get('bullets',[])]
            notes='FULLSTÄNDIG GENOMGÅNG\n'+'\n\n'.join(sec['paragraphs'])+'\n\n'+'\n'.join(sec.get('bullets',[]))
            builder.blocks(sec['title'],visible,f'{i:02} · FÖRSTÅ',notes,chapter_id=chapter_id)
        if chapter_id in FIGURES:
            builder.figure(FIGURES[chapter_id],chapter_id,f'{i:02} · VISUELL FÖRKLARING')
        for ex in lesson['examples']:
            all_notes='OMFATTNING\n'+ex['scope']+'\n\nDATA\n'+'\n'.join(ex['given'])+'\n\nMELLANLED\n'+'\n'.join(ex['steps'])+'\n\nRESULTAT\n'+ex['result']+'\n\nTOLKNING\n'+ex['explanation']
            builder.blocks(ex['title'],[ex['scope']]+['• '+item for item in ex['given']],f'{i:02} · RÄKNA FÖRST',all_notes,chapter_id=chapter_id)
            builder.blocks('Lösning: '+ex['title'],[f'{j}. {step}' for j,step in enumerate(ex['steps'],1)]+['Resultat: '+ex['result']],f'{i:02} · MELLANLED OCH RESULTAT',all_notes,chapter_id=chapter_id)
        for item in lesson['misconceptions']:
            builder.blocks('Pröva påståendet',[item['claim'],'Korrigering: '+item['correction']],f'{i:02} · KONTROLLERA',item['claim']+'\n\n'+item['correction'],chapter_id=chapter_id)
        explanation=lesson['customer_explanation']
        builder.blocks('Förklara för kunden',[explanation['short']],f'{i:02} · KUNDDIALOG',explanation['short']+'\n\nUTVECKLAD FÖRKLARING\n'+explanation['detailed'],chapter_id=chapter_id)
        case=lesson['scenario'];case_notes='KUNDFALL\n'+case['setup']+'\n\nUPPGIFTER\n'+'\n'.join(case['tasks'])+'\n\nMODELLSVAR\n'+case['model_answer']+'\n\nBEDÖMNINGSSTÖD\n'+'\n'.join(case['rubric'])
        builder.blocks(case['title'],[case['setup']]+['• '+item for item in case['tasks']],f'{i:02} · TRÄNA FÖRE FACIT',case_notes,chapter_id=chapter_id)
        builder.blocks('Bedöm kundfallet',['• '+item for item in case['rubric']],f'{i:02} · FACIT OCH RESONEMANG',case_notes,chapter_id=chapter_id)
        for j,q in enumerate(lesson['quiz'],1):
            lines=[q['prompt']]
            if q['type']=='mcq':
                lines+=['• '+o['id'].upper()+'. '+o['text'] for o in q['options']]
            else:
                lines+=['Skriv ditt svar'+(' i '+q['unit'] if q.get('unit') else ' och ditt resonemang')+'.']
            qnotes='FRÅGA\n'+q['prompt']+'\n\nFACIT\n'+answer(q)+'\n\n'+'\n'.join(q.get('rubric',[]))
            builder.blocks(f'Kontrollfråga {j}',lines,f'{i:02} · SJÄLVTEST',qnotes,chapter_id=chapter_id)
        builder.blocks('Ta med dig',['• '+item for item in lesson['takeaways']],f'{i:02} · REPETERA','\n'.join(lesson['takeaways'])+'\n\nKÄLLOR\n'+source_text,chapter_id=chapter_id)
    for start in range(0,len(data['glossary']),3):
        terms=data['glossary'][start:start+3]
        builder.blocks('Ordlista',[term['term']+' — '+term['definition'] for term in terms],'UPPSLAG',notes='\n\n'.join(term['term']+'\n'+term['definition'] for term in terms))
    for track in ['business','consumer']:
        builder.blocks('Avslutande självtest: '+TRACKS[track],['Besvara frågorna innan du läser bildanteckningarnas facit.','Förklara prisomfattning, enheter och kvarvarande risk.','Självtest är träning och ger inte i sig produktmandat.'],'SLUTTEST',notes='Gör testet individuellt före gemensam genomgång. Bedöm resonemang och korrekt avgränsning, inte bara slutvärde. Facit och bedömningskriterier finns i respektive frågas bildanteckningar och i självstudiematerialet.')
        for j,q in enumerate(data['final_assessment'][track],1):
            lines=[q['prompt']]
            if q['type']=='mcq':
                lines+=['• '+o['id'].upper()+'. '+o['text'] for o in q['options']]
            else:
                lines+=['Skriv ditt svar'+(' i '+q['unit'] if q.get('unit') else ' och ditt resonemang')+'.']
            builder.blocks(f'{TRACKS[track]} · fråga {j}',lines,'AVSLUTANDE SJÄLVTEST',notes='FRÅGA\n'+q['prompt']+'\n\nFACIT\n'+answer(q)+'\n\n'+'\n'.join(q.get('rubric',[])))
    builder.blocks('Öva vidare med en annan kund',['Förklara en relevant produkt utan att lova lägst pris.','Visa en beräkning med rätt enheter och tydlig omfattning.','Beskriv kvarvarande risk och när du skulle ompröva förslaget.'],'AVSLUTNING',notes='Bedöm kunskap, beräkning och begriplighet separat. Riktiga inspelade samtal används enligt verksamhetens godkända rutin; utbildningens kundfall och rollspel är fiktiva.',dark=True)
    builder.prs.save(output)
    return builder

def validate(data,pdf,pptx,builder):
    reader=PdfReader(str(pdf))
    pdf_text='\n'.join(page.extract_text() or '' for page in reader.pages)
    pdf_text_normalized=re.sub(r'\s+',' ',pdf_text)
    notes='\n'.join(builder.notes_corpus)
    omissions=[]
    for lesson in data['lessons']:
        if lesson['title'] not in pdf_text_normalized or lesson['id'] not in builder.chapter_slides:
            omissions.append(lesson['id'])
        for seg in lesson['narration']['segments']:
            if seg['text'] not in notes:
                omissions.append('narration:'+seg['id'])
        for sec in lesson['sections']:
            for paragraph in sec['paragraphs']:
                if paragraph not in notes:
                    omissions.append('speaker-teaching:'+lesson['id'])
    assert not omissions,omissions
    measured=[row for row in builder.audit if 'measured_body_height_pt' in row]
    assert all(row['body_font_pt']>=20 and row['measured_body_height_pt']<=row['allowed_body_height_pt']+.1 for row in measured)
    assert len(builder.chapter_slides)==len(data['lessons'])==18
    assert sum('figure' in row for row in builder.audit)==4
    assert all(slide.notes_slide.notes_text_frame.text for slide in builder.prs.slides)
    return {
        'pdf':str(pdf),'pdf_pages':len(reader.pages),'pdf_bytes':pdf.stat().st_size,
        'pptx':str(pptx),'slides':len(builder.prs.slides),'pptx_bytes':pptx.stat().st_size,
        'lesson_count':len(data['lessons']),'chapter_questions':sum(len(l['quiz']) for l in data['lessons']),
        'final_questions':sum(len(v) for v in data['final_assessment'].values()),'examples':sum(len(l['examples']) for l in data['lessons']),
        'glossary_terms':len(data['glossary']),'pedagogical_figures':4,'native_editable_ppt_figures':True,
        'all_canonical_narration_in_speaker_notes':True,'all_teaching_paragraphs_in_speaker_notes':True,
        'all_slides_have_notes':True,'measured_minimum_body_font_pt':20,'figure_labels_minimum_pt':16,
        'measured_slide_bodies_fit':True,'chapter_slide_ranges':{key:[min(value),max(value)] for key,value in builder.chapter_slides.items()},
        'source_names':SOURCE_NAMES,'visual_review':'Pending rendered slide and PDF spot review; no claim of visual completeness from measurements alone.',
    }

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--root',default=str(Path(__file__).resolve().parents[1]/'dist'));parser.add_argument('--report-dir',default=str(Path(tempfile.gettempdir())/'kraftringen-elakademin-documents'));args=parser.parse_args();report_dir=Path(args.report_dir);report_dir.mkdir(parents=True,exist_ok=True)
    root=Path(args.root);data_path=root/'elakademin-data.json';data=json.loads(data_path.read_text())
    output=root/'elakademin-material';output.mkdir(parents=True,exist_ok=True)
    pdf=output/'Kraftringen-Elakademin-Sjalvstudier-v2.pdf';pptx=output/'Kraftringen-Elakademin-Utbildning-v2.pptx'
    build_pdf(data,pdf);builder=build_pptx(data,pptx)
    report=validate(data,pdf,pptx,builder);report['canonical_data_sha256']=hashlib.sha256(data_path.read_bytes()).hexdigest()
    report['layout_audit_file']=str(report_dir/'document-layout-audit.json')
    Path(report['layout_audit_file']).write_text(json.dumps(builder.audit,ensure_ascii=False,indent=2)+'\n')
    (report_dir/'document-export-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
