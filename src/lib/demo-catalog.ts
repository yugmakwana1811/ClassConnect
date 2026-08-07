import type {
  AssignmentStatus,
  AttendanceStatus,
  SubmissionStatus,
} from "@prisma/client";

export const DEMO_SCHOOL = "Vidya Bharati Senior Secondary School";
export const DEMO_PASSWORD = "EduGrade@123";
export const DEMO_GENERATED_PDF_PREFIX = "generated-pdf://";
export const DEMO_SUBMISSION_PAGE_PREFIX = "generated-submission-page://";

export type DemoStudent = {
  key: string;
  userId: string;
  profileId: string;
  name: string;
  email: string;
  rollNumber: string;
  parentAccessCode: string;
  baseScore: number;
  completionRate: number;
  lateEvery: number;
  strengths: string[];
  improvements: string[];
};

export const DEMO_STUDENTS: DemoStudent[] = [
  {
    key: "arjun",
    userId: "demo-student-user",
    profileId: "demo-student-profile",
    name: "Arjun Mehta",
    email: "student@edugrade.ai",
    rollNumber: "12-C-17",
    parentAccessCode: "ARJUN2P4KM",
    baseScore: 79,
    completionRate: 88,
    lateEvery: 8,
    strengths: ["structured working", "partnership adjustments"],
    improvements: ["final reconciliation", "answer precision"],
  },
  {
    key: "aarav",
    userId: "demo-student-aarav-user",
    profileId: "demo-student-aarav-profile",
    name: "Aarav Patel",
    email: "aarav.patel@demo.edugrade.ai",
    rollNumber: "12-C-02",
    parentAccessCode: "AARAV7K2PX",
    baseScore: 91,
    completionRate: 98,
    lateEvery: 17,
    strengths: ["accurate calculations", "case analysis"],
    improvements: ["showing complete working", "concise conclusions"],
  },
  {
    key: "diya",
    userId: "demo-student-diya-user",
    profileId: "demo-student-diya-profile",
    name: "Diya Shah",
    email: "diya.shah@demo.edugrade.ai",
    rollNumber: "12-C-08",
    parentAccessCode: "DIYA8M4QZT",
    baseScore: 84,
    completionRate: 92,
    lateEvery: 11,
    strengths: ["clear explanations", "economics concepts"],
    improvements: ["supporting answers with data", "SQL syntax checks"],
  },
  {
    key: "riya",
    userId: "demo-student-riya-user",
    profileId: "demo-student-riya-profile",
    name: "Riya Desai",
    email: "riya.desai@demo.edugrade.ai",
    rollNumber: "12-C-21",
    parentAccessCode: "RIYA6N3WPK",
    baseScore: 72,
    completionRate: 86,
    lateEvery: 7,
    strengths: ["consistent effort", "business terminology"],
    improvements: ["multi-step calculations", "time management"],
  },
  {
    key: "kabir",
    userId: "demo-student-kabir-user",
    profileId: "demo-student-kabir-profile",
    name: "Kabir Mehta",
    email: "kabir.mehta@demo.edugrade.ai",
    rollNumber: "12-C-14",
    parentAccessCode: "KABIR5R8NX",
    baseScore: 53,
    completionRate: 68,
    lateEvery: 4,
    strengths: ["oral participation", "basic concepts"],
    improvements: ["goodwill treatment", "regular submission practice"],
  },
  {
    key: "vivaan",
    userId: "demo-student-vivaan-user",
    profileId: "demo-student-vivaan-profile",
    name: "Vivaan Joshi",
    email: "vivaan.joshi@demo.edugrade.ai",
    rollNumber: "12-C-29",
    parentAccessCode: "VIVAAN9H2K",
    baseScore: 64,
    completionRate: 82,
    lateEvery: 6,
    strengths: ["visible improvement", "data presentation"],
    improvements: ["earlier revision", "answer completeness"],
  },
];

export type DemoClass = {
  id: string;
  code: string;
  name: string;
  subject: string;
  description: string;
};

export const DEMO_CLASSES: DemoClass[] = [
  {
    id: "demo-class",
    code: "ACC12D",
    name: "Class 12 Commerce",
    subject: "Accountancy",
    description: "Partnership firms, company accounts and financial statement analysis.",
  },
  {
    id: "demo-class-economics",
    code: "ECO12D",
    name: "Class 12 Commerce - Economics",
    subject: "Economics",
    description: "Macroeconomics, Indian economic development and applied data interpretation.",
  },
  {
    id: "demo-class-business",
    code: "BST12D",
    name: "Class 12 Commerce - Business Studies",
    subject: "Business Studies",
    description: "Management principles, finance, marketing and business environment case work.",
  },
  {
    id: "demo-class-ip",
    code: "IPR12D",
    name: "Class 12 Commerce - Informatics Practices",
    subject: "Informatics Practices",
    description: "Python, Pandas, SQL, data visualization and computer networks.",
  },
  {
    id: "demo-class-english",
    code: "ENG12D",
    name: "Class 12 Commerce - English",
    subject: "English",
    description: "Comprehension, writing skills, grammar and theme-based literary response.",
  },
];

export type DemoQuestion = {
  prompt: string;
  marks: number;
  answer?: string;
  options?: string[];
};

export type DemoAssignment = {
  id: string;
  attachmentId: string;
  classId: string;
  title: string;
  description: string;
  instructions: string;
  type: "Assignment" | "Homework" | "Test" | "Worksheet" | "Practice" | "Project" | "Classwork";
  topic: string;
  objective: string;
  maxMarks: number;
  durationMinutes: number;
  issuedAt: string;
  dueAt: string;
  status: AssignmentStatus;
  generalInstructions: string[];
  questions: DemoQuestion[];
  rubric?: string[];
  teacherNote?: string;
};

export const DEMO_ASSIGNMENTS: DemoAssignment[] = [
  {
    id: "demo-work-partnership-fundamentals",
    attachmentId: "demo-paper-partnership-fundamentals",
    classId: "demo-class",
    title: "Partnership Fundamentals Assignment",
    description: "Apply partnership-deed rules to appropriation, interest and partner adjustments.",
    instructions: "Show journal logic and all supporting calculations. Round only final answers.",
    type: "Assignment",
    topic: "Partnership Fundamentals",
    objective: "Distinguish deed-based adjustments from provisions of the Indian Partnership Act.",
    maxMarks: 20,
    durationMinutes: 45,
    issuedAt: "2026-07-06T09:00:00.000Z",
    dueAt: "2026-07-10T11:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Answer every question.", "Show calculations for numerical answers.", "Use narration for journal entries."],
    questions: [
      { prompt: "State any four provisions that apply when a partnership deed is silent.", marks: 4, answer: "Equal profit sharing; no partner salary; no interest on capital; 6% interest on partner loan." },
      { prompt: "A and B share profits 3:2. Capital is Rs. 300,000 and Rs. 200,000. Calculate interest on capital at 8% and distribute profit of Rs. 90,000 after the charge.", marks: 6, answer: "Interest: Rs. 24,000 and Rs. 16,000; remaining profit Rs. 50,000 shared Rs. 30,000 and Rs. 20,000." },
      { prompt: "Prepare a Profit and Loss Appropriation Account from the supplied adjustments and explain its purpose.", marks: 10, answer: "Appropriation account distributes divisible profit after partner-specific adjustments." },
    ],
    rubric: ["Method and working: 10", "Accuracy: 6", "Presentation: 4"],
  },
  {
    id: "demo-work-partnership-unit-test",
    attachmentId: "demo-paper-partnership-unit-test",
    classId: "demo-class",
    title: "Partnership Accounts Unit Test",
    description: "A timed assessment on admission, goodwill, revaluation and capital adjustment.",
    instructions: "Answer all questions and show necessary working notes.",
    type: "Test",
    topic: "Partnership Adjustments",
    objective: "Integrate admission-of-partner adjustments in a complete accounting problem.",
    maxMarks: 25,
    durationMinutes: 45,
    issuedAt: "2026-07-14T09:00:00.000Z",
    dueAt: "2026-07-18T06:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Answer all questions.", "Show necessary working.", "Marks are indicated against each question."],
    questions: [
      { prompt: "Define sacrificing ratio and state where it is used.", marks: 3, answer: "Old ratio minus new ratio; used to compensate sacrificing partners for goodwill." },
      { prompt: "P and Q share profits 3:2. R is admitted for one-fifth share acquired equally from P and Q. Calculate the new ratio and sacrificing ratio.", marks: 5, answer: "New ratio 5:3:2; P and Q sacrifice equally." },
      { prompt: "Pass journal entries for unrecorded liability, increase in land value and goodwill brought privately by the incoming partner.", marks: 7, answer: "Record revaluation items through Revaluation Account; private goodwill requires no entry in firm books." },
      { prompt: "Prepare Revaluation Account and partners' capital accounts after admission using the balances provided in the question.", marks: 10, answer: "Award method marks for revaluation transfer, goodwill adjustment and balancing capitals." },
    ],
    teacherNote: "Accept equivalent working formats when narration and final balances are correct.",
  },
  {
    id: "demo-work-admission-worksheet",
    attachmentId: "demo-paper-admission-worksheet",
    classId: "demo-class",
    title: "Admission of a Partner Worksheet",
    description: "Graduated practice on new ratio, sacrificing ratio and goodwill adjustment.",
    instructions: "Complete the ratio table before attempting journal entries.",
    type: "Worksheet",
    topic: "Admission of a Partner",
    objective: "Calculate partner ratios accurately and connect them to goodwill entries.",
    maxMarks: 18,
    durationMinutes: 35,
    issuedAt: "2026-07-20T09:00:00.000Z",
    dueAt: "2026-07-24T11:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Write ratios in simplest form.", "Show the source of the incoming partner's share.", "Complete every journal narration."],
    questions: [
      { prompt: "Complete three new-ratio and sacrificing-ratio calculations.", marks: 6, answer: "Award two marks per correct calculation with working." },
      { prompt: "Record goodwill when the incoming partner brings premium in cash.", marks: 4, answer: "Bank Dr.; Premium for Goodwill Cr.; distribute premium to sacrificing partners." },
      { prompt: "Explain why accumulated profits are adjusted before admission.", marks: 3, answer: "They belong to old partners for the period before admission." },
      { prompt: "Solve the integrated capital-adjustment problem.", marks: 5, answer: "Adjust reserves, revaluation and goodwill before aligning capital to the new ratio." },
    ],
  },
  {
    id: "demo-work-retirement-practice",
    attachmentId: "demo-paper-retirement-practice",
    classId: "demo-class",
    title: "Retirement of a Partner Practice",
    description: "Practice gaining ratio, goodwill, revaluation and settlement of a retiring partner.",
    instructions: "Use separate working notes for gaining ratio and amount due.",
    type: "Practice",
    topic: "Retirement of a Partner",
    objective: "Determine the retiring partner's claim and record settlement correctly.",
    maxMarks: 20,
    durationMinutes: 40,
    issuedAt: "2026-08-03T09:00:00.000Z",
    dueAt: "2026-08-10T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Attempt independently before checking notes.", "Show gaining-ratio working.", "Label each capital-account adjustment."],
    questions: [
      { prompt: "Calculate gaining ratio in two retirement situations.", marks: 4, answer: "Gaining ratio equals new ratio minus old ratio." },
      { prompt: "Prepare the retiring partner's capital account from the supplied balances.", marks: 10, answer: "Include reserves, revaluation, goodwill, drawings and settlement." },
      { prompt: "Explain the treatment of an unrecorded asset taken over by the retiring partner.", marks: 6, answer: "Debit retiring partner's capital and credit Revaluation Account." },
    ],
  },
  {
    id: "demo-work-national-income",
    attachmentId: "demo-paper-national-income",
    classId: "demo-class-economics",
    title: "National Income Assignment",
    description: "Calculate domestic and national aggregates using income and expenditure data.",
    instructions: "State the formula before each calculation and identify excluded items.",
    type: "Assignment",
    topic: "National Income Accounting",
    objective: "Move accurately between GDP, NDP, GNP and national income measures.",
    maxMarks: 20,
    durationMinutes: 50,
    issuedAt: "2026-07-08T09:00:00.000Z",
    dueAt: "2026-07-13T11:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Use Rs. crore as the unit.", "Show each identity used.", "Explain exclusions in one sentence."],
    questions: [
      { prompt: "Distinguish final goods from intermediate goods with one original example.", marks: 3, answer: "Classification depends on end use, not the physical nature of the good." },
      { prompt: "Calculate GDP at market price from the expenditure data provided.", marks: 5, answer: "GDPmp = C + I + G + (X - M)." },
      { prompt: "Convert GDP at market price to NNP at factor cost using depreciation, NFIA and net indirect taxes.", marks: 7, answer: "NNPfc = GDPmp - depreciation + NFIA - net indirect taxes." },
      { prompt: "Explain two precautions in the value-added method.", marks: 5, answer: "Avoid double counting and include imputed value where required." },
    ],
  },
  {
    id: "demo-work-macroeconomics-test",
    attachmentId: "demo-paper-macroeconomics-test",
    classId: "demo-class-economics",
    title: "Macroeconomics Unit Test",
    description: "A balanced unit test covering national income, money, banking and government budget.",
    instructions: "Answer in sequence and draw labelled diagrams where required.",
    type: "Test",
    topic: "Macroeconomics",
    objective: "Apply macroeconomic concepts to numerical and policy situations.",
    maxMarks: 30,
    durationMinutes: 60,
    issuedAt: "2026-07-25T09:00:00.000Z",
    dueAt: "2026-07-30T06:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Answer all questions.", "Use diagrams only where relevant.", "Calculators are not required."],
    questions: [
      { prompt: "Explain the money-creation process using a reserve ratio of 20 percent.", marks: 5, answer: "Deposit multiplier is 1/0.20 = 5, subject to assumptions." },
      { prompt: "Calculate national income from the supplied aggregate values.", marks: 7, answer: "Award formula, substitution, unit and final aggregate marks." },
      { prompt: "Differentiate revenue deficit, fiscal deficit and primary deficit.", marks: 6, answer: "Define each and show the relationship between fiscal and primary deficit." },
      { prompt: "Analyse how an increase in repo rate may affect credit, demand and inflation.", marks: 6, answer: "Higher borrowing costs can reduce credit and aggregate demand, easing inflationary pressure." },
      { prompt: "Interpret the balance-of-payments extract and identify autonomous transactions.", marks: 6, answer: "Classify current/capital entries and distinguish autonomous from accommodating flows." },
    ],
  },
  {
    id: "demo-work-government-budget",
    attachmentId: "demo-paper-government-budget",
    classId: "demo-class-economics",
    title: "Government Budget Worksheet",
    description: "Classify receipts and expenditure, then calculate key budget deficits.",
    instructions: "Use the classification grid before completing deficit calculations.",
    type: "Worksheet",
    topic: "Government Budget",
    objective: "Classify budget items and interpret deficit indicators.",
    maxMarks: 16,
    durationMinutes: 30,
    issuedAt: "2026-08-01T09:00:00.000Z",
    dueAt: "2026-08-08T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Classify every item.", "Show deficit formulas.", "Add one interpretation sentence."],
    questions: [
      { prompt: "Classify eight items as revenue receipt, capital receipt, revenue expenditure or capital expenditure.", marks: 8, answer: "One mark per correct classification." },
      { prompt: "Calculate revenue, fiscal and primary deficits.", marks: 6, answer: "Award formula and calculation marks for each deficit." },
      { prompt: "State one implication of a persistently high revenue deficit.", marks: 2, answer: "It indicates government dissaving and borrowing for current expenditure." },
    ],
  },
  {
    id: "demo-work-bop-homework",
    attachmentId: "demo-paper-bop-homework",
    classId: "demo-class-economics",
    title: "Balance of Payments Homework",
    description: "Classify international transactions and reconcile the balance of payments account.",
    instructions: "Write credit or debit against every transaction before calculating balances.",
    type: "Homework",
    topic: "Balance of Payments",
    objective: "Classify international transactions and explain accounting balance.",
    maxMarks: 15,
    durationMinutes: 30,
    issuedAt: "2026-08-05T09:00:00.000Z",
    dueAt: "2026-08-12T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Use the current and capital account headings.", "Mark each entry as credit or debit.", "Explain the balancing item."],
    questions: [
      { prompt: "Classify six international transactions in the balance of payments.", marks: 6, answer: "Classify goods, services, transfers and capital flows correctly." },
      { prompt: "Calculate the current-account balance from the supplied data.", marks: 5, answer: "Add net goods, services, income and transfers." },
      { prompt: "Why does the balance of payments balance in the accounting sense?", marks: 4, answer: "A deficit in autonomous transactions is matched by accommodating flows/reserve changes." },
    ],
  },
  {
    id: "demo-work-management-principles",
    attachmentId: "demo-paper-management-principles",
    classId: "demo-class-business",
    title: "Principles of Management Assignment",
    description: "Apply Fayol and Taylor principles to short workplace situations.",
    instructions: "Name the principle, cite evidence from the case and explain the expected effect.",
    type: "Assignment",
    topic: "Principles of Management",
    objective: "Recognise management principles in authentic organisational decisions.",
    maxMarks: 20,
    durationMinutes: 45,
    issuedAt: "2026-07-09T09:00:00.000Z",
    dueAt: "2026-07-15T11:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Use case evidence in every answer.", "Do not merely define the principle.", "Keep each response under 120 words."],
    questions: [
      { prompt: "Identify and explain two Fayol principles in the Orion Retail case.", marks: 6, answer: "Accept relevant principles supported by precise case evidence." },
      { prompt: "Recommend two scientific-management techniques for the production issue described.", marks: 6, answer: "Possible responses include method study, time study, standardisation and differential piece wage." },
      { prompt: "Explain why management principles are flexible rather than absolute prescriptions.", marks: 4, answer: "They are general guidelines applied according to context." },
      { prompt: "Write a four-point action plan that balances efficiency and employee wellbeing.", marks: 4, answer: "Award feasibility, principle linkage, balance and clarity." },
    ],
  },
  {
    id: "demo-work-financial-management-test",
    attachmentId: "demo-paper-financial-management-test",
    classId: "demo-class-business",
    title: "Financial Management Test",
    description: "Test financial decisions, capital structure, working capital and financial planning.",
    instructions: "Support case-based answers with the relevant financial factor.",
    type: "Test",
    topic: "Financial Management",
    objective: "Evaluate financing and working-capital decisions in business cases.",
    maxMarks: 25,
    durationMinutes: 45,
    issuedAt: "2026-07-28T09:00:00.000Z",
    dueAt: "2026-08-02T06:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Answer all questions.", "Use the case facts in long answers.", "Marks are shown against questions."],
    questions: [
      { prompt: "State the primary objective of financial management.", marks: 2, answer: "Maximise shareholders' wealth." },
      { prompt: "Explain three factors affecting the choice of capital structure.", marks: 6, answer: "Accept cash-flow position, interest coverage, debt-service ability, ROI, tax rate, control and flexibility." },
      { prompt: "Analyse the working-capital needs of a seasonal online retailer.", marks: 7, answer: "Link operating cycle, seasonality, credit policy, scale and growth to working capital." },
      { prompt: "Evaluate the financing proposal in the case and recommend debt or equity with reasons.", marks: 10, answer: "Award analysis of cost, risk, control, cash flows and a justified recommendation." },
    ],
  },
  {
    id: "demo-work-marketing-case",
    attachmentId: "demo-paper-marketing-case",
    classId: "demo-class-business",
    title: "Marketing Management Case Worksheet",
    description: "Use the marketing mix to analyse an original sustainable-products launch case.",
    instructions: "Underline the case clue used for each recommendation.",
    type: "Worksheet",
    topic: "Marketing Management",
    objective: "Connect product, price, place and promotion decisions in one market situation.",
    maxMarks: 18,
    durationMinutes: 35,
    issuedAt: "2026-08-02T09:00:00.000Z",
    dueAt: "2026-08-09T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Read the case twice.", "Support each response with a case clue.", "Use marketing vocabulary precisely."],
    questions: [
      { prompt: "Identify two product decisions and explain their customer value.", marks: 4, answer: "Accept quality, packaging, branding, labelling or support linked to customer value." },
      { prompt: "Recommend a pricing approach for the launch and justify it.", marks: 4, answer: "Any feasible approach with target-market and objective linkage." },
      { prompt: "Design a two-channel distribution plan.", marks: 4, answer: "Award coverage, feasibility and channel coordination." },
      { prompt: "Create an ethical six-point promotion brief for the launch.", marks: 6, answer: "Award message, audience, media, evidence, ethics and call to action." },
    ],
  },
  {
    id: "demo-work-staffing-homework",
    attachmentId: "demo-paper-staffing-homework",
    classId: "demo-class-business",
    title: "Staffing Process Homework",
    description: "Sequence the staffing process and distinguish recruitment, selection and training decisions.",
    instructions: "Use the case facts to justify every stage selected.",
    type: "Homework",
    topic: "Staffing",
    objective: "Apply the staffing process to a growing service business.",
    maxMarks: 12,
    durationMinutes: 25,
    issuedAt: "2026-08-06T09:00:00.000Z",
    dueAt: "2026-08-14T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Use a flowchart for the process.", "Give one reason for each choice.", "Keep the case response practical."],
    questions: [
      { prompt: "Arrange seven staffing activities in the correct order.", marks: 4, answer: "Manpower planning, recruitment, selection, placement/orientation, training, appraisal, promotion/career planning." },
      { prompt: "Choose two recruitment sources for the case and justify them.", marks: 4, answer: "Award source suitability and case-based justification." },
      { prompt: "Recommend an on-the-job training method and explain its benefit.", marks: 4, answer: "Coaching, apprenticeship or internship with a relevant benefit." },
    ],
  },
  {
    id: "demo-work-business-environment-project",
    attachmentId: "demo-paper-business-environment-project",
    classId: "demo-class-business",
    title: "Business Environment Activity",
    description: "Investigate how one recent policy or technology shift affects a fictional local enterprise.",
    instructions: "Submit a one-page evidence map and a 250-word recommendation.",
    type: "Project",
    topic: "Business Environment",
    objective: "Trace opportunities and threats from external business-environment dimensions.",
    maxMarks: 20,
    durationMinutes: 90,
    issuedAt: "2026-08-07T09:00:00.000Z",
    dueAt: "2026-08-20T11:30:00.000Z",
    status: "DRAFT",
    generalInstructions: ["Use an original fictional enterprise.", "Separate evidence from inference.", "Cite sources in a simple reference list."],
    questions: [
      { prompt: "Create a five-dimension environment scan for the selected enterprise.", marks: 8, answer: "Award relevance, range and clear opportunity/threat classification." },
      { prompt: "Explain two likely interactions between the dimensions.", marks: 4, answer: "Award causal reasoning rather than isolated description." },
      { prompt: "Write a practical management response with risks and success measures.", marks: 8, answer: "Award feasibility, risk awareness and measurable outcomes." },
    ],
    rubric: ["Evidence quality: 5", "Application: 7", "Recommendation: 5", "Communication: 3"],
  },
  {
    id: "demo-work-pandas-assignment",
    attachmentId: "demo-paper-pandas-assignment",
    classId: "demo-class-ip",
    title: "Pandas DataFrame Assignment",
    description: "Create, filter and summarise a sales DataFrame using original data.",
    instructions: "Include code, output and one sentence interpreting each result.",
    type: "Assignment",
    topic: "Pandas DataFrames",
    objective: "Use DataFrame selection, aggregation and missing-value handling accurately.",
    maxMarks: 20,
    durationMinutes: 60,
    issuedAt: "2026-07-12T09:00:00.000Z",
    dueAt: "2026-07-19T11:30:00.000Z",
    status: "CLOSED",
    generalInstructions: ["Use meaningful variable names.", "Show output below each code block.", "Do not use an external dataset."],
    questions: [
      { prompt: "Create the specified DataFrame and set InvoiceID as its index.", marks: 4, answer: "Award correct columns, values, index and display." },
      { prompt: "Filter orders above Rs. 5,000 from the West region.", marks: 4, answer: "Use a compound Boolean condition with loc or equivalent." },
      { prompt: "Calculate region-wise total and average sales.", marks: 5, answer: "Use groupby with sum and mean." },
      { prompt: "Handle the missing discount values and explain the chosen strategy.", marks: 4, answer: "Accept a justified fill or removal strategy." },
      { prompt: "Write three business observations from the output.", marks: 3, answer: "Observations must be accurate, specific and supported by output." },
    ],
  },
  {
    id: "demo-work-sql-practice",
    attachmentId: "demo-paper-sql-practice",
    classId: "demo-class-ip",
    title: "SQL Query Practice",
    description: "Write selection, grouping and join queries for a school activity database.",
    instructions: "Write standard MySQL syntax and show the expected column headings.",
    type: "Assignment",
    topic: "SQL Queries",
    objective: "Construct correct SQL queries using filters, aggregates and joins.",
    maxMarks: 20,
    durationMinutes: 50,
    issuedAt: "2026-08-01T09:00:00.000Z",
    dueAt: "2026-08-11T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Use only the schema shown.", "Terminate every query with a semicolon.", "Use aliases where they improve clarity."],
    questions: [
      { prompt: "Display activity names with fees between 500 and 1,500 in descending fee order.", marks: 4, answer: "SELECT ... WHERE Fee BETWEEN 500 AND 1500 ORDER BY Fee DESC;" },
      { prompt: "Show the number of registrations for each activity.", marks: 4, answer: "Use GROUP BY ActivityID and COUNT(*)." },
      { prompt: "List student names with their registered activity using an inner join.", marks: 5, answer: "Join Student, Registration and Activity on their keys." },
      { prompt: "Display activities whose average participant age is above 16.", marks: 4, answer: "Use GROUP BY with HAVING AVG(Age) > 16." },
      { prompt: "Explain the difference between WHERE and HAVING using this schema.", marks: 3, answer: "WHERE filters rows before grouping; HAVING filters groups after aggregation." },
    ],
  },
  {
    id: "demo-work-data-visualization-classwork",
    attachmentId: "demo-paper-data-visualization-classwork",
    classId: "demo-class-ip",
    title: "Data Visualization Classwork",
    description: "Select suitable charts and create labelled Matplotlib visualisations from summary data.",
    instructions: "Complete during class and include readable titles, axes and legends.",
    type: "Classwork",
    topic: "Data Visualization",
    objective: "Choose and construct charts that communicate a data relationship clearly.",
    maxMarks: 15,
    durationMinutes: 35,
    issuedAt: "2026-08-07T04:00:00.000Z",
    dueAt: "2026-08-07T06:00:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Use the supplied summary table.", "Label every chart fully.", "Add one interpretation below each chart."],
    questions: [
      { prompt: "Create a bar chart comparing quarterly sales across four regions.", marks: 6, answer: "Award correct data, chart type, labels, title and readability." },
      { prompt: "Create a line chart showing monthly website visits.", marks: 5, answer: "Award correct sequence, markers, labels and suitable scale." },
      { prompt: "Explain why a pie chart is unsuitable for the monthly trend.", marks: 4, answer: "A pie chart shows composition, not change over ordered time." },
    ],
  },
  {
    id: "demo-work-english-practice",
    attachmentId: "demo-paper-english-practice",
    classId: "demo-class-english",
    title: "Comprehension and Writing Skills Practice",
    description: "Original reading, analytical short answers and a formal writing task.",
    instructions: "Read the passage carefully and use your own words unless quoting a key phrase.",
    type: "Practice",
    topic: "Reading and Writing Skills",
    objective: "Infer meaning from an original passage and communicate a purposeful formal response.",
    maxMarks: 20,
    durationMinutes: 50,
    issuedAt: "2026-08-04T09:00:00.000Z",
    dueAt: "2026-08-13T11:30:00.000Z",
    status: "PUBLISHED",
    generalInstructions: ["Answer in your own words.", "Observe the stated word limit.", "Use an appropriate formal tone."],
    questions: [
      { prompt: "Read the original passage about a student-led repair cafe and identify its central idea.", marks: 3, answer: "Community repair develops practical skill while reducing waste and changing attitudes to consumption." },
      { prompt: "Explain two inferences about how the volunteers learned from failure.", marks: 4, answer: "Accept evidence-based inferences about iteration, collaboration and confidence." },
      { prompt: "Rewrite the three supplied sentences to correct agreement, tense and parallelism.", marks: 3, answer: "One mark per accurate grammatical revision." },
      { prompt: "Write a 120-150 word letter to the school principal proposing a monthly repair-and-reuse club.", marks: 6, answer: "Assess format, content, organisation and expression." },
      { prompt: "Answer two theme-based questions on responsibility and community action.", marks: 4, answer: "Award relevant interpretation supported with details from the passage." },
    ],
  },
];

export type DemoQuiz = {
  id: string;
  classId: string;
  title: string;
  description: string;
  topic: string;
  published: boolean;
  timeLimit: number;
  questions: Array<Required<Pick<DemoQuestion, "prompt" | "marks" | "answer" | "options">>>;
};

export const DEMO_QUIZZES: DemoQuiz[] = [
  {
    id: "demo-quiz-partnership-concepts",
    classId: "demo-class",
    title: "Partnership Concepts Quiz",
    description: "A quick check on deed provisions, goodwill and partner ratios.",
    topic: "Partnership Fundamentals",
    published: true,
    timeLimit: 12,
    questions: [
      { prompt: "When a partnership deed is silent, profits are shared:", options: ["In capital ratio", "Equally", "In old ratio", "By seniority"], answer: "Equally", marks: 1 },
      { prompt: "The sacrificing ratio is calculated as:", options: ["New ratio minus old ratio", "Old ratio minus new ratio", "Capital ratio minus new ratio", "Gaining ratio plus old ratio"], answer: "Old ratio minus new ratio", marks: 1 },
      { prompt: "A general reserve existing before admission belongs to:", options: ["All partners including the new partner", "The new partner only", "The old partners", "The firm's creditors"], answer: "The old partners", marks: 1 },
      { prompt: "Goodwill brought in cash is credited to sacrificing partners in:", options: ["New ratio", "Sacrificing ratio", "Old ratio", "Capital ratio"], answer: "Sacrificing ratio", marks: 1 },
    ],
  },
  {
    id: "demo-quiz-money-banking",
    classId: "demo-class-economics",
    title: "Money and Banking Quiz",
    description: "Check money functions, central-bank tools and commercial-bank credit creation.",
    topic: "Money and Banking",
    published: true,
    timeLimit: 10,
    questions: [
      { prompt: "Which function of money allows value to be transferred into the future?", options: ["Medium of exchange", "Unit of account", "Store of value", "Standard of deferred payment"], answer: "Store of value", marks: 1 },
      { prompt: "An increase in the repo rate is generally intended to:", options: ["Make borrowing cheaper", "Reduce the cost of credit", "Moderate credit growth", "Increase currency printing"], answer: "Moderate credit growth", marks: 1 },
      { prompt: "With a legal reserve ratio of 25 percent, the simple deposit multiplier is:", options: ["2", "4", "5", "25"], answer: "4", marks: 1 },
      { prompt: "Open-market sale of securities by the central bank tends to:", options: ["Add liquidity", "Reduce liquidity", "Reduce taxes", "Raise exports directly"], answer: "Reduce liquidity", marks: 1 },
    ],
  },
  {
    id: "demo-quiz-staffing",
    classId: "demo-class-business",
    title: "Staffing Quiz",
    description: "A concept check on recruitment, selection, training and appraisal.",
    topic: "Staffing",
    published: true,
    timeLimit: 10,
    questions: [
      { prompt: "The positive process of searching for prospective employees is:", options: ["Selection", "Recruitment", "Placement", "Appraisal"], answer: "Recruitment", marks: 1 },
      { prompt: "Which is an internal source of recruitment?", options: ["Campus placement", "Employment exchange", "Promotion", "Web advertisement"], answer: "Promotion", marks: 1 },
      { prompt: "Training on equipment similar to the actual workplace occurs in:", options: ["Vestibule training", "Induction", "Job rotation", "Conference training"], answer: "Vestibule training", marks: 1 },
      { prompt: "Performance appraisal primarily compares performance with:", options: ["Personal preference", "Predetermined standards", "Competitor salaries", "Recruitment cost"], answer: "Predetermined standards", marks: 1 },
    ],
  },
  {
    id: "demo-quiz-computer-networks",
    classId: "demo-class-ip",
    title: "Computer Networks Quiz",
    description: "Check network types, protocols, addressing and responsible online practice.",
    topic: "Computer Networks",
    published: true,
    timeLimit: 10,
    questions: [
      { prompt: "Which protocol securely transfers web pages?", options: ["HTTP", "HTTPS", "FTP", "SMTP"], answer: "HTTPS", marks: 1 },
      { prompt: "A network covering a school campus is commonly a:", options: ["PAN", "LAN", "MAN", "WAN"], answer: "LAN", marks: 1 },
      { prompt: "Which device forwards packets between different networks?", options: ["Switch", "Router", "Repeater", "NIC"], answer: "Router", marks: 1 },
      { prompt: "A strong defence against deceptive login links is to:", options: ["Reuse one password", "Verify the domain before signing in", "Disable updates", "Share OTPs only with friends"], answer: "Verify the domain before signing in", marks: 1 },
    ],
  },
  {
    id: "demo-quiz-english-reading",
    classId: "demo-class-english",
    title: "English Grammar and Reading Quiz",
    description: "A short diagnostic on inference, agreement, connectors and formal tone.",
    topic: "Language Accuracy",
    published: false,
    timeLimit: 12,
    questions: [
      { prompt: "An inference is best described as:", options: ["A copied sentence", "A conclusion supported by clues", "A title", "A dictionary definition"], answer: "A conclusion supported by clues", marks: 1 },
      { prompt: "Choose the sentence with correct subject-verb agreement.", options: ["The list of tasks are ready.", "The list of tasks is ready.", "The lists of task is ready.", "The task list were ready."], answer: "The list of tasks is ready.", marks: 1 },
      { prompt: "Which connector signals contrast?", options: ["Therefore", "Similarly", "However", "Moreover"], answer: "However", marks: 1 },
      { prompt: "Which closing is most suitable for a formal proposal?", options: ["Catch you later", "Yours sincerely", "Bye for now", "Cheers buddy"], answer: "Yours sincerely", marks: 1 },
    ],
  },
];

export type DemoResource = {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: "Notes" | "Worksheet" | "Question Paper" | "Reference" | "Revision";
  sections: Array<{ heading: string; body: string[] }>;
};

export const DEMO_RESOURCES: DemoResource[] = [
  {
    id: "demo-resource-partnership-revision",
    classId: "demo-class",
    title: "Partnership Revision Sheet",
    description: "A compact sequence of ratios, goodwill, revaluation and capital-account checks.",
    type: "Revision",
    sections: [
      { heading: "Ratio checklist", body: ["New ratio: recompute every partner's share.", "Sacrificing ratio: old ratio minus new ratio.", "Gaining ratio: new ratio minus old ratio."] },
      { heading: "Goodwill decision", body: ["Identify who compensates whom.", "Use the relevant sacrificing or gaining ratio.", "Check whether goodwill is raised, retained or adjusted through capitals."] },
      { heading: "Final audit", body: ["Transfer reserves to entitled partners.", "Close revaluation profit or loss.", "Verify every capital balance independently."] },
    ],
  },
  {
    id: "demo-resource-bop-revision",
    classId: "demo-class-economics",
    title: "Balance of Payments Revision",
    description: "Current account, capital account, exchange rate and reserve-flow revision map.",
    type: "Revision",
    sections: [
      { heading: "Current account", body: ["Goods, services, primary income and transfers.", "Exports and receipts are credits; imports and payments are debits."] },
      { heading: "Capital and financial flows", body: ["Foreign investment, loans and banking capital.", "Distinguish autonomous motives from accommodating reserve changes."] },
      { heading: "Practice prompts", body: ["Classify six transactions.", "Explain one cause of current-account deficit.", "Trace the effect of currency depreciation with assumptions."] },
    ],
  },
  {
    id: "demo-resource-mysql-python",
    classId: "demo-class-ip",
    title: "MySQL + Python Exercise",
    description: "A guided parameterised-query exercise using a fictional school events database.",
    type: "Worksheet",
    sections: [
      { heading: "Connection task", body: ["Read credentials from environment variables.", "Open one connection and close cursor and connection reliably.", "Do not concatenate user input into SQL."] },
      { heading: "Query task", body: ["Accept a maximum fee from the user.", "Execute a parameterised SELECT query.", "Display event name, date and fee in aligned columns."] },
      { heading: "Reflection", body: ["Explain how parameterisation reduces injection risk.", "Describe one useful exception-handling boundary."] },
    ],
  },
  {
    id: "demo-resource-english-revision",
    classId: "demo-class-english",
    title: "English Grammar and Theme Revision",
    description: "Original editing practice, short-answer planning and theme-evidence prompts.",
    type: "Revision",
    sections: [
      { heading: "Editing sprint", body: ["Correct tense consistency in four sentences.", "Repair two pronoun-reference errors.", "Combine ideas using contrast and consequence connectors."] },
      { heading: "Short-answer frame", body: ["Make a direct claim.", "Add one precise supporting detail.", "Explain how the detail proves the claim."] },
      { heading: "Theme prompts", body: ["How can small acts create community trust?", "When does persistence become more valuable than immediate success?", "How does responsible choice affect people beyond the individual?"] },
    ],
  },
];

export type DemoSubmission = {
  id: string;
  assignmentId: string;
  studentKey: string;
  status: SubmissionStatus;
  note: string;
  submittedAt: string | null;
  pageCount: number;
  marks: number | null;
  resultPublished: boolean;
  feedback: string | null;
};

const submissionNotes = [
  "I completed the numerical work first and added a short check below each final answer.",
  "My response includes the working table and the case evidence used for each point.",
  "I corrected the first calculation after checking the formula and kept both steps visible.",
  "I completed the main questions but marked one part where I was unsure about the final treatment.",
  "I used headings for each answer and added a one-sentence interpretation of the result.",
  "I revised this attempt using the class checklist and made the final explanation more specific.",
];

const feedbackOpeners = [
  "Correct method. Recheck the final calculation.",
  "Strong understanding. Show complete working for the longer question.",
  "Good improvement from your previous assessment.",
  "Review the treatment of goodwill before retrying.",
  "Clear explanation, but support your answer with one more point.",
  "Your structure is effective. Tighten the final conclusion.",
];

export function buildDemoSubmissions(): DemoSubmission[] {
  const records: DemoSubmission[] = [];
  const activeAssignments = DEMO_ASSIGNMENTS.filter((item) => item.status !== "DRAFT");
  for (const [assignmentIndex, assignment] of activeAssignments.entries()) {
    for (const [studentIndex, student] of DEMO_STUDENTS.entries()) {
      const completionSignal = (assignmentIndex * 17 + studentIndex * 23 + 11) % 100;
      if (completionSignal >= student.completionRate) continue;
      const isCurrent = assignment.status === "PUBLISHED";
      const inProgress = isCurrent && (assignmentIndex + studentIndex) % 13 === 0;
      const pendingReview = !inProgress && (assignmentIndex * 2 + studentIndex) % 7 === 0;
      const reviewed = !inProgress && !pendingReview && (assignmentIndex + studentIndex * 2) % 6 === 0;
      const status: SubmissionStatus = inProgress
        ? "DRAFT"
        : pendingReview
          ? "SUBMITTED"
          : reviewed
            ? "REVIEWED"
            : "PUBLISHED";
      const due = new Date(assignment.dueAt);
      const late = status !== "DRAFT" && (assignmentIndex + studentIndex + 1) % student.lateEvery === 0;
      const submittedAt = status === "DRAFT"
        ? null
        : new Date(due.getTime() + (late ? 7 : -18) * 60 * 60 * 1000).toISOString();
      const improvement = student.key === "vivaan" ? Math.min(12, assignmentIndex) : 0;
      const variation = ((assignmentIndex * 7 + studentIndex * 5) % 13) - 6;
      const percentage = Math.max(38, Math.min(97, student.baseScore + improvement + variation));
      const marks = ["REVIEWED", "PUBLISHED"].includes(status)
        ? Math.min(assignment.maxMarks, Math.max(0, Math.round((assignment.maxMarks * percentage) / 100 * 2) / 2))
        : null;
      const feedback = marks === null
        ? null
        : `${feedbackOpeners[(assignmentIndex + studentIndex) % feedbackOpeners.length]} Focus next on ${student.improvements[(assignmentIndex + studentIndex) % student.improvements.length]}.`;
      records.push({
        id: `demo-submission-${assignment.id.replace("demo-work-", "")}-${student.key}`,
        assignmentId: assignment.id,
        studentKey: student.key,
        status,
        note: `${submissionNotes[(assignmentIndex + studentIndex) % submissionNotes.length]} Strength used: ${student.strengths[(assignmentIndex + studentIndex) % student.strengths.length]}.`,
        submittedAt,
        pageCount: status === "DRAFT" ? 1 : 1 + ((assignmentIndex + studentIndex) % 3 === 0 ? 1 : 0),
        marks,
        resultPublished: status === "PUBLISHED",
        feedback,
      });
    }
  }
  return records;
}

export type DemoAttendance = {
  classId: string;
  studentKey: string;
  date: string;
  status: AttendanceStatus;
};

export function buildDemoAttendance(): DemoAttendance[] {
  const dates = ["2026-07-10", "2026-07-14", "2026-07-18", "2026-07-22", "2026-07-26", "2026-07-30", "2026-08-03", "2026-08-06"];
  return DEMO_CLASSES.flatMap((classroom, classIndex) =>
    dates.flatMap((date, dateIndex) =>
      DEMO_STUDENTS.map((student, studentIndex) => {
        const signal = (classIndex * 5 + dateIndex * 3 + studentIndex * 7) % 19;
        const status: AttendanceStatus = student.key === "kabir" && signal < 4
          ? "ABSENT"
          : signal === 5 || (student.key === "vivaan" && dateIndex === 1)
            ? "LATE"
            : signal === 9
              ? "EXCUSED"
              : "PRESENT";
        return { classId: classroom.id, studentKey: student.key, date, status };
      }),
    ),
  );
}

export function demoQuizQuestionId(quizId: string, index: number) {
  return `${quizId}-question-${index + 1}`;
}

export function demoQuizAttemptId(quizId: string, studentKey: string) {
  return `${quizId}-attempt-${studentKey}`;
}

export function demoQuizAttempts() {
  return DEMO_QUIZZES.filter((quiz) => quiz.published).flatMap((quiz, quizIndex) =>
    DEMO_STUDENTS.flatMap((student, studentIndex) => {
      if ((quizIndex * 13 + studentIndex * 11) % 100 >= student.completionRate) return [];
      const correctTarget = Math.max(1, Math.min(quiz.questions.length, Math.round((student.baseScore + (student.key === "vivaan" ? quizIndex * 4 : 0)) / 100 * quiz.questions.length)));
      const answers = Object.fromEntries(
        quiz.questions.map((question, questionIndex) => [
          demoQuizQuestionId(quiz.id, questionIndex),
          questionIndex < correctTarget ? question.answer : question.options.find((option) => option !== question.answer)!,
        ]),
      );
      return [{
        id: demoQuizAttemptId(quiz.id, student.key),
        quizId: quiz.id,
        studentKey: student.key,
        answers,
        score: quiz.questions.slice(0, correctTarget).reduce((sum, question) => sum + question.marks, 0),
        submittedAt: new Date(Date.UTC(2026, 6, 22 + quizIndex * 4, 8 + studentIndex)).toISOString(),
      }];
    }),
  );
}

export const DEMO_PDF_DOCUMENT_KEYS = [
  ...DEMO_ASSIGNMENTS.map((item) => `assignment:${item.id}`),
  ...DEMO_QUIZZES.map((item) => `quiz:${item.id}`),
  ...DEMO_RESOURCES.map((item) => `resource:${item.id}`),
  ...DEMO_STUDENTS.map((item) => `report:${item.profileId}`),
  ...buildDemoSubmissions().map((item) => `submission:${item.id}`),
] as const;

export function demoClassById(id: string) {
  return DEMO_CLASSES.find((item) => item.id === id);
}

export function demoAssignmentById(id: string) {
  return DEMO_ASSIGNMENTS.find((item) => item.id === id);
}

export function demoQuizById(id: string) {
  return DEMO_QUIZZES.find((item) => item.id === id);
}

export function demoResourceById(id: string) {
  return DEMO_RESOURCES.find((item) => item.id === id);
}
