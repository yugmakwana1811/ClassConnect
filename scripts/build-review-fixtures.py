#!/usr/bin/env python3
"""Build realistic classroom documents used by the Review Work demo data."""

from __future__ import annotations

import argparse
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


BLUE = RGBColor(46, 116, 181)
DARK_BLUE = RGBColor(31, 77, 120)
INK = RGBColor(28, 37, 48)
MUTED = RGBColor(92, 101, 112)


def set_run_font(
    run,
    *,
    size: float = 11,
    bold: bool = False,
    italic: bool = False,
    color: RGBColor = INK,
) -> None:
    run.font.name = "Calibri"
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), "Calibri")
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), "Calibri")
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color


def configure_document(doc: Document, running_label: str) -> None:
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.right_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    normal.font.size = Pt(11)
    normal.font.color.rgb = INK
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.10

    heading_tokens = {
        "Heading 1": (16, BLUE, 16, 8),
        "Heading 2": (13, BLUE, 12, 6),
        "Heading 3": (12, DARK_BLUE, 8, 4),
    }
    for style_name, (size, color, before, after) in heading_tokens.items():
        style = doc.styles[style_name]
        style.font.name = "Calibri"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = color
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    header.paragraph_format.space_after = Pt(0)
    set_run_font(
        header.add_run(running_label.upper()),
        size=8.5,
        bold=True,
        color=MUTED,
    )

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.space_before = Pt(0)
    set_run_font(
        footer.add_run("EduGrade classroom sample • Vidya Bharati Senior Secondary School"),
        size=8,
        color=MUTED,
    )


def add_title(
    doc: Document,
    title: str,
    subtitle: str,
    metadata: str,
) -> None:
    school = doc.add_paragraph()
    school.alignment = WD_ALIGN_PARAGRAPH.CENTER
    school.paragraph_format.space_after = Pt(5)
    set_run_font(
        school.add_run("VIDYA BHARATI SENIOR SECONDARY SCHOOL"),
        size=10,
        bold=True,
        color=DARK_BLUE,
    )

    title_paragraph = doc.add_paragraph()
    title_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_paragraph.paragraph_format.space_after = Pt(3)
    set_run_font(
        title_paragraph.add_run(title),
        size=22,
        bold=True,
        color=INK,
    )

    subtitle_paragraph = doc.add_paragraph()
    subtitle_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_paragraph.paragraph_format.space_after = Pt(8)
    set_run_font(
        subtitle_paragraph.add_run(subtitle),
        size=12,
        bold=True,
        color=BLUE,
    )

    metadata_paragraph = doc.add_paragraph()
    metadata_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    metadata_paragraph.paragraph_format.space_after = Pt(14)
    set_run_font(
        metadata_paragraph.add_run(metadata),
        size=9.5,
        color=MUTED,
    )


def add_question(doc: Document, label: str, marks: int, prompt: str) -> None:
    heading = doc.add_paragraph(style="Heading 2")
    heading.add_run(f"{label} · {marks} marks")
    paragraph = doc.add_paragraph(prompt)
    paragraph.paragraph_format.keep_together = True


def add_response(doc: Document, label: str, body: list[str]) -> None:
    heading = doc.add_paragraph(style="Heading 2")
    heading.add_run(label)
    for line in body:
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.keep_together = True
        paragraph.add_run(line)


def build_partnership_test(path: Path) -> None:
    doc = Document()
    configure_document(doc, "Partnership Adjustments Unit Test")
    add_title(
        doc,
        "Partnership Adjustments Unit Test",
        "Class XII Accountancy",
        "Time: 60 minutes  •  Maximum marks: 40  •  Assessment type: Test",
    )
    instructions = doc.add_paragraph()
    set_run_font(instructions.add_run("Instructions. "), bold=True, color=DARK_BLUE)
    instructions.add_run(
        "Answer all questions. Show journal entries, ratios, and working notes clearly. "
        "Narration is required wherever applicable."
    )
    add_question(
        doc,
        "Question A",
        8,
        "A and B share profits in the ratio 3:2. C is admitted for one-fifth share, "
        "acquired equally from A and B. Calculate the new ratio and sacrificing ratio.",
    )
    add_question(
        doc,
        "Question B",
        10,
        "Goodwill is valued at ₹1,20,000. Pass the adjustment entry when C brings "
        "only ₹18,000 as premium for goodwill.",
    )
    add_question(
        doc,
        "Question C",
        12,
        "Prepare the revaluation account from the following adjustments: stock "
        "appreciates by ₹8,000; machinery depreciates by ₹12,000; an unrecorded "
        "liability of ₹3,000 is recognised.",
    )
    add_question(
        doc,
        "Question D",
        10,
        "State two differences between fixed and fluctuating capital accounts, "
        "then record interest on capital of ₹6,000 and drawings of ₹4,500.",
    )
    doc.save(path)


def build_cash_flow_assignment(path: Path) -> None:
    doc = Document()
    configure_document(doc, "Cash Flow Statement Assignment")
    add_title(
        doc,
        "Cash Flow Statement Assignment",
        "Class XII Accountancy",
        "Submission window: 48 hours  •  Maximum marks: 25  •  Assessment type: Assignment",
    )
    instructions = doc.add_paragraph()
    set_run_font(instructions.add_run("Task. "), bold=True, color=DARK_BLUE)
    instructions.add_run(
        "Prepare a complete cash flow statement under AS 3 using the indirect method. "
        "Classify each item and include supporting calculations."
    )
    add_question(
        doc,
        "Operating activities",
        10,
        "Profit before tax is ₹1,80,000; depreciation ₹30,000; gain on sale of "
        "equipment ₹8,000; trade receivables increase by ₹20,000; inventory "
        "decreases by ₹12,000; income tax paid ₹35,000.",
    )
    add_question(
        doc,
        "Investing activities",
        7,
        "Equipment costing ₹70,000 is purchased. Another machine with book value "
        "₹24,000 is sold for ₹32,000.",
    )
    add_question(
        doc,
        "Financing activities",
        8,
        "Equity shares of ₹1,00,000 are issued, debentures of ₹50,000 are redeemed, "
        "and dividend of ₹24,000 is paid.",
    )
    doc.save(path)


def build_goodwill_worksheet(path: Path) -> None:
    doc = Document()
    configure_document(doc, "Goodwill Valuation Worksheet")
    add_title(
        doc,
        "Goodwill Valuation Worksheet",
        "Class XII Accountancy",
        "Practice duration: 35 minutes  •  Maximum marks: 20  •  Assessment type: Worksheet",
    )
    add_question(
        doc,
        "Average profit method",
        6,
        "Profits for four years are ₹80,000, ₹92,000, ₹1,05,000 and ₹1,23,000. "
        "Calculate goodwill at three years' purchase of average profit.",
    )
    add_question(
        doc,
        "Super profit method",
        8,
        "Capital employed is ₹8,00,000, normal rate of return is 10%, and average "
        "maintainable profit is ₹1,20,000. Calculate goodwill at four years' purchase.",
    )
    add_question(
        doc,
        "Concept check",
        6,
        "Explain why abnormal gains and losses are adjusted before calculating "
        "maintainable profit. Give one example of each.",
    )
    doc.save(path)


def build_partnership_answers(path: Path) -> None:
    doc = Document()
    configure_document(doc, "Completed Student Answer Script")
    add_title(
        doc,
        "Completed Answer Script",
        "Partnership Adjustments Unit Test",
        "Student: Arjun Mehta  •  Roll no.: 12-C-17  •  Class: XII Commerce",
    )
    add_response(
        doc,
        "Response A · New and sacrificing ratios",
        [
            "C's share = 1/5. A and B sacrifice equally, therefore each sacrifices 1/10.",
            "A's new share = 3/5 − 1/10 = 1/2.",
            "B's new share = 2/5 − 1/10 = 3/10.",
            "New ratio A:B:C = 5:3:2. Sacrificing ratio A:B = 1:1.",
        ],
    )
    add_response(
        doc,
        "Response B · Goodwill adjustment",
        [
            "C's required premium = ₹1,20,000 × 1/5 = ₹24,000.",
            "Premium brought = ₹18,000; shortfall = ₹6,000.",
            "C's Capital A/c Dr. ₹6,000; Premium for Goodwill A/c Cr. ₹6,000.",
            "Premium for Goodwill A/c Dr. ₹24,000; A's Capital A/c Cr. ₹12,000; "
            "B's Capital A/c Cr. ₹12,000.",
        ],
    )
    doc.add_page_break()
    add_title(
        doc,
        "Working Notes",
        "Partnership Adjustments Unit Test",
        "Student: Arjun Mehta  •  Page 2 of 2",
    )
    add_response(
        doc,
        "Response C · Revaluation account",
        [
            "Credit: Increase in stock ₹8,000.",
            "Debit: Depreciation on machinery ₹12,000; unrecorded liability ₹3,000.",
            "Net revaluation loss = ₹7,000, transferred to A and B in old ratio 3:2.",
            "A's share of loss = ₹4,200; B's share of loss = ₹2,800.",
        ],
    )
    add_response(
        doc,
        "Response D · Capital accounts",
        [
            "Fixed capital remains unchanged except for permanent capital changes; "
            "routine adjustments are recorded in current accounts.",
            "Fluctuating capital records drawings, interest, salary and profit share "
            "directly in one capital account.",
            "Interest on Capital A/c Dr. ₹6,000; Partner's Capital A/c Cr. ₹6,000.",
            "Partner's Drawings A/c Dr. ₹4,500; Partner's Capital A/c Cr. ₹4,500.",
        ],
    )
    doc.save(path)


def build_cash_flow_answers(path: Path) -> None:
    doc = Document()
    configure_document(doc, "Completed Student Assignment")
    add_title(
        doc,
        "Completed Assignment",
        "Cash Flow Statement",
        "Student: Arjun Mehta  •  Roll no.: 12-C-17  •  Class: XII Commerce",
    )
    add_response(
        doc,
        "Cash flow from operating activities",
        [
            "Profit before tax ₹1,80,000; add depreciation ₹30,000 and less gain "
            "on sale of equipment ₹8,000.",
            "Operating profit before working-capital changes = ₹2,02,000. Less "
            "increase in receivables ₹20,000; add decrease in inventory ₹12,000.",
            "Cash generated from operations = ₹1,94,000.",
            "Less income tax paid ₹35,000. Net operating cash flow = ₹1,59,000.",
        ],
    )
    add_response(
        doc,
        "Investing and financing activities",
        [
            "Purchase of equipment ₹70,000 less sale proceeds ₹32,000 gives net "
            "investing cash outflow of ₹38,000.",
            "Share issue inflow ₹1,00,000; debenture redemption outflow ₹50,000; "
            "dividend paid outflow ₹24,000.",
            "Net financing cash inflow = ₹26,000. Net increase in cash and cash "
            "equivalents = ₹1,47,000.",
        ],
    )
    doc.save(path)


def build_goodwill_answers(path: Path) -> None:
    doc = Document()
    configure_document(doc, "Completed Student Worksheet")
    add_title(
        doc,
        "Completed Worksheet",
        "Goodwill Valuation",
        "Student: Arjun Mehta  •  Roll no.: 12-C-17  •  Class: XII Commerce",
    )
    add_response(
        doc,
        "Average profit method",
        [
            "Total profit = ₹80,000 + ₹92,000 + ₹1,05,000 + ₹1,23,000 = ₹4,00,000.",
            "Average profit = ₹4,00,000 ÷ 4 = ₹1,00,000.",
            "Goodwill = ₹1,00,000 × 3 years' purchase = ₹3,00,000.",
        ],
    )
    add_response(
        doc,
        "Super profit method",
        [
            "Normal profit = ₹8,00,000 × 10% = ₹80,000.",
            "Super profit = ₹1,20,000 − ₹80,000 = ₹40,000.",
            "Goodwill = ₹40,000 × 4 years' purchase = ₹1,60,000.",
        ],
    )
    add_response(
        doc,
        "Concept check",
        [
            "Abnormal items are not expected to recur, so they do not represent "
            "maintainable earning capacity.",
            "An abnormal loss such as fire damage is added back; an abnormal gain "
            "such as profit on sale of a building is deducted.",
        ],
    )
    doc.save(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    builders = {
        "partnership-unit-test.docx": build_partnership_test,
        "cash-flow-assignment.docx": build_cash_flow_assignment,
        "goodwill-worksheet.docx": build_goodwill_worksheet,
        "partnership-unit-test-answers.docx": build_partnership_answers,
        "cash-flow-assignment-answers.docx": build_cash_flow_answers,
        "goodwill-worksheet-answers.docx": build_goodwill_answers,
    }
    for name, builder in builders.items():
        builder(args.output_dir / name)


if __name__ == "__main__":
    main()
