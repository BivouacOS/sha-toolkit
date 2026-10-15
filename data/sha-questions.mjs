/**
 * SHA 2025 Part A — Separation Health Assessment self-assessment questions.
 * Transcribed from the blank DoD form (14 pp.). Section I identifiers
 * (name, SSN, DoD ID, contact, personal) are deliberately absent: they are
 * collected only as scrub patterns in private-ids.txt / local.config.mjs.
 *
 * options: the answers the form offers. "Explain" (free text) is always
 * allowed in addition and is not listed. '(free text)' marks a write-in field.
 * likelyDCs: 38 CFR Part 4 diagnostic codes a Yes most often leads to.
 */
const YN = ['Yes', 'No'];
const YNU = ['Yes', 'No', 'Unsure'];
const FREE = ['(free text)'];
const FREQ = ['Not At All', 'Several Days', 'More Than Half the Days', 'Nearly Every Day'];
const BINGE = ['Never', 'Less than monthly', 'Monthly', 'Weekly', 'Daily, or almost daily'];

export const shaSections = [
  { id: 'I.3', title: 'Occupational Information' },
  { id: 'I.4', title: 'Examination Information' },
  { id: 'II.1', title: 'General Medical Review', intro: 'From question 10 on: during qualifying military service, have you ever experienced:' },
  { id: 'II.2', title: 'Joint, Spine, & Musculo-Skeletal System', intro: 'During qualifying military service, have you ever experienced pain and/or injury in the following:' },
  { id: 'II.3', title: 'Health & Wellness' },
  { id: 'II.4', title: 'Hearing' },
  { id: 'II.5', title: 'Vision', intro: 'From question 2 on: during qualifying military service, have you ever experienced:' },
  { id: 'II.6', title: 'Head Injury', intro: 'During qualifying military service:' },
  { id: 'II.7', title: 'Environmental/Occupational', intro: 'Exposures while deployed, in training, or during other assignments: burn pits, oil well fires, burning trash, dust storms, air pollution, explosions, fuels/fumes, pesticides, cleaning agents, solvents, heavy metals/depleted uranium, nerve agents, protective medications and vaccines, PCBs, asbestos, radiation, contaminated food or water.' },
  { id: 'II.8', title: 'Dental' },
  { id: 'II.9', title: "Women's Health / Female Reproductive Organs", appliesTo: 'female' },
  { id: 'II.10.1', title: 'PTSD Screen', intro: 'Sometimes things happen to people that are unusually or especially frightening, horrible, or traumatic. In the past month, have you...' },
  { id: 'II.10.2', title: 'Depression Screen', intro: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?' },
  { id: 'II.10.3', title: 'Alcohol Use Screen' },
];

const q = (section, num, text, options = YN, likelyDCs = []) =>
  ({ id: `${section}.${num}`, section, num, text, options, likelyDCs });

const LUNG = ['6600', '6602', '6845'];
const CARDIAC = ['7005'];
const EXPOSURE = ['6604', '6602', '6845'];
const EYE = ['6066', '6006'];
const HEAR = ['6100', '6260'];

export const shaQuestions = [
  // ── I.3 Occupational Information ──────────────────────────────────────────
  q('I.3', 1, 'Service', ['Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard', 'Other']),
  q('I.3', 2, 'Component', ['Active Duty', 'Reserve', 'National Guard']),
  q('I.3', 3, 'Duty Status', ['Active Component', 'Active Duty – non AGR', 'Active Duty – AGR', 'Not on active duty']),
  q('I.3', 4, 'Usual Occupation (most recent day-to-day job)', FREE),
  q('I.3', 5, 'What is your military occupational code (for example: MOS, AOC, AFSC, NEC, or Designator Code)?', FREE),

  // ── I.4 Examination Information ───────────────────────────────────────────
  q('I.4', 1, 'Exam Date (if known) (YYYYMMDD)', FREE),
  q('I.4', 2, 'Purpose of Exam', ['Separation from period of active service', 'Separation from military service', 'Medical Board', 'Retirement', 'Other']),
  q('I.4', 3, 'Provide date or anticipated date of release from Active Duty (YYYYMMDD)', FREE),
  q('I.4', 4, 'Do you intend to file a claim, or have you already filed a claim, for disability compensation with the Veterans Benefits Administration?', YN),
  q('I.4', 5, 'Select the type of claim program/process', ['Fully Developed Claim (FDC) Program', 'IDES (Integrated Disability Evaluation System)', 'BDD (Benefits Delivery at Discharge)', 'Standard Claim Process', 'Not sure']),
  q('I.4', 6, 'Have you ever filed a disability claim with the VA?', YN),
  q('I.4', 7, 'Have you had a physical exam within 12 months before your separation date? (If yes: date (YYYYMM), type of exam, and whether you would like it reviewed to determine if it meets the separation health assessment requirements.)', YNU),

  // ── II.1 General Medical Review ───────────────────────────────────────────
  q('II.1', 1, 'List your current medications, including supplements.', FREE),
  q('II.1', 2, 'Date of your most recent military service medical assessment/physical exam (YYYYMMDD). Compared to that exam, your overall health is:', ['The Same', 'Better', 'Worse']),
  q('II.1', 3, 'Overall, how would you rate your health during the PAST MONTH?', ['The Same', 'Better', 'Worse']),
  q('II.1', 4, 'During the PAST MONTH, did you have physical health problems (illness or injury) that made it difficult for you to do your work or other regular daily activities?'),
  q('II.1', 5, 'Do you currently require hearing aids, special medical supplies, Continuous Positive Airway Pressure (CPAP), adaptive equipment, assistive technology devices, and/or other special accommodations?', YN, ['6847', '6100']),
  q('II.1', 6, 'Have you had any surgery since your last health assessment/exam? (Include privately paid elective surgeries.)'),
  q('II.1', 7, 'Since your last health assessment/exam, has a health care provider recommended surgery(s) that you have not had (whether you are planning to have it or not)?'),
  q('II.1', 8, 'Since your last health assessment/exam, have you received care or treatment for any medical and/or mental health condition(s) from a CIVILIAN or NON-MILITARY facility? This includes privately paid treatments and/or procedures (for example: photorefractive keratectomy (PRK), wisdom teeth removal, vasectomy, botox).'),
  q('II.1', 9, 'Have you suffered from any injury or illness while on active duty for which you did not seek medical care (to include mental health)?'),
  q('II.1', 10, 'Allergies, including environmental and occupational allergies, and adverse reaction to serum, food, insect stings, or medicine.'),
  q('II.1', 11, 'High or bad cholesterol'),
  q('II.1', 12, 'Tuberculosis'),
  q('II.1', 13, 'Coughing up blood', YN, LUNG),
  q('II.1', 14, 'Asthma', YN, ['6602']),
  q('II.1', 15, 'Bronchitis', YN, LUNG),
  q('II.1', 16, 'Chronic cough or cough at night', YN, LUNG),
  q('II.1', 17, 'Wheezing, shortness of breath, or difficulty breathing (other than asthma)', YN, LUNG),
  q('II.1', 18, 'Other lung problems (for example: Chronic Obstructive Pulmonary Disease (COPD), chronic bronchitis, pneumonia, emphysema)', YN, LUNG),
  q('II.1', 19, 'Sinusitis', YN, ['6513']),
  q('II.1', 20, 'Thyroid trouble or goiter'),
  q('II.1', 21, 'Ear, nose, or throat trouble', YN, ['6260', '6100']),
  q('II.1', 22, 'Frequent indigestion or heartburn (reflux)', YN, ['7206', '7346']),
  q('II.1', 23, 'Stomach or intestinal problems (for example: ulcer)', YN, ['7319']),
  q('II.1', 24, 'Kidney problems (for example: stones, infection)', YN, ['7508']),
  q('II.1', 25, 'Liver problems (for example: hepatitis, cirrhosis)'),
  q('II.1', 26, 'Constipation, loose bowels, or diarrhea', YN, ['7319']),
  q('II.1', 27, 'Gallbladder trouble or gallstones'),
  q('II.1', 28, 'Hernia', YN, ['7338', '7346']),
  q('II.1', 29, 'Rectal disease, hemorrhoids, or blood from rectum', YN, ['7336']),
  q('II.1', 30, 'Frequent or painful urination or blood in urine', YN, ['7542', '7512']),
  q('II.1', 31, 'High or low blood sugar'),
  q('II.1', 32, 'Sugar or protein in urine'),
  q('II.1', 33, 'Diabetes', YN, ['7913']),
  q('II.1', 34, 'Recent unexplained gain or loss of weight'),
  q('II.1', 35, 'A head injury, memory loss, or amnesia', YN, ['8045']),
  q('II.1', 36, 'Recurring headaches/migraines; frequent or severe headaches', YN, ['8100']),
  q('II.1', 37, 'Periods of dizziness, fainting, or loss of consciousness', YN, ['6204']),
  q('II.1', 38, 'Mental health problems (for example: depression, anxiety, Post-Traumatic Stress Disorder (PTSD), worry, or other mental health diagnosis)', YN, ['9411', '9400', '9434']),
  q('II.1', 39, 'Neurological problems (for example: stroke, seizures, convulsions, epilepsy, fits, tremor)', YN, ['8045', '8910']),
  q('II.1', 40, 'Paralysis'),
  q('II.1', 41, 'Meningitis, encephalitis, or other neurological infection or disorder'),
  q('II.1', 42, 'Rheumatic fever'),
  q('II.1', 43, 'Prolonged bleeding'),
  q('II.1', 44, 'Blood problems (for example: hemophilia, sickle cell disease)'),
  q('II.1', 45, 'Immune system problems (for example: HIV, chemotherapy, radiation)'),
  q('II.1', 46, 'Angina, also called angina pectoris', YN, CARDIAC),
  q('II.1', 47, 'Congestive Heart Failure', YN, CARDIAC),
  q('II.1', 48, 'Pain, pressure, or discomfort in your chest', YN, CARDIAC),
  q('II.1', 49, 'Palpitations, pounding heart, or abnormal heartbeat', YN, CARDIAC),
  q('II.1', 50, 'Heart murmur or valve problem (for example: mitral valve prolapse)', YN, CARDIAC),
  q('II.1', 51, 'Coronary heart disease', YN, CARDIAC),
  q('II.1', 52, 'Heart attack (also called myocardial infarction)', YN, CARDIAC),
  q('II.1', 53, 'High blood pressure', YN, ['7101']),
  q('II.1', 54, 'Low blood pressure'),
  q('II.1', 55, 'Skin diseases (other than cancer)', YN, ['7806', '7804', '7819']),
  q('II.1', 56, 'Cancer (other than skin)'),
  q('II.1', 57, 'Skin cancer'),

  // ── II.2 Joint, Spine, & Musculo-Skeletal System ──────────────────────────
  q('II.2', 1, 'Head and Neck', YN, ['5237']),
  q('II.2', 2, 'Back and Chest', YN, ['5237', '5243']),
  q('II.2', 3, 'Shoulder/Arm', YN, ['5201']),
  q('II.2', 4, 'Elbow/Forearm', YN, ['5206']),
  q('II.2', 5, 'Wrist/Hand/Fingers', YN, ['5215']),
  q('II.2', 6, 'Hip/Thigh', YN, ['5252']),
  q('II.2', 7, 'Leg/Knee', YN, ['5260', '5257']),
  q('II.2', 8, 'Ankle/Foot/Toes', YN, ['5271', '5276', '5284']),

  // ── II.3 Health & Wellness ────────────────────────────────────────────────
  q('II.3', 1, 'Do you currently use tobacco products (cigarettes, cigars, pipes, etc.), electronic nicotine products (e-cigarette/JUUL, e-hookah, vape-pen, vaporizer, tank system, other similar nicotine products), smokeless tobacco products (chewing tobacco, snuff, dip, snus, or dissolvable tobacco)?'),
  q('II.3', 2, 'Have you smoked at least 100 cigarettes in your entire life? (A pack typically contains 20 cigarettes. If no, skip to question 5.)'),
  q('II.3', 3, 'During the past 12 months, have you ever tried to stop smoking?'),
  q('II.3', 4, 'Have you ever had a serious health problem that was caused or made worse by smoking?', YN, ['6604']),
  q('II.3', 5, 'During the past 12 months, how often were you exposed to secondhand smoke indoors (home, work, vehicle, etc.) or vapor indoors from a person using an e-cigarette or similar nicotine product?', ['Daily', 'Less than daily', 'Not at all']),
  q('II.3', 6, 'Do you have any concerns with past use of recreational drugs or misuse of prescription drugs?'),

  // ── II.4 Hearing ──────────────────────────────────────────────────────────
  q('II.4', 1, 'During qualifying military service have you ever had, or do you now have, persistent or recurring noises in your head or ears? (for example: ringing, buzzing, humming)', YN, ['6260']),
  q('II.4', 2, 'During qualifying military service have you ever had, or do you now have, a change in your hearing that impacts duty performance?', YN, HEAR),
  q('II.4', 3, 'Do you currently, or have you ever worn, a hearing aid?', YN, HEAR),
  q('II.4', 4, 'During your deployment or during military training, were you exposed to loud noises, to include blasts, that resulted in a temporary or permanent decrease in hearing and/or ringing, humming, buzzing sounds in your ears or head? (If yes: how many times, for how long, describe the exposure and any symptoms you are still experiencing.)', YN, HEAR),

  // ── II.5 Vision ───────────────────────────────────────────────────────────
  q('II.5', 1, 'Do you wear corrective lenses (glasses or contacts)?'),
  q('II.5', 2, 'Eye disorder or trouble', YN, EYE),
  q('II.5', 3, 'Surgery to correct vision'),
  q('II.5', 4, 'Loss of vision in either eye', YN, EYE),
  q('II.5', 5, 'Double vision (diplopia)', YN, EYE),
  q('II.5', 6, 'Change in your vision that impacts your duty performance', YN, EYE),

  // ── II.6 Head Injury ──────────────────────────────────────────────────────
  q('II.6', 1, 'As a result of any injury or event, did you receive a jolt or blow to your head that IMMEDIATELY resulted in: losing consciousness ("knocked out"); losing memory of events before or after the injury; or seeing stars, becoming disoriented, functioning differently, or nearly blacking out? (Check all that apply.)', ['Yes', 'No', 'Not Applicable'], ['8045']),
  q('II.6', 2, 'How many total times did you receive a jolt or blow to your head?', FREE, ['8045']),
  q('II.6', 3, 'Have you ever experienced a head injury, concussion, or Traumatic Brain Injury (TBI)?', YN, ['8045']),
  q('II.6', 4, 'As a result of any injury or event where you received a jolt or blow to your head, or were diagnosed with a TBI: have you had prolonged symptoms that have not resolved? Are you currently experiencing any prolonged symptoms that have not resolved?', YN, ['8045']),

  // ── II.7 Environmental/Occupational ───────────────────────────────────────
  q('II.7', 1, 'Were you potentially exposed to any occupational/environmental hazards (described above) while in a qualifying military duty service?', YNU, EXPOSURE),
  q('II.7', 2, 'Have you been based or stationed at a location where an open burn pit was used?', YNU, EXPOSURE),
  q('II.7', 3, 'Have you been potentially exposed to toxic airborne chemicals or other airborne contaminants?', YNU, EXPOSURE),
  q('II.7', 4, 'If 2 or 3 is "Yes" or "Unsure," have you enrolled in the Airborne Hazards and Open Burn Pit Registry?', ['Yes', 'No', 'Not Applicable']),
  q('II.7', 5, 'Federal law requires eligible members to enroll in the Airborne Hazards and Open Burn Pit Registry or to opt out. If eligible, I wish to:', ['Enroll', 'Opt out', 'Not Applicable']),
  q('II.7', 6, 'While deployed, were you potentially exposed to other deployment-related hazards? (Medications to prevent malaria including Mefloquine; a vaccine with a possible complication; firefighting foam; solvents or other chemicals that may have caused skin reactions, breathing problems, or other concerns.)', YNU, EXPOSURE),
  q('II.7', 7, 'During any part of your qualifying military service, were you exposed to any of the following? (check all that apply): Fuels; Contaminated water; Radiation (including possible depleted uranium); Embedded shrapnel; Other exposures of possible concern; Unsure', FREE, EXPOSURE),
  q('II.7', 8, 'If you checked any exposures in question 7, including "unsure," please explain your exposure concerns, being as specific as possible.', FREE, EXPOSURE),
  q('II.7', 9, 'Are you currently participating in any specialty occupational exposure examinations?'),
  q('II.7', 10, 'During qualifying military service, have you ever experienced a blast or explosion?', YN, ['8045', '6260']),
  q('II.7', 11, 'During qualifying military service, have you ever experienced a vehicular accident/crash (any vehicle including aircraft)?'),
  q('II.7', 12, 'During qualifying military service, have you ever experienced a fragment wound or bullet wound?', YN, ['7804']),

  // ── II.8 Dental ───────────────────────────────────────────────────────────
  q('II.8', 1, 'Do you currently have any dental problems that need to be evaluated?'),
  q('II.8', 2, 'Have you ever been diagnosed or treated for oral cancer?'),
  q('II.8', 3, 'During qualifying military service, have you ever had a dental examination where you were told you had a Temporomandibular Disorder (TMD) or Temporomandibular Joint (TMJ) problem?', YN, ['9905']),
  q('II.8', 4, 'During qualifying military service, has your jaw locked open and you could not close the jaw?', YN, ['9905']),
  q('II.8', 5, 'During qualifying military service, have you had loss of a portion of the bone in your upper or lower jaw due to trauma or disease such as osteomyelitis or necrosis?', YN, ['9913']),
  q('II.8', 6, 'During qualifying military service, have you had loss of any teeth because of service-related trauma?', YN, ['9913']),
  q('II.8', 7, 'During qualifying military service, have you had physical (anatomical) loss or injury to your mouth, lips, or tongue?', YN, ['9913']),

  // ── II.9 Women's Health / Female Reproductive Organs ─────────────────────
  q('II.9', 1, 'During qualifying military service, have you been diagnosed with and/or treated for any of the following? (check all that apply): Fibroids; Endometriosis (date, diagnosed by laparoscopy?); Rectocele or cystocele; Polycystic Ovarian Syndrome (PCOS); Infertility/difficulty getting pregnant; Recurrent miscarriage; Ovarian cancer; Cervical cancer; Uterine/endometrial cancer; Breast cancer; Bone loss or osteoporosis; Frequent urinary tract infections; Urinary or fecal incontinence', FREE),
  q('II.9', 2, 'Please provide additional details for all marked disorders in question 1 (for example: date diagnosed, treatment, medications, and treatment center).', FREE),
  q('II.9', 3, 'During qualifying military service, have you had any of the following surgeries or injuries? (check all that apply): Breast surgery or biopsy; Hysterectomy; Other uterine surgery (C-section, D&C, endometrial ablation, fibroid removal); Oophorectomy (one or both ovaries); Other ovarian surgery; Tubal surgery including tubal ligation; Surgery for urinary/fecal incontinence; LEEP or cervical cone biopsy; Vaginal/vulvar surgery or injury', FREE),
  q('II.9', 4, 'Please provide additional detail for all marked surgeries in question 3 (for example: date diagnosed, treatment center).', FREE),
  q('II.9', 5, 'Pregnancy. List all pregnancies and associated outcomes and conditions (date, delivery type, losses, complications such as depression, anxiety, high blood pressure, preeclampsia, gestational diabetes, treatment location).', FREE),
  q('II.9', 6, 'Have you ever had a breast cancer screening (mammogram)? If yes, when was your last screening (YYYYMM)?', YNU),
  q('II.9', 7, 'Have you ever had an abnormal mammogram result? If yes, when and what was the result, and what treatment or follow-up care did you receive?', YNU),
  q('II.9', 8, 'Have you ever had a cervical cancer screening (Pap and/or HPV test)? If yes, when was your last screening (YYYYMM)?', YNU),
  q('II.9', 9, 'Have you ever had an abnormal result showing cancer or pre-cancer or a positive HPV test? If yes, when and what was the result, and what treatment or follow-up care did you receive?', YNU),
  q('II.9', 10, 'Are you still having menses (periods)? If yes, date of last menstrual period. If no or unsure, why not (postmenopausal, hysterectomy, hormonal suppression, pregnant, lactating, other)?', YNU),
  q('II.9', 11, 'Are you currently experiencing any of the following? (check all that apply): Pelvic pain; Current or recent genital lesions; Pelvic inflammatory disease, uterus prolapse, or displacement; Pain during intercourse; Leakage of urine affecting work/social activities; Leakage of stool; Low libido; Bleeding after menopause; No', FREE),

  // ── II.10.1 PTSD Screen ───────────────────────────────────────────────────
  q('II.10.1', 1, 'Had nightmares about the event(s) or thought about the event(s) when you did not want to?', YN, ['9411']),
  q('II.10.1', 2, 'Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?', YN, ['9411']),
  q('II.10.1', 3, 'Been constantly on guard, watchful, or easily startled?', YN, ['9411']),
  q('II.10.1', 4, 'Felt numb or detached from people, activities, or your surroundings?', YN, ['9411']),
  q('II.10.1', 5, 'Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?', YN, ['9411']),

  // ── II.10.2 Depression Screen ─────────────────────────────────────────────
  q('II.10.2', 1, 'Little interest or pleasure in doing things?', FREQ, ['9434']),
  q('II.10.2', 2, 'Feeling down, depressed, or hopeless?', FREQ, ['9434']),

  // ── II.10.3 Alcohol Use Screen ────────────────────────────────────────────
  q('II.10.3', 1, 'How often did you have a drink containing alcohol in the past year?', ['Never', 'Monthly or less', '2-4 times a month', '2-3 times per week', '4 or more times a week']),
  q('II.10.3', 2, 'How many drinks containing alcohol did you have on a typical day when you were drinking in the past year?', ['1 or 2', '3 or 4', '5 or 6', '7 to 9', '10 or more']),
  q('II.10.3', 3, 'For men: How often did you have six or more drinks on one occasion in the past year?', BINGE),
  q('II.10.3', 4, 'For women: How often did you have four or more drinks on one occasion in the past year?', BINGE),
];
