"""Curated medical / scientific vocabulary used for deterministic term extraction.

This is intentionally a *finite, transparent* list. The mock engine only ever
surfaces terms that literally appear in the source text — it never invents them.
"""
from __future__ import annotations

# Common medical terms, conditions, measures and study concepts.
MEDICAL_TERMS: list[str] = [
    # study design
    "randomized controlled trial", "randomised controlled trial", "double-blind",
    "single-blind", "placebo-controlled", "cohort study", "case-control",
    "cross-sectional", "meta-analysis", "systematic review", "retrospective",
    "prospective", "observational", "open-label", "crossover", "multicenter",
    "multicentre", "phase iii", "phase ii", "phase i", "pilot study",
    # statistics
    "confidence interval", "hazard ratio", "odds ratio", "relative risk",
    "risk ratio", "p-value", "statistical significance", "intention-to-treat",
    "per-protocol", "number needed to treat", "standard deviation",
    "interquartile range", "median", "mean", "primary endpoint",
    "secondary endpoint", "adverse events", "efficacy", "safety",
    # conditions
    "diabetes", "type 2 diabetes", "type 1 diabetes", "hypertension",
    "myocardial infarction", "heart failure", "stroke", "cardiovascular disease",
    "coronary artery disease", "atrial fibrillation", "cancer", "carcinoma",
    "tumor", "tumour", "metastasis", "chemotherapy", "immunotherapy",
    "radiotherapy", "obesity", "chronic kidney disease", "sepsis",
    "pneumonia", "covid-19", "sars-cov-2", "asthma", "copd", "depression",
    # measures / markers
    "hba1c", "ldl", "hdl", "cholesterol", "blood pressure", "systolic",
    "diastolic", "bmi", "ejection fraction", "biomarker", "glucose",
    "insulin", "creatinine", "troponin", "progression-free survival",
    "overall survival", "quality of life", "mortality", "morbidity",
    # interventions
    "metformin", "statin", "aspirin", "anticoagulant", "beta-blocker",
    "ace inhibitor", "monoclonal antibody", "vaccine", "placebo",
]

# Acronyms that should be preserved verbatim if present.
KNOWN_ACRONYMS: set[str] = {
    "RCT", "HR", "OR", "RR", "CI", "ITT", "NNT", "SD", "IQR", "BMI",
    "LDL", "HDL", "HbA1c", "COPD", "CVD", "CAD", "AF", "MI", "PFS", "OS",
    "QoL", "ECG", "MRI", "CT", "PCR", "FDA", "WHO", "ARR", "AE",
}

STUDY_TYPE_HINTS: dict[str, str] = {
    "randomized controlled trial": "Randomized Controlled Trial (RCT)",
    "randomised controlled trial": "Randomized Controlled Trial (RCT)",
    "meta-analysis": "Meta-analysis",
    "systematic review": "Systematic Review",
    "cohort study": "Cohort Study",
    "case-control": "Case-Control Study",
    "cross-sectional": "Cross-Sectional Study",
    "retrospective": "Retrospective Study",
    "prospective": "Prospective Study",
    "observational": "Observational Study",
    "pilot study": "Pilot Study",
}

# Words that commonly introduce hedged / uncertain findings.
UNCERTAINTY_MARKERS: list[str] = [
    "may", "might", "could", "suggest", "suggests", "possible", "possibly",
    "potential", "appears", "seem", "seems", "likely", "unclear", "uncertain",
    "warrant", "warrants", "further research", "further study", "not significant",
    "no significant", "did not reach", "trend toward", "trend towards",
]
