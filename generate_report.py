#!/usr/bin/env python3
"""
Tagybasqa — Ашық сабақ есебі генераторы
Generates a professional PDF report for an open lesson session.
Usage: python3 generate_report.py '<json_data>'
"""

import sys, json, os
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Fonts ────────────────────────────────────────────────────
FONT_REG  = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

pdfmetrics.registerFont(TTFont('DJ',     FONT_REG))
pdfmetrics.registerFont(TTFont('DJBold', FONT_BOLD))
pdfmetrics.registerFont(TTFont('DJMono', FONT_MONO))

# ── Colors ───────────────────────────────────────────────────
C_BG      = colors.HexColor('#0d1117')
C_BLUE    = colors.HexColor('#1cb0f6')
C_GREEN   = colors.HexColor('#57cc02')
C_GOLD    = colors.HexColor('#ffd900')
C_PURPLE  = colors.HexColor('#9b5de5')
C_RED     = colors.HexColor('#ff4b4b')
C_ORANGE  = colors.HexColor('#ff9600')
C_DARK    = colors.HexColor('#1a2d35')
C_BORDER  = colors.HexColor('#2d3f4a')
C_TEXT    = colors.HexColor('#1a2d35')
C_TEXT2   = colors.HexColor('#4a6070')
C_WHITE   = colors.white

# ── Styles ───────────────────────────────────────────────────
def make_styles():
    s = {}
    s['cover_title'] = ParagraphStyle('cover_title',
        fontName='DJBold', fontSize=28, textColor=C_WHITE,
        alignment=TA_CENTER, spaceAfter=6*mm, leading=34)
    s['cover_sub'] = ParagraphStyle('cover_sub',
        fontName='DJ', fontSize=14, textColor=colors.HexColor('#8bb0c0'),
        alignment=TA_CENTER, spaceAfter=3*mm)
    s['cover_badge'] = ParagraphStyle('cover_badge',
        fontName='DJMono', fontSize=9, textColor=colors.HexColor('#6090a0'),
        alignment=TA_CENTER, spaceAfter=2*mm)
    s['section'] = ParagraphStyle('section',
        fontName='DJBold', fontSize=13, textColor=C_BLUE,
        spaceBefore=6*mm, spaceAfter=3*mm)
    s['body'] = ParagraphStyle('body',
        fontName='DJ', fontSize=10, textColor=C_TEXT,
        spaceAfter=2*mm, leading=16)
    s['body2'] = ParagraphStyle('body2',
        fontName='DJ', fontSize=9, textColor=C_TEXT2,
        spaceAfter=1.5*mm, leading=14)
    s['mono'] = ParagraphStyle('mono',
        fontName='DJMono', fontSize=8.5, textColor=C_TEXT2,
        spaceAfter=1*mm)
    s['label'] = ParagraphStyle('label',
        fontName='DJMono', fontSize=8, textColor=C_TEXT2,
        spaceAfter=1*mm, spaceBefore=2*mm)
    s['rank'] = ParagraphStyle('rank',
        fontName='DJBold', fontSize=10, textColor=C_TEXT,
        spaceAfter=1*mm)
    return s

# ── Helpers ──────────────────────────────────────────────────
def bar_table(pct, color=C_BLUE, width=80*mm):
    fill = max(0.01, pct/100)
    data = [['']]
    col_w = [width * fill, width * (1-fill)] if fill < 1 else [[width]]
    if fill >= 1:
        col_w = [width]
        data  = [['']]
    tbl = Table(data, colWidths=col_w, rowHeights=[4*mm])
    bg = C_DARK if fill < 1 else color
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), color),
        ('ROUNDEDCORNERS', [2]),
        ('BOX', (0,0), (-1,-1), 0, colors.transparent),
    ]))
    # Wrap in a full-width container
    container_data = [[tbl, '']]
    container = Table([[tbl]], colWidths=[width], rowHeights=[4*mm])
    container.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e8eef2')),
        ('BOX', (0,0), (-1,-1), 0, colors.transparent),
        ('INNERGRID', (0,0), (-1,-1), 0, colors.transparent),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [2]),
    ]))
    return container

def stat_table(stats):
    """Stats grid: list of (label, value, color) tuples."""
    n = len(stats)
    col_w = [40*mm] * min(n, 4)
    row = []
    for lbl, val, clr in stats[:4]:
        cell = Table([
            [Paragraph(str(val), ParagraphStyle('sv', fontName='DJBold', fontSize=18,
                textColor=clr, alignment=TA_CENTER))],
            [Paragraph(lbl, ParagraphStyle('sl', fontName='DJMono', fontSize=7,
                textColor=C_TEXT2, alignment=TA_CENTER))]
        ], colWidths=[38*mm])
        cell.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 0.5, C_BORDER),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f4f7fa')),
            ('ROUNDEDCORNERS', [6]),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        row.append(cell)
    tbl = Table([row], colWidths=col_w, hAlign='LEFT')
    tbl.setStyle(TableStyle([
        ('LEFTPADDING',  (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING',   (0,0), (-1,-1), 0),
        ('BOTTOMPADDING',(0,0), (-1,-1), 0),
    ]))
    return tbl


# ── Cover page ───────────────────────────────────────────────
def build_cover(story, data, st):
    # Full-width dark header
    header = Table([['']], colWidths=[170*mm], rowHeights=[60*mm])
    header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_DARK),
        ('BOX', (0,0), (-1,-1), 0, colors.transparent),
    ]))
    story.append(header)

    # Overlay title on top (place as separate elements after)
    story.append(Spacer(1, -55*mm))  # pull up

    story.append(Paragraph('АШЫҚ САБАҚ ЕСЕБІ', ParagraphStyle('ct',
        fontName='DJMono', fontSize=9, textColor=colors.HexColor('#5090a8'),
        alignment=TA_CENTER, spaceAfter=2*mm)))
    story.append(Paragraph(data.get('lessonTitle', 'Сабақ'), ParagraphStyle('ct2',
        fontName='DJBold', fontSize=22, textColor=C_WHITE,
        alignment=TA_CENTER, spaceAfter=3*mm, leading=28)))
    story.append(Paragraph(data.get('sessionName', ''), ParagraphStyle('cs',
        fontName='DJ', fontSize=11, textColor=colors.HexColor('#8bb0c0'),
        alignment=TA_CENTER, spaceAfter=6*mm)))
    story.append(Spacer(1, 14*mm))

    # Meta info
    date_str = data.get('date', datetime.now().strftime('%d.%m.%Y'))
    meta_items = [
        ('📅 Күні', date_str),
        ('⏱ Ұзақтығы', data.get('duration', '—')),
        ('📌 Режим', {'presentation':'Презентация','quiz-race':'Квиз гонкасы',
                      'teams':'Командалар','self-study':'Өздік жұмыс'}.get(
                      data.get('mode',''), data.get('mode','—'))),
        ('🔐 PIN', data.get('pin', '—')),
    ]
    meta_data = [[Paragraph(f'<b>{k}</b>', ParagraphStyle('mk', fontName='DJBold', fontSize=9,
                    textColor=C_TEXT2)),
                  Paragraph(v, ParagraphStyle('mv', fontName='DJ', fontSize=10,
                    textColor=C_TEXT))]
                 for k, v in meta_items]
    meta_tbl = Table(meta_data, colWidths=[40*mm, 120*mm])
    meta_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f4f8')),
        ('BOX', (0,0), (-1,-1), 0.5, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.3, C_BORDER),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 6*mm))

    # Summary stats
    participants = data.get('participants', [])
    lb = data.get('leaderboard', [])
    avg_score = round(sum(p.get('score',0) for p in lb) / max(len(lb),1))
    quiz_results = data.get('quizResults', [])
    total_q = sum(r.get('totalQuestions',0) for r in quiz_results) or len(data.get('blocks',[]))
    
    story.append(stat_table([
        ('ҚАТЫСУШЫЛАР', len(participants), C_BLUE),
        ('БЛОКТАР',     len(data.get('blocks',[])), C_PURPLE),
        ('ОРТ. ҰПАЙ',   avg_score, C_GREEN),
        ('КВИЗДЕР',     len([b for b in data.get('blocks',[]) if b.get('type')=='quiz']), C_GOLD),
    ]))

    story.append(PageBreak())


# ── Leaderboard section ──────────────────────────────────────
def build_leaderboard(story, data, st):
    lb = data.get('leaderboard', [])
    if not lb:
        return
    story.append(Paragraph('🏆 Қатысушылар рейтингі', st['section']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER, spaceAfter=3*mm))

    rank_colors = [C_GOLD, colors.HexColor('#c0c0c0'), colors.HexColor('#cd7f32')]
    rank_medals = ['🥇', '🥈', '🥉']
    max_score = max((p.get('score',0) for p in lb), default=1) or 1

    rows = [['#', 'Аты', 'Ұпай', 'Дұрыстық', 'Прогресс']]
    for i, p in enumerate(lb):
        rank = rank_medals[i] if i < 3 else str(i+1)
        name = p.get('name','—')
        score = p.get('score', 0)
        acc   = f"{p.get('accuracy', 0)}%"
        pct   = int(score / max_score * 100)
        # simple ASCII bar
        bar_len = max(1, pct // 5)
        bar = '█' * bar_len + '░' * (20 - bar_len)
        rows.append([rank, name, str(score), acc, bar])

    col_w = [12*mm, 60*mm, 22*mm, 22*mm, 54*mm]
    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    tbl.setStyle(TableStyle([
        # Header
        ('BACKGROUND',    (0,0), (-1,0), C_DARK),
        ('TEXTCOLOR',     (0,0), (-1,0), C_WHITE),
        ('FONTNAME',      (0,0), (-1,0), 'DJMono'),
        ('FONTSIZE',      (0,0), (-1,0), 8),
        ('TOPPADDING',    (0,0), (-1,0), 5),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        # Body
        ('FONTNAME',      (0,1), (-1,-1), 'DJ'),
        ('FONTSIZE',      (0,1), (-1,-1), 9),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, colors.HexColor('#f6f9fc')]),
        ('TOPPADDING',    (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        # Top 3 highlight
        *[('TEXTCOLOR', (0, i+1), (1, i+1), rank_colors[i])
          for i in range(min(3, len(lb)))],
        *[('FONTNAME',  (0, i+1), (1, i+1), 'DJBold')
          for i in range(min(3, len(lb)))],
        # Grid
        ('BOX',       (0,0), (-1,-1), 0.5, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.3, C_BORDER),
        # Score col color
        ('TEXTCOLOR',  (2,1), (2,-1), C_BLUE),
        ('FONTNAME',   (2,1), (2,-1), 'DJBold'),
        ('TEXTCOLOR',  (3,1), (3,-1), C_GREEN),
        ('FONTNAME',   (4,0), (4,-1), 'DJMono'),
        ('FONTSIZE',   (4,1), (4,-1), 7),
        ('TEXTCOLOR',  (4,1), (4,-1), C_BLUE),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 4*mm))


# ── Lesson plan / blocks ─────────────────────────────────────
def build_blocks(story, data, st):
    blocks = data.get('blocks', [])
    if not blocks:
        return
    story.append(Paragraph('📋 Сабақ жоспары', st['section']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER, spaceAfter=3*mm))

    type_icons = {
        'heading':'H1', 'subheading':'H2', 'text':'¶',
        'code':'[ ]', 'quiz':'⚡', 'task':'✏', 'poll':'🗳',
        'slide':'□', 'video':'▶', 'image':'🖼', 'callout':'💡',
        'checklist':'☑', 'divider':'—'
    }
    type_names = {
        'heading':'Тақырып', 'subheading':'Бөлім', 'text':'Мәтін',
        'code':'Код', 'quiz':'Квиз', 'task':'Тапсырма', 'poll':'Голосование',
        'slide':'Слайд', 'video':'Видео', 'image':'Сурет',
        'callout':'Ескерту', 'checklist':'Тізім', 'divider':'Бөлгіш'
    }
    type_colors = {
        'quiz': C_GOLD, 'poll': C_PURPLE, 'task': C_GREEN,
        'code': C_BLUE, 'heading': C_DARK, 'video': C_RED
    }

    rows = [['#', 'Тип', 'Мазмұн', 'Уақыт']]
    for i, b in enumerate(blocks):
        btype = b.get('type','text')
        icon  = type_icons.get(btype,'?')
        tname = type_names.get(btype, btype)
        content = (b.get('slideTitle') or b.get('content') or b.get('question') or
                   b.get('taskText') or b.get('text') or '—')
        content = content[:80] + ('...' if len(content) > 80 else '')
        timer   = str(b.get('timeLimit', b.get('timer', '—'))) + 's' if b.get('timeLimit') else '—'
        rows.append([str(i+1), f'{icon} {tname}', content, timer])

    col_w = [10*mm, 28*mm, 112*mm, 20*mm]
    tbl = Table(rows, colWidths=col_w, repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND',    (0,0), (-1,0), C_DARK),
        ('TEXTCOLOR',     (0,0), (-1,0), C_WHITE),
        ('FONTNAME',      (0,0), (-1,0), 'DJMono'),
        ('FONTSIZE',      (0,0), (-1,0), 8),
        ('TOPPADDING',    (0,0), (-1,0), 5),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('FONTNAME',      (0,1), (-1,-1), 'DJ'),
        ('FONTSIZE',      (0,1), (-1,-1), 8.5),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, colors.HexColor('#f6f9fc')]),
        ('TOPPADDING',    (0,1), (-1,-1), 3),
        ('BOTTOMPADDING', (0,1), (-1,-1), 3),
        ('LEFTPADDING',   (0,0), (-1,-1), 5),
        ('RIGHTPADDING',  (0,0), (-1,-1), 5),
        ('BOX',       (0,0), (-1,-1), 0.5, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.3, C_BORDER),
        ('TEXTCOLOR', (0,1), (0,-1), C_TEXT2),
        ('FONTNAME',  (0,1), (0,-1), 'DJMono'),
    ]))
    # Color type column by block type
    for i, b in enumerate(blocks, 1):
        c = type_colors.get(b.get('type',''), C_TEXT2)
        tbl.setStyle(TableStyle([('TEXTCOLOR', (1,i), (1,i), c)]))
    story.append(tbl)
    story.append(Spacer(1, 4*mm))


# ── Quiz results ─────────────────────────────────────────────
def build_quiz_results(story, data, st):
    quiz_results = data.get('quizResults', [])
    if not quiz_results:
        return
    story.append(Paragraph('⚡ Квиз нәтижелері', st['section']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER, spaceAfter=3*mm))

    for qr in quiz_results:
        story.append(KeepTogether([
            Paragraph(f"<b>{qr.get('quizTitle','Квиз')}</b>", ParagraphStyle('qh',
                fontName='DJBold', fontSize=10, textColor=C_TEXT, spaceAfter=2*mm)),
        ]))
        rows = [['Ойыншы', 'Ұпай', 'Дұрыс', 'Қате', 'Дұрыстық']]
        for p in qr.get('players', []):
            correct = p.get('correct', 0)
            total   = p.get('totalQuestions', 1) or 1
            wrong   = total - correct
            acc     = round(correct / total * 100)
            rows.append([
                p.get('name','—'),
                str(p.get('score',0)),
                str(correct),
                str(wrong),
                f'{acc}%'
            ])
        col_w = [60*mm, 28*mm, 22*mm, 22*mm, 28*mm] if len(rows[0])==5 else [80*mm,30*mm,30*mm,30*mm]
        tbl = Table(rows, colWidths=col_w, repeatRows=1)
        tbl.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,0), colors.HexColor('#1a2d35')),
            ('TEXTCOLOR',     (0,0), (-1,0), C_WHITE),
            ('FONTNAME',      (0,0), (-1,0), 'DJMono'),
            ('FONTSIZE',      (0,0), (-1,0), 8),
            ('FONTNAME',      (0,1), (-1,-1), 'DJ'),
            ('FONTSIZE',      (0,1), (-1,-1), 9),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, colors.HexColor('#f6f9fc')]),
            ('TOPPADDING',    (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING',   (0,0), (-1,-1), 6),
            ('RIGHTPADDING',  (0,0), (-1,-1), 6),
            ('BOX',       (0,0), (-1,-1), 0.5, C_BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.3, C_BORDER),
            ('TEXTCOLOR', (1,1), (1,-1), C_BLUE),
            ('FONTNAME',  (1,1), (1,-1), 'DJBold'),
            ('TEXTCOLOR', (4,1), (4,-1), C_GREEN),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 3*mm))


# ── Summary / notes ──────────────────────────────────────────
def build_summary(story, data, st):
    story.append(Paragraph('📝 Жалпы қорытынды', st['section']))
    story.append(HRFlowable(width='100%', thickness=0.5, color=C_BORDER, spaceAfter=3*mm))

    lb = data.get('leaderboard', [])
    participants = data.get('participants', [])
    blocks = data.get('blocks', [])
    quiz_count = len([b for b in blocks if b.get('type') == 'quiz'])
    poll_count = len([b for b in blocks if b.get('type') == 'poll'])
    task_count = len([b for b in blocks if b.get('type') == 'task'])

    avg = round(sum(p.get('score',0) for p in lb) / max(len(lb),1))
    max_score = max((p.get('score',0) for p in lb), default=0)
    min_score = min((p.get('score',0) for p in lb), default=0) if lb else 0
    winner = lb[0].get('name','—') if lb else '—'

    notes = data.get('teacherNotes', '')

    summary_data = [
        ['Жалпы қатысушылар саны', str(len(participants))],
        ['Сабақ блоктарының саны', str(len(blocks))],
        ['Квиз блоктары', str(quiz_count)],
        ['Голосование блоктары', str(poll_count)],
        ['Тапсырма блоктары', str(task_count)],
        ['Жеңімпаз', winner],
        ['Максималды ұпай', str(max_score)],
        ['Минималды ұпай', str(min_score)],
        ['Орташа ұпай', str(avg)],
        ['Сабақ ұзақтығы', data.get('duration','—')],
    ]
    tbl = Table(summary_data, colWidths=[80*mm, 90*mm])
    tbl.setStyle(TableStyle([
        ('FONTNAME',  (0,0), (0,-1), 'DJMono'),
        ('FONTSIZE',  (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), C_TEXT2),
        ('TEXTCOLOR', (1,0), (1,-1), C_TEXT),
        ('FONTNAME',  (1,0), (1,-1), 'DJ'),
        ('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.white, colors.HexColor('#f6f9fc')]),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('BOX',       (0,0), (-1,-1), 0.5, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.3, C_BORDER),
    ]))
    story.append(tbl)

    if notes:
        story.append(Spacer(1, 4*mm))
        story.append(Paragraph('Мұғалімнің жазбалары:', st['label']))
        note_tbl = Table([[Paragraph(notes, st['body'])]], colWidths=[170*mm])
        note_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f6ff')),
            ('BOX', (0,0), (-1,-1), 0.5, C_BLUE),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(note_tbl)


# ── Footer ───────────────────────────────────────────────────
def add_footer(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont('DJMono', 7)
    canvas_obj.setFillColor(C_TEXT2)
    canvas_obj.drawString(20*mm, 10*mm, 'Tagybasqa Platform — Ашық сабақ есебі')
    canvas_obj.drawRightString(A4[0] - 20*mm, 10*mm, f'Бет {doc.page}')
    canvas_obj.restoreState()


# ── Main ─────────────────────────────────────────────────────
def generate(data, out_path):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
        title=f"Ашық сабақ есебі — {data.get('lessonTitle','')}",
        author='Tagybasqa Platform'
    )
    st = make_styles()
    story = []

    build_cover(story, data, st)
    build_leaderboard(story, data, st)
    story.append(Spacer(1, 4*mm))
    build_blocks(story, data, st)
    build_quiz_results(story, data, st)
    build_summary(story, data, st)

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    print(f'OK:{out_path}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 generate_report.py <json_data>', file=sys.stderr)
        sys.exit(1)
    raw = sys.argv[1]
    data = json.loads(raw)
    out  = data.get('outputPath', '/tmp/tagybasqa_report.pdf')
    generate(data, out)
