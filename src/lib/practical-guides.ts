// Editorial drafts for N-017. Public builds exclude them until human approval.
export interface PracticalGuide {
  status: 'draft' | 'approved';
  reviewer: string;
  title: string;
  intro: string;
  steps: string[];
  example: string;
  prompt: string;
  checks: string[];
  limits: string;
  evidence: string;
  download?: string;
}
export const practicalGuides: Record<string, PracticalGuide> = {
  "excel-spreadsheets": {
    "title": "Try a small spreadsheet first",
    "intro": "Start with a copy containing no personal or confidential information. This example checks arithmetic and missing values; it does not test editing a workbook.",
    "steps": [
      "Choose a model from the picks above, then check that your app and plan support the input you want to use.",
      "Paste the small table below and the prompt. Ask for calculations before conclusions.",
      "Compare the answer with the checks below before trying your own data."
    ],
    "example": "item,quantity,unit_price\nNotebook,3,4.50\nPen,10,1.20\nFolder,,2.00",
    "prompt": "Calculate the total for each complete row and the subtotal of complete rows. Flag missing values. Do not assume a quantity for Folder. Show the arithmetic and say which rows the subtotal excludes.",
    "checks": [
      "Notebook should total 13.50 and Pen 12.00. The complete-row subtotal is 25.50.",
      "Folder has a missing quantity. Its total is unknown and must be excluded from that subtotal.",
      "For your own sheet, compare totals with spreadsheet formulas. Check blanks, dates, currencies and duplicate rows separately."
    ],
    "limits": "A correct answer here is a useful spot check, not proof that the model can handle a large workbook, preserve formulas or edit an Excel file.",
    "evidence": "The evidence below includes questions about spreadsheet data. It does not establish that a consumer app can edit your workbook.",
    "download": "/examples/spreadsheet-starter.csv",
    "status": "draft",
    "reviewer": "unreviewed"
  },
  "documents-notes": {
    "title": "Extract facts you can trace",
    "intro": "Use a short, non-sensitive passage first. Ask for an exact quote beside each extracted fact so you can check it against the original.",
    "steps": [
      "Choose a model from the picks above. Check file support and limits in your app before uploading a document.",
      "Paste the example and prompt below. For a real document, ask for page or section references as well.",
      "Open the original and verify each quoted passage. Treat missing information as unknown."
    ],
    "example": "Project Cedar\nThe workshop is on 14 March at 10:00. Sam will send the slides. The venue is still to be confirmed.",
    "prompt": "Extract the event date, time, slides owner and venue into a table. Include an exact supporting quote for each fact. Use \"not confirmed\" when the passage does not give a confirmed answer. Do not infer a year or location.",
    "checks": [
      "Date: 14 March. Time: 10:00. Slides owner: Sam.",
      "Venue is not confirmed. No year or location should be invented.",
      "A quote must actually appear in the source. A plausible reference is not enough."
    ],
    "limits": "This small extraction exercise does not test scanned PDFs, tables, long-document completeness or whether a summary preserves every important point.",
    "evidence": "The evidence below covers document extraction and related skills. It does not directly measure every summarisation or meeting-note workflow.",
    "status": "draft",
    "reviewer": "unreviewed"
  },
  "writing": {
    "title": "Turn a brief into a draft you can check",
    "intro": "Give the model the facts and the intended reader. Keep control of promises, names and dates.",
    "steps": [
      "Choose a model from the picks above. Paste only information you are comfortable sharing with that service.",
      "Use the short brief and prompt below, then read the result as its intended recipient.",
      "Check every factual claim before sending. Ask for a revision that fixes a specific problem."
    ],
    "example": "Reader: a customer waiting for a delivery.\nKnown facts: the parcel is delayed; the next update is Friday.\nUnknown: the delivery date.\nTone: calm and direct.",
    "prompt": "Draft a short customer email using only the known facts. Say when the next update will arrive. Do not promise a delivery date, invent a cause, or offer a refund. Use a placeholder for the customer name.",
    "checks": [
      "The next update is Friday; that is not a promised delivery date.",
      "No invented reason for the delay, refund offer or customer details should appear.",
      "Does the email clearly tell the reader what happens next? Remove unnecessary filler."
    ],
    "limits": "This checks whether one draft follows a brief. It does not establish factual reliability across other subjects or that a model has a universally better writing style.",
    "evidence": "The writing comparison below is based on people's preferences, not an objective test of your email or every kind of writing.",
    "status": "draft",
    "reviewer": "unreviewed"
  }
};
